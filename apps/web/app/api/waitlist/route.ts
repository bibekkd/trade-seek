import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set(["Options Trader", "Quant Developer", "Retail Trader", "HNI / Investor"]);

let pool: Pool | undefined;
let tableReady: Promise<void> | undefined;

type WaitlistPayload = {
  email?: unknown;
  role?: unknown;
  source?: unknown;
};

export async function POST(request: NextRequest) {
  let payload: WaitlistPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const role = typeof payload.role === "string" && ROLES.has(payload.role) ? payload.role : "Retail Trader";
  const source = typeof payload.source === "string" && payload.source.trim() ? payload.source.trim().slice(0, 64) : "landing";

  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await ensureWaitlistTable();

    const id = randomUUID();
    const userAgent = request.headers.get("user-agent")?.slice(0, 1000) ?? null;
    const ipAddress = clientIp(request);

    const result = await getPool().query<{ id: string; created_at: string }>(
      `
        insert into waitlist_signups (id, email, role, source, user_agent, ip_address)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (email) do update
          set role = excluded.role,
              source = excluded.source,
              user_agent = excluded.user_agent,
              ip_address = excluded.ip_address,
              updated_at = current_timestamp
        returning id, created_at
      `,
      [id, email, role, source, userAgent, ipAddress],
    );

    return NextResponse.json({
      ok: true,
      id: result.rows[0]?.id,
      email,
      role,
    });
  } catch (error) {
    console.error("waitlist signup failed", error);
    return NextResponse.json(
      { error: "We could not save your signup right now. Please try again." },
      { status: 500 },
    );
  }
}

async function ensureWaitlistTable() {
  tableReady ??= (async () => {
    const client = await getPool().connect();
    try {
      await client.query("begin");
      await client.query(`
          create table if not exists waitlist_signups (
            id varchar(36) primary key,
            email varchar(255) not null unique,
            role varchar(64) not null,
            source varchar(64) not null default 'landing',
            user_agent text,
            ip_address varchar(64),
            created_at timestamptz not null default current_timestamp,
            updated_at timestamptz not null default current_timestamp
          )
        `);
      await client.query("create index if not exists ix_waitlist_signups_created_at on waitlist_signups (created_at)");
      await client.query(
        "create index if not exists ix_waitlist_signups_role_created_at on waitlist_signups (role, created_at)",
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  })();

  return tableReady;
}

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required for waitlist signups.");
  }

  const isLocalDatabase = /localhost|127\.0\.0\.1/.test(connectionString);
  pool = new Pool({
    connectionString,
    max: 1,
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  });

  return pool;
}

function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim().slice(0, 64) ?? null;
  return request.headers.get("x-real-ip")?.slice(0, 64) ?? null;
}
