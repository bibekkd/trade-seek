import { motion } from "framer-motion";
import type { BacktestMetrics, BacktestRun } from "@/lib/api";

type Props = {
  run: BacktestRun;
  title?: string;
  showWindows?: boolean;
};

export default function BacktestResultView({ run, title = "Backtest report", showWindows = false }: Props) {
  const metrics = run.metrics;
  if (!metrics) return null;

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold block">Completed Result</span>
          <h3 className="text-[15px] font-bold text-white mt-0.5">{title}</h3>
        </div>
        <span className="px-2.5 py-0.5 bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05] rounded-full text-[11px] font-semibold font-mono">
          {run.symbol.replace("NSE:", "")} · {run.timeframe}
        </span>
      </div>

      {showWindows ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <MetricWindow title="In-sample training split" metrics={metrics.in_sample} />
          <MetricWindow title="Out-of-sample testing split" metrics={metrics.out_of_sample} primary />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
          {metricCards(metrics.out_of_sample).map(([label, value]) => {
            const isReturn = label.includes("return") || label.includes("CAGR");
            const isUp = isReturn && !value.startsWith("-");
            return (
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 flex flex-col shadow-subtle transition-colors"
                key={label}
              >
                <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold">{label}</span>
                <strong className={`text-[16px] font-bold mt-1 font-mono font-variant-numeric: tabular-nums ${
                  isReturn ? (isUp ? "text-[#58D68D]" : "text-[#FF6B6B]") : "text-white"
                }`}>
                  {value}
                </strong>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inner helper component
function MetricWindow({
  title,
  metrics,
  primary = false,
}: {
  title: string;
  metrics: BacktestMetrics;
  primary?: boolean;
}) {
  return (
    <div className={`border rounded-[24px] p-20 shadow-subtle transition-all ${
      primary ? "bg-[#1A1F27]/80 border-[#60A5FA]/40" : "bg-[#171B22]/30 border-white/[0.04]"
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[13px] font-bold text-white">{title}</h4>
        {primary && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">Primary Test</span>}
      </div>
      <div className="grid grid-cols-2 gap-12">
        {metricCards(metrics).map(([label, value]) => {
          const isReturn = label.includes("return") || label.includes("CAGR");
          const isUp = isReturn && !value.startsWith("-");
          return (
            <div className="bg-[#171B22] border border-white/[0.06] rounded-[16px] p-12 flex flex-col" key={label}>
              <span className="text-[10px] text-[#6F7787] uppercase tracking-wider font-semibold">{label}</span>
              <strong className={`text-[14px] font-bold mt-0.5 font-mono font-variant-numeric: tabular-nums ${
                isReturn ? (isUp ? "text-[#58D68D]" : "text-[#FF6B6B]") : "text-white"
              }`}>
                {value}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function metricCards(metrics: BacktestMetrics): Array<[string, string]> {
  return [
    ["Total return", `${metrics.total_return_pct.toFixed(2)}%`],
    ["CAGR", `${metrics.cagr_pct.toFixed(2)}%`],
    ["Sharpe ratio", metrics.sharpe.toFixed(2)],
    ["Max drawdown", `${metrics.max_drawdown_pct.toFixed(2)}%`],
    ["Win rate", `${metrics.win_rate_pct.toFixed(2)}%`],
    ["Trade count", String(metrics.number_of_trades)],
  ];
}
