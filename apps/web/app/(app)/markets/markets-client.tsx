"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Instrument } from "@/lib/api";
import {
  getMarketSnapshots,
  headlineIndices,
  marketSnapshotsQueryKey,
  recentMarketWindow,
} from "../../market-universe";
import PopularEquitiesDashboard from "../../popular-equities-dashboard";
import type { EquitySnapshot } from "../../popular-equities-dashboard";

const MotionLink = motion(Link);

type Props = {
  currentPage: number;
  pageCount: number;
  pageEquities: Instrument[];
  selectedSymbol: string;
  initialSnapshots: EquitySnapshot[];
  initialIndexSnapshots: EquitySnapshot[];
};

export default function MarketsClient({
  currentPage,
  pageCount,
  pageEquities,
  selectedSymbol,
  initialSnapshots,
  initialIndexSnapshots,
}: Props) {
  const { start, end } = recentMarketWindow();
  const snapshotsQuery = useQuery({
    queryKey: marketSnapshotsQueryKey(pageEquities, start, end),
    queryFn: () => getMarketSnapshots(pageEquities, start, end),
    initialData: initialSnapshots.length > 0 ? initialSnapshots : undefined,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchInterval: 45 * 1000,
  });
  const indicesQuery = useQuery({
    queryKey: marketSnapshotsQueryKey(headlineIndices, start, end),
    queryFn: () => getMarketSnapshots(headlineIndices, start, end),
    initialData: initialIndexSnapshots.length > 0 ? initialIndexSnapshots : undefined,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchInterval: 45 * 1000,
  });
  const hasAnyData = Boolean(snapshotsQuery.data?.length) || Boolean(indicesQuery.data?.length);
  const isInitialLoading = !hasAnyData && (snapshotsQuery.isPending || indicesQuery.isPending);

  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white">
      <section className="mb-8" aria-labelledby="markets-heading">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-16 sm:p-24 md:p-32 shadow-subtle">
          <span className="text-[12px] font-semibold text-[#B7D65C] uppercase tracking-wider block mb-1">
            FYERS Market Board
          </span>
          <h1 id="markets-heading" className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight">
            India Market Dashboard
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#A3A8B3] mt-2 max-w-[700px] leading-relaxed">
            A broader NSE watchlist across major India sectors. This page loads 10 stocks at a time so FYERS requests stay reliable.
          </p>
        </div>
      </section>

      {isInitialLoading && (
        <section className="space-y-8 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1A1F27] border border-white/[0.06] rounded-[18px] p-16 h-[90px] flex flex-col justify-between"
              >
                <div className="h-3.5 w-24 bg-white/[0.08] rounded-md" />
                <div className="h-6 w-28 bg-white/[0.1] rounded-md" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1A1F27] border border-white/[0.06] rounded-[18px] p-14 min-h-[128px] flex flex-col justify-between"
              >
                <div>
                  <div className="h-4 w-24 bg-white/[0.1] rounded-md mb-1.5" />
                  <div className="h-3 w-32 bg-white/[0.05] rounded-md" />
                </div>
                <div className="space-y-1 mt-3">
                  <div className="h-5 w-20 bg-white/[0.08] rounded-md" />
                  <div className="h-3.5 w-16 bg-white/[0.05] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isInitialLoading && (
        <>
          <PopularEquitiesDashboard
            snapshots={snapshotsQuery.data ?? initialSnapshots}
            indexSnapshots={indicesQuery.data ?? initialIndexSnapshots}
            selectedSymbol={selectedSymbol}
            eyebrow="All-sector FYERS Market Data"
            title={`100 popular NSE stocks · Page ${currentPage}`}
            showTable={false}
          />

          <nav className="flex justify-between items-center mt-8" aria-label="Market pages">
            <MotionLink
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`px-4 py-2 text-[13px] font-semibold bg-[#1A1F27] border border-white/[0.06] rounded-full text-white transition-colors hover:bg-[#202631] ${
                currentPage === 1 ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
              }`}
              href={`/markets?page=${Math.max(1, currentPage - 1)}`}
              aria-disabled={currentPage === 1}
            >
              Previous
            </MotionLink>

            <div className="flex gap-2">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                  <MotionLink
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold border transition-colors ${
                      isActive
                        ? "bg-[#B7D65C] border-[#B7D65C] text-[#0E1117]"
                        : "bg-[#1A1F27] border-white/[0.06] text-white hover:bg-[#202631]"
                    }`}
                    href={`/markets?page=${page}`}
                    key={page}
                  >
                    {page}
                  </MotionLink>
                );
              })}
            </div>

            <MotionLink
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`px-4 py-2 text-[13px] font-semibold bg-[#1A1F27] border border-white/[0.06] rounded-full text-white transition-colors hover:bg-[#202631] ${
                currentPage === pageCount ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
              }`}
              href={`/markets?page=${Math.min(pageCount, currentPage + 1)}`}
              aria-disabled={currentPage === pageCount}
            >
              Next
            </MotionLink>
          </nav>
        </>
      )}
    </main>
  );
}
