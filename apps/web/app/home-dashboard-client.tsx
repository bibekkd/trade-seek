"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Candle, Instrument } from "@/lib/api";
import { getCandles } from "@/lib/api";
import IndicesDashboard from "./indices-dashboard";
import {
  getMarketSnapshots,
  headlineIndices,
  marketSnapshotsQueryKey,
  popularEquities,
  recentMarketWindow,
} from "./market-universe";
import type { EquitySnapshot } from "./popular-equities-dashboard";
import DashboardBento from "./dashboard-bento";

type ChartItem = {
  instrument: Instrument;
  candles: Candle[];
};

type Props = {
  initialSnapshots: EquitySnapshot[];
  initialIndexSnapshots: EquitySnapshot[];
  initialChartItems: ChartItem[];
  selectedSymbol: string;
};

export default function HomeDashboardClient({
  initialSnapshots,
  initialIndexSnapshots,
  initialChartItems,
  selectedSymbol,
}: Props) {
  const { start, end } = recentMarketWindow();
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol);

  const marketQuery = useQuery({
    queryKey: marketSnapshotsQueryKey(popularEquities, start, end),
    queryFn: () => getMarketSnapshots(popularEquities, start, end),
    initialData: initialSnapshots.length > 0 ? initialSnapshots : undefined,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchInterval: 45 * 1000,
  });

  const indexQuery = useQuery({
    queryKey: marketSnapshotsQueryKey(headlineIndices, start, end),
    queryFn: () => getMarketSnapshots(headlineIndices, start, end),
    initialData: initialIndexSnapshots.length > 0 ? initialIndexSnapshots : undefined,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchInterval: 45 * 1000,
  });

  // Fetch candles for the actively selected symbol
  const activeCandlesQuery = useQuery({
    queryKey: ["fyers", "candles", activeSymbol, start, end],
    queryFn: () => getCandles({ symbol: activeSymbol, provider: "fyers", start, end }),
    placeholderData: keepPreviousData,
    refetchInterval: 60 * 1000,
  });

  const hasAnyData =
    Boolean(marketQuery.data?.length) ||
    Boolean(indexQuery.data?.length) ||
    Boolean(activeCandlesQuery.data?.length);
  
  const isInitialLoading =
    !hasAnyData && (marketQuery.isPending || indexQuery.isPending || activeCandlesQuery.isPending);

  const snapshots = marketQuery.data ?? initialSnapshots;
  const indexSnapshots = indexQuery.data ?? initialIndexSnapshots;
  const activeCandles = activeCandlesQuery.data ?? [];

  if (isInitialLoading) {
    return (
      <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 w-32 bg-white/[0.06] rounded-md animate-pulse" />
            <div className="h-4 w-20 bg-white/[0.06] rounded-md animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1A1F27] border border-white/[0.06] rounded-[20px] p-16 h-[96px] flex flex-col justify-between animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-white/[0.08] rounded-md" />
                  <div className="h-3 w-10 bg-white/[0.05] rounded-md" />
                </div>
                <div className="h-6 w-28 bg-white/[0.08] rounded-md" />
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[230px] flex flex-col justify-between animate-pulse">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="h-3.5 w-24 bg-white/[0.08] rounded-md" />
                <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
              </div>
              <div className="h-9 w-48 bg-white/[0.1] rounded-lg mb-2" />
              <div className="h-4 w-36 bg-white/[0.06] rounded-md" />
            </div>
            <div className="h-2 w-full bg-white/[0.06] rounded-full" />
          </div>

          <div className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[230px] flex flex-col justify-between animate-pulse">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-white/[0.08]" />
                <div className="h-3.5 w-32 bg-white/[0.08] rounded-md" />
              </div>
              <div className="h-6 w-3/4 bg-white/[0.1] rounded-lg mb-2" />
              <div className="h-4 w-5/6 bg-white/[0.06] rounded-md" />
            </div>
            <div className="flex justify-between items-center border-t border-white/[0.05] pt-4">
              <div className="h-5 w-40 bg-white/[0.06] rounded-full" />
              <div className="h-4 w-28 bg-white/[0.05] rounded-md" />
            </div>
          </div>

          <div className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[420px] flex flex-col justify-between animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="h-3.5 w-36 bg-white/[0.08] rounded-md mb-2" />
                <div className="h-7 w-48 bg-white/[0.1] rounded-lg" />
              </div>
              <div className="h-8 w-28 bg-white/[0.08] rounded-lg" />
            </div>
            <div className="flex-1 w-full bg-white/[0.03] rounded-xl my-2" />
            <div className="flex justify-between items-center border-t border-white/[0.05] pt-4">
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-10 bg-white/[0.06] rounded-full" />
                ))}
              </div>
              <div className="h-4 w-44 bg-white/[0.05] rounded-md" />
            </div>
          </div>

          <div className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[420px] flex flex-col animate-pulse">
            <div className="h-3.5 w-24 bg-white/[0.08] rounded-md mb-3" />
            <div className="h-11 w-full bg-white/[0.05] rounded-[14px] mb-4" />
            <div className="space-y-3 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-full bg-white/[0.04] rounded-[16px]" />
              ))}
            </div>
          </div>

          <div className="md:col-span-6 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-36 bg-white/[0.08] rounded-md" />
              <div className="h-3.5 w-20 bg-white/[0.06] rounded-md" />
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 w-full bg-white/[0.04] rounded-[16px]" />
              ))}
            </div>
          </div>

          <div className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="h-3.5 w-28 bg-white/[0.08] rounded-md" />
                <div className="w-5 h-5 bg-white/[0.08] rounded-full" />
              </div>
              <div className="h-24 w-full bg-white/[0.04] rounded-[16px] mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/[0.05] rounded-md" />
                <div className="h-4 w-full bg-white/[0.05] rounded-md" />
              </div>
            </div>
            <div className="h-11 w-full bg-white/[0.06] rounded-full mt-4" />
          </div>

          <div className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="h-3.5 w-28 bg-white/[0.08] rounded-md" />
                <div className="w-5 h-5 bg-white/[0.08] rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-white/[0.04] rounded-lg" />
                ))}
              </div>
            </div>
            <div className="h-11 w-full bg-white/[0.06] rounded-full mt-4" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <IndicesDashboard snapshots={indexSnapshots} />
      <DashboardBento
        snapshots={snapshots}
        selectedSymbol={activeSymbol}
        onSelectSymbol={setActiveSymbol}
        candles={activeCandles}
      />
    </main>
  );
}

