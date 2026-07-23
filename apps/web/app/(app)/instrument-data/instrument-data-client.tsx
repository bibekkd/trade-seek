"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getCandles } from "@/lib/api";
import type { Candle, Instrument } from "@/lib/api";
import LocalMarketChart, { VolumeBars } from "../../local-market-chart";
import {
  broadEquities,
  headlineIndices,
} from "../../market-universe";

type Props = {
  selectedSymbol: string;
  initialCandles: Candle[];
  initialError: string | null;
  start: string;
  end: string;
};

export default function InstrumentDataClient({
  selectedSymbol,
  initialCandles,
  initialError,
  start,
  end,
}: Props) {
  const provider = "fyers";
  const instruments = [...broadEquities, ...headlineIndices];
  const stocks = broadEquities;
  const indices = headlineIndices;
  const selectedInstrument =
    instruments.find((instrument) => instrument.symbol === selectedSymbol) ?? instruments[0];
  const candlesQuery = useQuery({
    queryKey: ["fyers", "instrument-candles", selectedInstrument?.symbol, "1d", start, end],
    queryFn: () =>
      selectedInstrument
        ? getCandles({ symbol: selectedInstrument.symbol, provider, start, end })
        : Promise.resolve([]),
    initialData: initialCandles,
    placeholderData: keepPreviousData,
    refetchInterval: 60 * 1000,
  });
  const candles = candlesQuery.data ?? initialCandles;
  const dataError = candlesQuery.error instanceof Error ? candlesQuery.error.message : initialError;
  const latestCandle = candles.at(-1);
  const previousCandle = candles.at(-2);

  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white">
      <section className="mb-8" aria-labelledby="instrument-heading">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-16 sm:p-24 md:p-32 shadow-subtle">
          <span className="text-[12px] font-semibold text-[#60A5FA] uppercase tracking-wider block mb-1">
            Selected FYERS Candles
          </span>
          <h1 id="instrument-heading" className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight">
            Instrument Data Explorer
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#A3A8B3] mt-2 max-w-[700px] leading-relaxed">
            Inspect daily OHLCV candles for selected NSE instruments without loading the table on the home dashboard.
          </p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="explorer-heading">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-1">Explorer Workspace</span>
            <h2 id="explorer-heading" className="text-[20px] font-bold text-white">{selectedInstrument?.name ?? "Instrument"} Candles</h2>
          </div>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-3 py-2.5 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-full text-[13px] font-semibold text-white transition-colors hover:bg-[#202631]"
            href="/"
          >
            Dashboard
          </motion.a>
        </div>

        {candlesQuery.isFetching && (
          <div className="text-[13px] text-[#B7D65C] bg-[#B7D65C]/10 border border-[#B7D65C]/20 px-4 py-2 rounded-xl">
            Refreshing FYERS candles...
          </div>
        )}
        {dataError && (
          <div className="text-[13px] text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-4 py-2 rounded-xl">
            {dataError}
          </div>
        )}

        <motion.section
          whileHover={{ y: -2 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-24 shadow-subtle"
          aria-labelledby="instrument-selector-heading"
        >
          <div className="mb-4">
            <strong id="instrument-selector-heading" className="text-[15px] font-bold text-white">Available Instruments</strong>
            <p className="text-[12px] text-[#6F7787] mt-0.5">{instruments.length} total · Choose a stock or index</p>
          </div>
          <div className="space-y-4">
            <InstrumentGroup label="Stocks" instruments={stocks} selectedSymbol={selectedInstrument?.symbol} />
            <InstrumentGroup label="Indices" instruments={indices} selectedSymbol={selectedInstrument?.symbol} />
          </div>
        </motion.section>

        <motion.section
          whileHover={{ y: -2 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-24 shadow-subtle"
          aria-labelledby="instrument-overview-heading"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider block mb-1">Trader Workspace</span>
              <h2 id="instrument-overview-heading" className="text-[22px] font-bold text-white flex items-center gap-2">
                {selectedInstrument?.symbol}
                <span className="text-[12px] px-2 py-0.5 bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05] rounded-full uppercase">{selectedInstrument?.exchange}</span>
              </h2>
              <p className="text-[13px] text-[#6F7787] mt-1">{selectedInstrument?.name} · Daily candles · Last 45 days</p>
            </div>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-[#B7D65C] hover:bg-[#B7D65C]/90 text-[#0E1117] text-[13px] font-bold rounded-full transition-all"
              href={`/charts?symbol=${encodeURIComponent(selectedInstrument?.symbol ?? "")}`}
            >
              Open full chart
            </motion.a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-16 mb-6">
            <Metric label="Last close" value={formatPrice(latestCandle?.close)} />
            <Metric label="Day move" value={formatMove(latestCandle, previousCandle)} tone={moveTone(latestCandle, previousCandle)} />
            <Metric label="Session high" value={formatPrice(latestCandle?.high)} />
            <Metric label="Session low" value={formatPrice(latestCandle?.low)} />
            <Metric label="Volume" value={formatVolume(latestCandle?.volume)} />
          </div>

          {candles.length > 1 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              <motion.div
                whileHover={{ y: -2 }}
                className="lg:col-span-8 bg-[#171B22] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 shadow-subtle transition-colors"
              >
                <div className="mb-4">
                  <strong className="text-[14px] font-bold text-white">Price Trend</strong>
                  <p className="text-[11px] text-[#6F7787] mt-0.5">FYERS · 1D interval</p>
                </div>
                <div className="h-[280px] w-full">
                  <LocalMarketChart candles={candles} />
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="lg:col-span-4 bg-[#171B22] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-20 shadow-subtle transition-colors"
              >
                <div className="mb-4">
                  <strong className="text-[14px] font-bold text-white">Volume Activity</strong>
                  <p className="text-[11px] text-[#6F7787] mt-0.5">Last 30 sessions</p>
                </div>
                <div className="h-[280px] w-full flex items-end">
                  <VolumeBars candles={candles} />
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#6F7787] text-[13px]">Not enough candle data to draw the instrument chart.</div>
          )}
        </motion.section>

        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#6F7787] font-semibold uppercase text-[11px] tracking-wider bg-white/[0.01]">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Open</th>
                  <th className="py-4 px-6 text-right">High</th>
                  <th className="py-4 px-6 text-right">Low</th>
                  <th className="py-4 px-6 text-right">Close</th>
                  <th className="py-4 px-6 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {candles.map((candle) => (
                  <tr key={`${candle.symbol}-${candle.timestamp}`} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors h-[72px]">
                    <td className="py-4 px-6 text-[#A3A8B3]">
                      {new Date(candle.timestamp).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">₹{formatPrice(candle.open)}</td>
                    <td className="py-4 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">₹{formatPrice(candle.high)}</td>
                    <td className="py-4 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">₹{formatPrice(candle.low)}</td>
                    <td className="py-4 px-6 text-right font-semibold font-mono text-white font-variant-numeric: tabular-nums">₹{formatPrice(candle.close)}</td>
                    <td className="py-4 px-6 text-right font-mono text-[#A3A8B3] font-variant-numeric: tabular-nums">
                      {Number(candle.volume).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function InstrumentGroup({
  label,
  instruments,
  selectedSymbol,
}: {
  label: string;
  instruments: Instrument[];
  selectedSymbol?: string;
}) {
  return (
    <div>
      <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {instruments.map((instrument) => {
          const isActive = instrument.symbol === selectedSymbol;
          return (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${isActive
                ? "bg-[#B7D65C] border-[#B7D65C] text-[#0E1117]"
                : "bg-[#171B22]/50 border-white/[0.05] text-[#A3A8B3] hover:bg-[#202631] hover:text-white"
                }`}
              href={`/instrument-data?symbol=${encodeURIComponent(instrument.symbol)}`}
              key={`${instrument.exchange}-${instrument.symbol}`}
            >
              {instrument.symbol.replace(/^NSE:/, "")}
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const isUp = tone === "positive";
  const isDown = tone === "negative";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-[#171B22] border border-white/[0.06] hover:border-white/[0.12] rounded-[18px] p-16 flex flex-col shadow-subtle transition-colors"
    >
      <span className="text-[11px] text-[#6F7787] uppercase tracking-wider font-semibold">{label}</span>
      <strong className={`text-[16px] font-bold mt-1 font-variant-numeric: tabular-nums ${isUp ? "text-[#58D68D]" : isDown ? "text-[#FF6B6B]" : "text-white"
        }`}>
        {value}
      </strong>
    </motion.div>
  );
}

function formatPrice(value?: string): string {
  if (!value) return "-";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function formatVolume(value?: string): string {
  if (!value) return "-";
  return Number(value).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 });
}

function formatMove(latest?: Candle, previous?: Candle): string {
  if (!latest || !previous) return "-";
  const move = Number(latest.close) - Number(previous.close);
  const pct = Number(previous.close) === 0 ? 0 : (move / Number(previous.close)) * 100;
  return `${move >= 0 ? "+" : ""}${move.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`;
}

function moveTone(latest?: Candle, previous?: Candle): string {
  if (!latest || !previous) return "";
  return Number(latest.close) >= Number(previous.close) ? "positive" : "negative";
}
