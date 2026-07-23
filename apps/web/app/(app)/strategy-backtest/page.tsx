import BacktestWorkspace from "../../backtest-workspace";
import { broadEquities } from "../../market-universe";
import ResearchWorkspace from "../../research-workspace";

export const dynamic = "force-dynamic";

type StrategyBacktestPageProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default function StrategyBacktestPage({ searchParams }: StrategyBacktestPageProps) {
  const instruments = broadEquities;
  const initialSymbol = searchParams?.symbol ?? instruments[0]?.symbol ?? "RELIANCE";

  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      <section className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 md:p-32 shadow-subtle mb-6 flex flex-col md:flex-row justify-between md:items-center gap-6" aria-labelledby="strategy-backtest-heading">
        <div>
          <span className="text-[12px] font-semibold text-[#B7D65C] uppercase tracking-wider block mb-1">
            Strategy Lab
          </span>
          <h1 id="strategy-backtest-heading" className="text-[28px] font-bold text-white tracking-tight">
            Create Strategy & Backtest
          </h1>
          <p className="text-[14px] text-[#A3A8B3] mt-2 max-w-[550px] leading-relaxed">
            Build validated AI strategies, compare them across 2-3 stocks, or run manual moving-average backtests on historical candles.
          </p>
        </div>
        <div className="flex gap-4" aria-label="Workflow status">
          <div className="bg-[#171B22] border border-white/[0.06] rounded-[16px] px-16 py-12 min-w-[100px]">
            <span className="text-[10px] text-[#6F7787] uppercase tracking-wider font-semibold block">Data Source</span>
            <strong className="text-[13px] font-bold text-[#60A5FA] block mt-0.5">FYERS 1D</strong>
          </div>
          <div className="bg-[#171B22] border border-white/[0.06] rounded-[16px] px-16 py-12 min-w-[100px]">
            <span className="text-[10px] text-[#6F7787] uppercase tracking-wider font-semibold block">Execution</span>
            <strong className="text-[13px] font-bold text-[#8A5CF6] block mt-0.5">Paper Only</strong>
          </div>
          <div className="bg-[#171B22] border border-white/[0.06] rounded-[16px] px-16 py-12 min-w-[100px]">
            <span className="text-[10px] text-[#6F7787] uppercase tracking-wider font-semibold block">Validation</span>
            <strong className="text-[13px] font-bold text-[#58D68D] block mt-0.5">Out-of-Sample</strong>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <ResearchWorkspace instruments={instruments} initialSymbol={initialSymbol} />
        <BacktestWorkspace instruments={instruments} initialSymbol={initialSymbol} />
      </div>
    </main>
  );
}
