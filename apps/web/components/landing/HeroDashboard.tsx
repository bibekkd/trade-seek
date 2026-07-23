"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  Shield,
  Activity,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Sliders,
  DollarSign,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

export default function HeroDashboard() {
  const [activeTab, setActiveTab] = useState<"strategy" | "positions" | "risk">("strategy");
  const [isRunning, setIsRunning] = useState(true);

  // Mouse Parallax Physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-300, 300], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-300, 300], [-8, 8]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full max-w-[660px] mx-auto perspective-1000 group cursor-default"
    >
      {/* Outer Glow Halo */}
      <div className="absolute -inset-[6px] bg-gradient-to-r from-[#B8D957]/30 via-[#8D63FF]/30 to-[#66A7FF]/30 rounded-[32px] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

      {/* Main Terminal Box */}
      <div className="relative bg-[#171B22]/90 border border-white/[0.1] rounded-[28px] p-[20px] md:p-[24px] shadow-2xl backdrop-blur-2xl text-white">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-[16px] border-b border-white/[0.08] mb-[20px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#FF5C5C]/80" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#EAB308]/80" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#22C55E]/80" />
            <span className="ml-[8px] text-xs font-mono text-[#98A2B3] flex items-center gap-[8px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#B8D957] animate-pulse" />
              TradeSeek AI Terminal v2.4 — Live
            </span>
          </div>
          <div className="flex items-center gap-[8px]">
            <span className="px-[10px] py-[4px] rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold border border-[#22C55E]/20 flex items-center gap-[6px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#22C55E]" />
              Zerodha Kite Connected
            </span>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-3 gap-[12px] mb-[20px]">
          <div className="p-[14px] rounded-2xl bg-[#11151C]/90 border border-white/[0.06]">
            <span className="text-[11px] text-[#98A2B3] font-medium block">Total Portfolio</span>
            <div className="flex items-baseline gap-[6px] mt-[4px]">
              <span className="text-lg font-bold font-mono tracking-tight text-white tabular-nums">₹12,48,500</span>
              <span className="text-xs font-semibold text-[#22C55E] flex items-center">
                <ArrowUpRight className="w-[12px] h-[12px]" />
                +18.4%
              </span>
            </div>
          </div>

          <div className="p-[14px] rounded-2xl bg-[#11151C]/90 border border-white/[0.06]">
            <span className="text-[11px] text-[#98A2B3] font-medium block">Active AI Copilot</span>
            <div className="flex items-center gap-[6px] mt-[4px]">
              <span className="text-sm font-bold text-[#B8D957] flex items-center gap-[4px]">
                <Sparkles className="w-[16px] h-[16px]" />
                NIFTY Scalper
              </span>
            </div>
          </div>

          <div className="p-[14px] rounded-2xl bg-[#11151C]/90 border border-white/[0.06]">
            <span className="text-[11px] text-[#98A2B3] font-medium block">Max Drawdown Guard</span>
            <div className="flex items-center gap-[6px] mt-[4px]">
              <span className="text-sm font-bold text-[#66A7FF] flex items-center gap-[4px]">
                <Shield className="w-[14px] h-[14px]" />
                1.2% (Safe)
              </span>
            </div>
          </div>
        </div>

        {/* Live Candlestick & Signal Graph Simulation */}
        <div className="p-[16px] rounded-2xl bg-[#11151C]/80 border border-white/[0.06] mb-[20px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-[12px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-xs font-bold text-white font-mono">NIFTY 50 Index (15M)</span>
              <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 px-[8px] py-[2px] rounded-md">24,580.45 (+0.82%)</span>
            </div>
            <span className="text-[11px] text-[#98A2B3] font-mono">Signal: BUY 24600 CE</span>
          </div>

          {/* SVG Chart Wave Simulation */}
          <div className="h-[110px] w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B8D957" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#B8D957" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill Area */}
              <path
                d="M 0,80 Q 75,60 150,70 T 300,35 T 420,20 L 500,10 L 500,100 L 0,100 Z"
                fill="url(#chartGradient)"
              />
              {/* Line */}
              <motion.path
                d="M 0,80 Q 75,60 150,70 T 300,35 T 420,20 L 500,10"
                fill="none"
                stroke="#B8D957"
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              {/* Buy Signal Dot */}
              <circle cx="300" cy="35" r="4" fill="#22C55E" className="animate-ping" />
              <circle cx="300" cy="35" r="4" fill="#22C55E" />
              <text x="280" y="22" fill="#22C55E" fontSize="10" fontWeight="bold" fontFamily="monospace">
                AI BUY @ 24,540
              </text>
            </svg>
          </div>
        </div>

        {/* Live Positions List */}
        <div className="space-y-[8px]">
          <div className="text-[11px] uppercase tracking-wider text-[#98A2B3] font-semibold px-[4px] flex items-center justify-between">
            <span>Live Automated Orders</span>
            <span className="text-[#B8D957]">2 Open Positions</span>
          </div>

          <div className="p-[12px] rounded-xl bg-[#1F2631]/60 border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-[10px]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
              <div>
                <span className="font-bold text-white font-mono block">NIFTY 24600 CE</span>
                <span className="text-[10px] text-[#98A2B3]">50 Qty • Avg ₹142.50</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold font-mono text-[#22C55E] text-sm block tabular-nums">+₹8,450.00</span>
              <span className="text-[10px] text-[#22C55E]">+24.5%</span>
            </div>
          </div>

          <div className="p-[12px] rounded-xl bg-[#1F2631]/60 border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-[10px]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
              <div>
                <span className="font-bold text-white font-mono block">RELIANCE JUL FUT</span>
                <span className="text-[10px] text-[#98A2B3]">250 Qty • Avg ₹3,120.00</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold font-mono text-[#22C55E] text-sm block tabular-nums">+₹12,400.00</span>
              <span className="text-[10px] text-[#22C55E]">+1.8%</span>
            </div>
          </div>
        </div>

        {/* Bottom AI Status Bar */}
        <div className="mt-[16px] pt-[12px] border-t border-white/[0.06] flex items-center justify-between text-xs text-[#98A2B3]">
          <div className="flex items-center gap-[8px]">
            <Sparkles className="w-[14px] h-[14px] text-[#B8D957]" />
            <span>AI Risk Guard: Monitoring SEBI Margin rules</span>
          </div>
          <span className="font-mono text-[11px] text-white/50">Latency: 12ms</span>
        </div>
      </div>

      {/* Floating Micro Card Accent 1 */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[24px] -right-[24px] hidden sm:flex items-center gap-[12px] p-[14px] rounded-2xl bg-[#171B22]/95 border border-[#B8D957]/30 shadow-2xl backdrop-blur-xl z-20 text-xs"
      >
        <div className="w-[36px] h-[36px] rounded-xl bg-[#B8D957]/10 flex items-center justify-center text-[#B8D957]">
          <Zap className="w-[20px] h-[20px]" />
        </div>
        <div>
          <span className="text-[10px] text-[#98A2B3] uppercase tracking-wider font-semibold block">Execution Speed</span>
          <span className="font-mono font-bold text-white text-sm">0.02 Seconds</span>
        </div>
      </motion.div>

      {/* Floating Micro Card Accent 2 */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-[24px] -left-[24px] hidden sm:flex items-center gap-[12px] p-[14px] rounded-2xl bg-[#171B22]/95 border border-[#8D63FF]/30 shadow-2xl backdrop-blur-xl z-20 text-xs"
      >
        <div className="w-[36px] h-[36px] rounded-xl bg-[#8D63FF]/10 flex items-center justify-center text-[#8D63FF]">
          <Shield className="w-[20px] h-[20px]" />
        </div>
        <div>
          <span className="text-[10px] text-[#98A2B3] uppercase tracking-wider font-semibold block">Broker Sync</span>
          <span className="font-bold text-white text-xs">Zerodha • Dhan • Fyers</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
