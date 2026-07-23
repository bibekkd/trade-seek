"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, ArrowUpRight, BarChart2, ShieldCheck, Zap } from "lucide-react";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] bg-[length:48px_48px]" />

      {/* Aurora Radial Glow Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.4, 0.25],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#B8D957]/20 to-[#8D63FF]/20 blur-[140px]"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.35, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#66A7FF]/20 to-[#8D63FF]/20 blur-[150px]"
      />

      {/* Floating Micro Graphic Elements (Opacity 15-25%) */}
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[18%] left-[8%] hidden xl:flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[#171B22]/80 border border-white/10 text-xs text-[#B8D957] backdrop-blur-md shadow-xl opacity-40"
      >
        <TrendingUp className="w-[14px] h-[14px]" />
        <span>NIFTY +1.45%</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 22, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[45%] left-[5%] hidden xl:flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[#171B22]/80 border border-white/10 text-xs text-[#66A7FF] backdrop-blur-md shadow-xl opacity-35"
      >
        <Sparkles className="w-[14px] h-[14px]" />
        <span>VWAP Signal Active</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[28%] right-[6%] hidden xl:flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[#171B22]/80 border border-white/10 text-xs text-[#8D63FF] backdrop-blur-md shadow-xl opacity-40"
      >
        <Zap className="w-[14px] h-[14px]" />
        <span>Zerodha Webhook Connected</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-[68%] right-[8%] hidden xl:flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[#171B22]/80 border border-white/10 text-xs text-white/70 backdrop-blur-md shadow-xl opacity-35"
      >
        <BarChart2 className="w-[14px] h-[14px] text-[#22C55E]" />
        <span>Backtest Sharpe: 2.84</span>
      </motion.div>
    </div>
  );
}
