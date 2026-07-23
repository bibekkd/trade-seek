"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Zap, Layers, RefreshCw, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<"lab" | "risk" | "brokers" | "signals">("lab");

  const tabs = [
    { id: "lab", name: "Strategy Lab", icon: Activity },
    { id: "risk", name: "Risk Guards", icon: ShieldCheck },
    { id: "brokers", name: "Broker Webhooks", icon: Zap },
    { id: "signals", name: "Signal Stream", icon: Layers },
  ];

  return (
    <section className="py-[96px] md:py-[128px] relative z-10 bg-[#0B0D10]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[48px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#66A7FF] mb-[16px]"
          >
            <Activity className="w-[14px] h-[14px]" />
            <span>Interactive Terminal Preview</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            A terminal built for speed & intelligence.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            Explore the inner workings of TradeSeek&apos;s workspace—from multi-legged options strategies to risk controls.
          </motion.p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-[12px] mb-[40px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-[8px] px-[20px] py-[12px] rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-[#1F2631] text-white border-white/20 shadow-lg shadow-black/50"
                    : "bg-[#171B22]/60 text-[#98A2B3] border-white/[0.06] hover:text-white hover:border-white/10"
                }`}
              >
                <Icon className={`w-[16px] h-[16px] ${activeTab === tab.id ? "text-[#B8D957]" : "text-[#98A2B3]"}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab View Container */}
        <div className="rounded-[28px] bg-[#171B22] border border-white/10 p-[24px] md:p-[32px] shadow-2xl backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Strategy Lab */}
            {activeTab === "lab" && (
              <motion.div
                key="lab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-[24px]"
              >
                <div className="flex items-center justify-between pb-[16px] border-b border-white/[0.08]">
                  <span className="text-base font-bold text-white">Active Strategy Portfolio</span>
                  <span className="text-xs text-[#22C55E] font-mono font-semibold">+18.4% Net PnL (YTD)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
                  <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-xs text-[#98A2B3] block mb-[4px]">NIFTY Supertrend Scalper</span>
                    <span className="text-xl font-bold font-mono text-[#22C55E] tabular-nums">+₹1,42,800</span>
                    <span className="text-[11px] text-[#22C55E] block mt-[4px]">78.5% Win Rate (42 trades)</span>
                  </div>

                  <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-xs text-[#98A2B3] block mb-[4px]">BANKNIFTY Expiry Straddle</span>
                    <span className="text-xl font-bold font-mono text-[#B8D957] tabular-nums">+₹84,200</span>
                    <span className="text-[11px] text-[#B8D957] block mt-[4px]">82.1% Win Rate (18 trades)</span>
                  </div>

                  <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06]">
                    <span className="text-xs text-[#98A2B3] block mb-[4px]">RELIANCE VWAP Reversion</span>
                    <span className="text-xl font-bold font-mono text-[#66A7FF] tabular-nums">+₹45,600</span>
                    <span className="text-[11px] text-[#66A7FF] block mt-[4px]">71.4% Win Rate (28 trades)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Risk Guards */}
            {activeTab === "risk" && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-[24px]"
              >
                <div className="flex items-center justify-between pb-[16px] border-b border-white/[0.08]">
                  <span className="text-base font-bold text-white">Dynamic Risk Management Guard</span>
                  <span className="text-xs text-[#66A7FF] font-mono">SEBI Capital Rules Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                  <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06] space-y-[12px]">
                    <span className="text-xs text-[#98A2B3] font-semibold block uppercase tracking-wider">Max Daily Drawdown Limit</span>
                    <div className="w-full bg-[#171B22] h-[12px] rounded-full overflow-hidden border border-white/10">
                      <div className="bg-[#22C55E] h-full w-[35%]" />
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white">Current: 0.52%</span>
                      <span className="text-[#FF5C5C]">Max Allowed: 1.50%</span>
                    </div>
                  </div>

                  <div className="p-[20px] rounded-2xl bg-[#11151C] border border-white/[0.06] space-y-[12px]">
                    <span className="text-xs text-[#98A2B3] font-semibold block uppercase tracking-wider">Position Sizing Shield</span>
                    <div className="flex items-center gap-[12px] text-xs">
                      <CheckCircle2 className="w-[20px] h-[20px] text-[#22C55E]" />
                      <span className="text-white font-medium">Max per-trade risk capped at 2% total equity</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Broker Webhooks */}
            {activeTab === "brokers" && (
              <motion.div
                key="brokers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-[24px]"
              >
                <div className="flex items-center justify-between pb-[16px] border-b border-white/[0.08]">
                  <span className="text-base font-bold text-white">Indian Broker Connection Latency</span>
                  <span className="text-xs text-[#B8D957] font-mono">Avg Latency: 14ms</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
                  {["Zerodha Kite", "DhanHQ", "Fyers API", "Angel One"].map((broker) => (
                    <div key={broker} className="p-[16px] rounded-2xl bg-[#11151C] border border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{broker}</span>
                      <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-[8px] py-[2px] rounded-full font-mono">Connected</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab 4: Signal Stream */}
            {activeTab === "signals" && (
              <motion.div
                key="signals"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-[16px] font-mono text-xs"
              >
                <div className="p-[14px] rounded-xl bg-[#11151C] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-[#22C55E]">[14:22:05] EXECUTE: NIFTY 24600 CE @ ₹142.50 (Qty: 50)</span>
                  <span className="text-[#98A2B3]">Latency: 12ms</span>
                </div>
                <div className="p-[14px] rounded-xl bg-[#11151C] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-[#B8D957]">[14:20:12] SIGNAL: VWAP Breakout triggered on RELIANCE JUL FUT</span>
                  <span className="text-[#98A2B3]">Accuracy: 99.8%</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
