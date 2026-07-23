import type { EquitySnapshot } from "./popular-equities-dashboard";

type Props = {
  snapshots: EquitySnapshot[];
};

export default function IndicesDashboard({ snapshots }: Props) {
  return (
    <section className="mb-6" aria-labelledby="indices-heading">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider">Market Indices</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B7D65C]/10 text-[#B7D65C] border border-[#B7D65C]/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#58D68D] animate-pulse" /> Live Quotes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16" aria-label="Top market indices">
        {snapshots.map((snapshot) => (
          <a
            className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[16px] p-16 flex flex-col justify-between transition-all duration-250 ease-in-out hover:-translate-y-0.5 shadow-subtle"
            href={`/charts?symbol=${encodeURIComponent(snapshot.instrument.symbol)}`}
            key={snapshot.instrument.symbol}
          >
            <span className="text-[12px] text-[#6F7787] font-semibold uppercase tracking-wider">{snapshot.instrument.name}</span>
            {snapshot.latest ? (
              <div className="flex justify-between items-baseline mt-1.5">
                <strong className="text-[20px] font-bold text-white font-variant-numeric: tabular-nums">{formatPrice(snapshot.latest.close)}</strong>
                <small className={`text-[12px] font-semibold font-variant-numeric: tabular-nums ${changePct(snapshot) >= 0 ? "text-[#58D68D]" : "text-[#FF6B6B]"}`}>
                  {formatSignedPct(changePct(snapshot))}
                </small>
              </div>
            ) : (
              <div className="flex justify-between items-baseline mt-1.5">
                <strong className="text-[16px] font-bold text-[#6F7787]">Unavailable</strong>
                <small className="text-[11px] text-[#6F7787]">{snapshot.error ?? "No recent quote"}</small>
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

function changeValue(snapshot: EquitySnapshot): number {
  if (!snapshot.latest || !snapshot.previous) return 0;
  return Number(snapshot.latest.close) - Number(snapshot.previous.close);
}

function changePct(snapshot: EquitySnapshot): number {
  if (!snapshot.latest || !snapshot.previous) return 0;
  const previousClose = Number(snapshot.previous.close);
  if (previousClose === 0) return 0;
  return (changeValue(snapshot) / previousClose) * 100;
}

function formatPrice(value: string): string {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatSignedPrice(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatSignedPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
