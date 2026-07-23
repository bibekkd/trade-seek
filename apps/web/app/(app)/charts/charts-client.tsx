"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getCandles } from "@/lib/api";
import type { Candle } from "@/lib/api";
import LocalMarketChart from "../../local-market-chart";
import { getChartSymbol, getInstrumentLabel } from "../../tradingview-symbols";

type Props = {
  requestedSymbol: string;
  initialCandles: Candle[];
  start: string;
  end: string;
};

export default function ChartsClient({ requestedSymbol, initialCandles, start, end }: Props) {
  const chartSymbol = getChartSymbol(requestedSymbol);
  const label = getInstrumentLabel(requestedSymbol);
  const candlesQuery = useQuery({
    queryKey: ["fyers", "candles", requestedSymbol, "1d", start, end],
    queryFn: () => getCandles({ symbol: requestedSymbol, provider: "fyers", start, end }),
    initialData: initialCandles,
    placeholderData: keepPreviousData,
    refetchInterval: 60 * 1000,
  });
  const candles = candlesQuery.data ?? initialCandles;

  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white">
      <section className="space-y-6" aria-labelledby="chart-heading">
        <div>
          <a
            className="inline-flex items-center gap-2 text-[13px] text-[#B7D65C] hover:text-white font-semibold transition-all px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08]"
            href="/"
          >
            ← Back to dashboard
          </a>
        </div>

        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-16 sm:p-24 md:p-32 shadow-subtle flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider block mb-1">
              TradingView Chart
            </span>
            <h1 id="chart-heading" className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight">
              {label}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#A3A8B3] mt-2 max-w-[600px] leading-relaxed">
              Interactive NSE chart with historic moving average indicator and volume profile.
            </p>
          </div>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-full text-[13px] font-semibold text-white transition-colors hover:bg-[#202631]"
            href={`/markets?symbol=${encodeURIComponent(requestedSymbol)}`}
          >
            Open Markets
          </motion.a>
        </div>

        {candlesQuery.isFetching && (
          <div className="text-[13px] text-[#B7D65C] bg-[#B7D65C]/10 border border-[#B7D65C]/20 px-4 py-2.5 rounded-xl">
            Refreshing FYERS candles...
          </div>
        )}

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-4 sm:p-6 shadow-subtle"
        >
          {candles.length > 1 ? (
            <div className="h-[320px] sm:h-[450px] md:h-[550px]">
              <LocalMarketChart candles={candles} />
            </div>
          ) : (
            <div className="py-24 text-center text-[#6F7787] text-[14px]">
              No FYERS candle data is available for this symbol right now.
            </div>
          )}
        </motion.div>

        <p className="text-[12px] text-[#6F7787] text-center mt-4">
          Showing FYERS daily candle data in-app.{" "}
          <a className="text-[#B7D65C] hover:underline" href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(chartSymbol)}`} target="_blank" rel="noreferrer">
            Open {label} on TradingView ↗
          </a>
        </p>
      </section>
    </main>
  );
}
