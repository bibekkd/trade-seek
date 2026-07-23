"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Bot,
  Sparkles,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  Sliders,
  ChevronRight,
  Search,
} from "lucide-react";
import type { EquitySnapshot } from "./popular-equities-dashboard";
import type { Candle } from "@/lib/api";

type Props = {
  snapshots: EquitySnapshot[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  candles: Candle[];
};

export default function DashboardBento({
  snapshots,
  selectedSymbol,
  onSelectSymbol,
  candles,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get active snapshot details
  const activeSnapshot = useMemo(() => {
    return snapshots.find((s) => s.instrument.symbol === selectedSymbol) || null;
  }, [snapshots, selectedSymbol]);

  // Format price helper
  const formatPrice = (val: string | number) => {
    return Number(val).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  // Format large volumes
  const formatVolume = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
    return val.toLocaleString("en-IN");
  };

  // Sparkline generator (SVG)
  const renderSparkline = (snapshot: EquitySnapshot) => {
    const isUp = (snapshot.latest && snapshot.previous)
      ? Number(snapshot.latest.close) >= Number(snapshot.previous.close)
      : true;

    // Create simple spark coords
    return (
      <svg className="w-16 h-7 sm:w-20 sm:h-8 flex-shrink-0" viewBox="0 0 100 30">
        <polyline
          fill="none"
          stroke={isUp ? "#58D68D" : "#FF6B6B"}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={isUp ? "0,25 20,20 40,24 60,14 80,18 100,5" : "0,5 20,12 40,8 60,20 80,18 100,25"}
        />
      </svg>
    );
  };

  // Filter snapshots based on search query
  const filteredSnapshots = useMemo(() => {
    if (!searchQuery) return snapshots;
    return snapshots.filter(
      (s) =>
        s.instrument.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.instrument.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [snapshots, searchQuery]);

  // Recharts custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#171B22] border border-white/[0.08] px-4 py-3 rounded-xl shadow-subtle">
          <p className="text-[12px] text-[#6F7787] mb-1">
            {new Date(data.timestamp).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-6">
              <span className="text-[13px] text-[#A3A8B3]">Price:</span>
              <strong className="text-[13px] text-white font-mono">
                ₹{formatPrice(data.close)}
              </strong>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[13px] text-[#A3A8B3]">Volume:</span>
              <span className="text-[13px] text-[#A3A8B3] font-mono">
                {formatVolume(Number(data.volume))}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Active Symbol Close and Move calculations
  const priceChange = useMemo(() => {
    if (!activeSnapshot || !activeSnapshot.latest || !activeSnapshot.previous) return 0;
    return Number(activeSnapshot.latest.close) - Number(activeSnapshot.previous.close);
  }, [activeSnapshot]);

  const priceChangePct = useMemo(() => {
    if (!activeSnapshot || !activeSnapshot.latest || !activeSnapshot.previous) return 0;
    const prev = Number(activeSnapshot.previous.close);
    return prev !== 0 ? (priceChange / prev) * 100 : 0;
  }, [activeSnapshot, priceChange]);

  // Transform candles for Recharts
  const chartData = useMemo(() => {
    return candles.map((c) => ({
      timestamp: c.timestamp,
      close: Number(c.close),
      volume: Number(c.volume),
    }));
  }, [candles]);

  // Mock Active Positions (Single responsibility)
  const mockPositions = [
    { symbol: "NSE:RELIANCE", name: "Reliance Industries", qty: 25, entry: 2380.50, current: activeSnapshot?.instrument.symbol === "NSE:RELIANCE" ? Number(activeSnapshot.latest?.close ?? 2450) : 2465.10 },
    { symbol: "NSE:TCS", name: "Tata Consultancy Services", qty: 12, entry: 3790.00, current: activeSnapshot?.instrument.symbol === "NSE:TCS" ? Number(activeSnapshot.latest?.close ?? 3850) : 3892.40 },
    { symbol: "NSE:INFY", name: "Infosys Limited", qty: 40, entry: 1420.00, current: activeSnapshot?.instrument.symbol === "NSE:INFY" ? Number(activeSnapshot.latest?.close ?? 1445) : 1442.80 },
  ];

  // Calculate overall portfolio metrics
  const portfolioStats = useMemo(() => {
    const totalCost = mockPositions.reduce((acc, pos) => acc + pos.qty * pos.entry, 0);
    const currentValue = mockPositions.reduce((acc, pos) => acc + pos.qty * pos.current, 0);
    const pl = currentValue - totalCost;
    const plPct = totalCost !== 0 ? (pl / totalCost) * 100 : 0;
    const cash = 840500.00;
    return {
      totalValue: currentValue + cash,
      equityValue: currentValue,
      cash,
      pl,
      plPct,
    };
  }, [mockPositions]);

  // Strategy Crossover check
  const strategyStatus = useMemo(() => {
    if (candles.length < 20) return { signal: "NEUTRAL", score: 50, explanation: "Insufficient historical data for SMA check" };
    // Compute simple moving average mock
    const lastClose = Number(candles[candles.length - 1]?.close ?? 0);
    const avg5 = candles.slice(-5).reduce((acc, c) => acc + Number(c.close), 0) / 5;
    const avg20 = candles.slice(-20).reduce((acc, c) => acc + Number(c.close), 0) / 20;

    const crossover = avg5 > avg20;
    return {
      signal: crossover ? "BUY" : "SELL",
      score: crossover ? 78 : 34,
      explanation: crossover
        ? "Fast SMA (5) crossed above Slow SMA (20). Strong bullish sentiment."
        : "Fast SMA (5) dropped below Slow SMA (20). Downward breakout risk."
    };
  }, [candles]);

  // Mock orders
  const mockOrders = [
    { id: "TXN-84920", type: "BUY", symbol: selectedSymbol.replace("NSE:", ""), qty: 10, price: activeSnapshot?.latest ? Number(activeSnapshot.latest.close) : 1250, status: "Executed", time: "14:24:12" },
    { id: "TXN-84901", type: "SELL", symbol: "TCS", qty: 5, price: 3885.00, status: "Executed", time: "11:05:43" },
    { id: "TXN-84882", type: "BUY", symbol: "INFY", qty: 20, price: 1435.00, status: "Cancelled", time: "09:42:01" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-white">

      {/* 1. PORTFOLIO CARD (Col-Span 4) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[200px] md:h-[230px]"
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider">Net Liquidity</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B7D65C]/10 text-[#B7D65C] border border-[#B7D65C]/20">Active</span>
          </div>
          <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-white select-all font-variant-numeric: tabular-nums">
            ₹{portfolioStats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            {portfolioStats.pl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-[#58D68D]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-[#FF6B6B]" />
            )}
            <span className={`text-[14px] font-semibold font-variant-numeric: tabular-nums ${portfolioStats.pl >= 0 ? "text-[#58D68D]" : "text-[#FF6B6B]"}`}>
              {portfolioStats.pl >= 0 ? "+" : ""}₹{portfolioStats.pl.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({portfolioStats.plPct >= 0 ? "+" : ""}{portfolioStats.plPct.toFixed(2)}%)
            </span>
            <span className="text-[13px] text-[#6F7787]">Today</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-[#A3A8B3] mb-1.5 font-medium">
            <span>Cash (40%)</span>
            <span>Equity (60%)</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden flex">
            <div className="h-full bg-[#60A5FA]" style={{ width: "40%" }} />
            <div className="h-full bg-[#8A5CF6]" style={{ width: "60%" }} />
          </div>
        </div>
      </motion.div>

      {/* 2. AI INSIGHTS CARD (Col-Span 8) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[220px] md:h-[230px] relative overflow-hidden gap-4"
      >
        {/* Decorative subtle backdrop radial gradient for premium look */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#8A5CF6]/5 to-transparent rounded-full pointer-events-none filter blur-2xl" />

        <div className="flex justify-between items-start z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-lg bg-[#8A5CF6]/10 border border-[#8A5CF6]/20">
                <Bot className="w-5 h-5 text-[#8A5CF6]" />
              </div>
              <span className="text-[12px] font-semibold text-[#8A5CF6] uppercase tracking-wider">TradeSeek AI Copilot</span>
            </div>
            <h3 className="text-[20px] font-bold text-white tracking-tight leading-snug">
              Sentiment turns <span className={strategyStatus.signal === "BUY" ? "text-[#58D68D]" : "text-[#FF6B6B]"}>{strategyStatus.signal === "BUY" ? "Bullish" : "Bearish"}</span> for {selectedSymbol.replace("NSE:", "")}
            </h3>
            <p className="text-[14px] text-[#A3A8B3] mt-2 line-clamp-2 max-w-[620px] leading-relaxed">
              {strategyStatus.explanation} TradeSeek intelligence indicates key resistance points nearby. Trailing stop orders recommended for short-term swing positions.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#6F7787] uppercase tracking-wider mb-1">Confidence</span>
            <span className="text-[18px] font-bold font-variant-numeric: tabular-nums text-white">
              {strategyStatus.score}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between z-10 border-t border-white/[0.05] pt-5">
          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
              AI Signals Active
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#B7D65C]/10 text-[#B7D65C] border border-[#B7D65C]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-pilot Enabled
            </span>
          </div>
          <span className="text-[12px] text-[#6F7787] flex items-center gap-1">
            Updated just now <span className="w-1.5 h-1.5 rounded-full bg-[#58D68D] inline-block animate-pulse" />
          </span>
        </div>
      </motion.div>

      {/* 3. CHART CARD (Col-Span 8) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[380px] md:h-[430px]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#6F7787] font-semibold uppercase tracking-wider">Interactive Terminal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">1d Interval</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-[20px] sm:text-[26px] font-bold text-white tracking-tight">
                {activeSnapshot?.instrument.name || selectedSymbol}
              </h1>
              <span className="text-[13px] sm:text-[14px] text-[#6F7787] font-semibold">
                {selectedSymbol}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-[18px] sm:text-[22px] font-bold font-variant-numeric: tabular-nums text-white">
                ₹{activeSnapshot?.latest ? formatPrice(activeSnapshot.latest.close) : "—"}
              </p>
              <p className={`text-[12px] font-semibold font-variant-numeric: tabular-nums ${priceChange >= 0 ? "text-[#58D68D]" : "text-[#FF6B6B]"}`}>
                {priceChange >= 0 ? "+" : ""}{formatPrice(priceChange)} ({priceChangePct >= 0 ? "+" : ""}{priceChangePct.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 w-full relative min-h-[200px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={priceChange >= 0 ? "#58D68D" : "#FF6B6B"} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={priceChange >= 0 ? "#58D68D" : "#FF6B6B"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "#6F7787", fontSize: 10 }}
                  tickFormatter={(t) =>
                    new Date(t).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  }
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "#6F7787", fontSize: 11 }}
                  tickFormatter={(p) => Math.round(p).toString()}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255, 255, 255, 0.08)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={priceChange >= 0 ? "#58D68D" : "#FF6B6B"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#chartGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#6F7787] text-[14px]">
              No candle data loaded for this NSE symbol.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4 border-t border-white/[0.05] pt-4">
          <div className="flex gap-2">
            {["1D", "5D", "1M", "1Y"].map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${tab === "1M"
                  ? "bg-white/[0.06] text-white border-white/[0.1]"
                  : "bg-transparent text-[#6F7787] border-transparent hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-[#6F7787] flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58D68D]" /> Live data streaming via FYERS SDK
          </div>
        </div>
      </motion.div>

      {/* 4. WATCHLIST CARD (Col-Span 4) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col min-h-[380px] md:h-[430px]"
      >
        <div className="mb-4">
          <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider block mb-2">My Watchlist</span>
          <div className="relative mb-2">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#6F7787]" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-[#171B22] border border-transparent rounded-[14px] pl-10 pr-4 text-[13px] text-white placeholder-[#6F7787] focus:outline-none focus:border-[#B7D65C]/60 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredSnapshots.map((snapshot) => {
            const sym = snapshot.instrument.symbol;
            const active = sym === selectedSymbol;
            const isUp = (snapshot.latest && snapshot.previous)
              ? Number(snapshot.latest.close) >= Number(snapshot.previous.close)
              : true;
            const change = (snapshot.latest && snapshot.previous)
              ? Number(snapshot.latest.close) - Number(snapshot.previous.close)
              : 0;
            const pct = (snapshot.latest && snapshot.previous && Number(snapshot.previous.close) !== 0)
              ? (change / Number(snapshot.previous.close)) * 100
              : 0;

            return (
              <div
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`flex justify-between items-center p-3 rounded-[16px] border cursor-pointer transition-all ${active
                  ? "bg-[#202631] border-white/[0.1]"
                  : "bg-[#171B22]/40 border-transparent hover:bg-[#202631]/40 hover:border-white/[0.06]"
                  }`}
              >
                <div className="flex flex-col">
                  <strong className="text-[14px] text-white font-semibold">
                    {sym.replace("NSE:", "")}
                  </strong>
                  <span className="text-[11px] text-[#6F7787] truncate max-w-[120px]">
                    {snapshot.instrument.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {renderSparkline(snapshot)}
                  <div className="text-right">
                    <p className="text-[13px] font-bold font-variant-numeric: tabular-nums text-white">
                      ₹{snapshot.latest ? formatPrice(snapshot.latest.close) : "—"}
                    </p>
                    <p className={`text-[11px] font-semibold font-variant-numeric: tabular-nums ${isUp ? "text-[#58D68D]" : "text-[#FF6B6B]"}`}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSnapshots.length === 0 && (
            <div className="text-center text-[#6F7787] text-[13px] py-12">No matching symbols found.</div>
          )}
        </div>
      </motion.div>

      {/* 5. POSITIONS CARD (Col-Span 6) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-6 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[320px] md:h-[360px]"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider">Active Portfolio Holdings</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8A5CF6]/10 text-[#8A5CF6] border border-[#8A5CF6]/20">Holdings</span>
          </div>
          <span className="text-[12px] text-[#6F7787] font-semibold">Total: {mockPositions.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {mockPositions.map((pos) => {
            const totalCost = pos.qty * pos.entry;
            const currentValue = pos.qty * pos.current;
            const pl = currentValue - totalCost;
            const plPct = (pl / totalCost) * 100;
            const isUp = pl >= 0;

            return (
              <div
                key={pos.symbol}
                className="flex items-center justify-between p-3.5 bg-[#171B22]/40 border border-white/[0.04] rounded-[16px] hover:border-white/[0.08] transition-all"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-[14px] text-white font-semibold">
                      {pos.symbol.replace("NSE:", "")}
                    </strong>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#A3A8B3] border border-white/[0.05]">
                      x{pos.qty}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6F7787] mt-0.5">
                    Avg. ₹{formatPrice(pos.entry)}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-[14px] font-bold font-variant-numeric: tabular-nums text-white">
                    ₹{formatPrice(currentValue)}
                  </p>
                  <p className={`text-[12px] font-semibold font-variant-numeric: tabular-nums flex items-center justify-end gap-1 ${isUp ? "text-[#58D68D]" : "text-[#FF6B6B]"}`}>
                    {isUp ? "+" : ""}₹{formatPrice(pl)} ({isUp ? "+" : ""}{plPct.toFixed(2)}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 6. STRATEGY CARD (Col-Span 3) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[320px] md:h-[360px]"
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider">Strategy Engine</span>
            <Sliders className="w-5 h-5 text-[#B7D65C]" />
          </div>

          <div className="bg-[#171B22]/50 border border-white/[0.04] p-16 rounded-[16px] mb-5">
            <span className="text-[11px] text-[#6F7787] uppercase tracking-wider block mb-1">Active Algorithm</span>
            <strong className="text-[14px] text-white">SMA Crossover (5/20)</strong>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-[12px] text-[#A3A8B3]">Signal:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${strategyStatus.signal === "BUY"
                ? "bg-[#58D68D]/10 text-[#58D68D] border border-[#58D68D]/20"
                : "bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20"
                }`}>
                {strategyStatus.signal}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#A3A8B3]">Backtest Returns:</span>
              <strong className="text-[#58D68D] font-variant-numeric: tabular-nums">+18.4%</strong>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#A3A8B3]">Win Rate:</span>
              <strong className="text-white font-variant-numeric: tabular-nums">64.2%</strong>
            </div>
          </div>
        </div>

        <a
          href={`/strategy-backtest?symbol=${selectedSymbol}`}
          className="w-full h-11 mt-4 rounded-full bg-[#171B22] border border-white/[0.06] hover:border-white/[0.12] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
          Open Strategy Lab <ChevronRight className="w-5 h-5" />
        </a>
      </motion.div>

      {/* 7. ORDERS CARD (Col-Span 3) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] hover:border-white/[0.12] rounded-[24px] p-16 sm:p-24 shadow-subtle flex flex-col justify-between min-h-[320px] md:h-[360px]"
      >
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-semibold text-[#6F7787] uppercase tracking-wider mb-2">Recent Orders</span>
            <Clock className="w-5 h-5 text-[#A3A8B3]" />
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {mockOrders.map((ord, idx) => (
              <div key={idx} className="flex justify-between items-center text-[13px] border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ord.type === "BUY" ? "bg-[#58D68D]/15 text-[#58D68D]" : "bg-[#FF6B6B]/15 text-[#FF6B6B]"
                      }`}>
                      {ord.type}
                    </span>
                    <strong className="text-white font-semibold">{ord.symbol}</strong>
                  </div>
                  <span className="text-[10px] text-[#6F7787] mt-0.5">{ord.time}</span>
                </div>

                <div className="text-right">
                  <p className="text-white font-bold font-variant-numeric: tabular-nums">
                    {ord.qty} @ ₹{formatPrice(ord.price)}
                  </p>
                  <span className={`text-[10px] font-medium ${ord.status === "Executed" ? "text-[#58D68D]" : "text-[#6F7787]"
                    }`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full h-11 text-[13px] font-semibold text-[#A3A8B3] hover:text-white bg-transparent border border-dashed border-white/[0.08] hover:border-white/[0.16] rounded-full transition-all mt-4">
          View All Order Logs
        </button>
      </motion.div>

    </div>
  );
}
