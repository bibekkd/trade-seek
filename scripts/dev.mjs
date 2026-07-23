import { spawn } from "node:child_process";

const target = process.argv[2] ?? "all";

const commands = {
  api: ["uv", ["run", "--project", "apps/api", "uvicorn", "--app-dir", "apps/api", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]],
  worker: ["uv", ["run", "--project", "apps/api", "celery", "-A", "app.celery_app.celery_app", "--workdir", "apps/api", "worker", "--loglevel=INFO"]],
  web: ["bun", ["run", "--cwd", "apps/web", "dev"]],
};

const groups = {
  backend: ["api", "worker"],
  all: ["api", "worker", "web"],
};

const selected = groups[target] ?? [target];

if (selected.some((name) => !commands[name])) {
  console.error(`Unknown dev target: ${target}`);
  console.error(`Use one of: ${[...Object.keys(commands), ...Object.keys(groups)].join(", ")}`);
  process.exit(1);
}

const children = selected.map((name) => {
  const [command, args] = commands[name];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
    // uv/celery and other dev commands may spawn grandchildren. Put each
    // service in its own process group so restart/shutdown cannot leave a
    // stale worker consuming jobs with old code.
    detached: process.platform !== "win32",
  });

  const prefix = `[${name}]`;
  child.stdout.on("data", (chunk) => writeLines(process.stdout, prefix, chunk));
  child.stderr.on("data", (chunk) => writeLines(process.stderr, prefix, chunk));
  child.on("error", (error) => {
    if (shuttingDown) return;
    console.error(`${prefix} failed to start: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`${prefix} exited${signal ? ` with signal ${signal}` : ` with code ${code}`}`);
    shutdown(code ?? 1);
  });

  return child;
});

let shuttingDown = false;

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.killed) continue;
    if (process.platform !== "win32" && child.pid) {
      try {
        process.kill(-child.pid, "SIGTERM");
        continue;
      } catch {
        // Fall back to the direct child when the process group already exited.
      }
    }
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250);
}

function writeLines(stream, prefix, chunk) {
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (line.length > 0) stream.write(`${prefix} ${line}\n`);
  }
}
