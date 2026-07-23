"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Quote, TrendingUp } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Rohan Sharma",
      role: "NIFTY Options Scalper",
      location: "Mumbai",
      returnStat: "+42.8% YTD",
      quote:
        "TradeSeek allowed me to automate my NIFTY options strategy without writing a single line of Python. The AI backtester saved me from 3 bad strategy ideas before I found my winning setup.",
      initials: "RS",
      color: "bg-gradient-to-tr from-purple-500 to-indigo-500",
    },
    {
      name: "Ananya Iyer",
      role: "Full-Time Quant Trader",
      location: "Bengaluru",
      returnStat: "12ms Execution",
      quote:
        "The Zerodha Kite integration executes orders in 12 milliseconds flat. Zero slippage on volatile BankNIFTY expiry days. It feels like having a prop desk infra.",
      initials: "AI",
      color: "bg-gradient-to-tr from-[#B8D957] to-emerald-600 text-[#0B0D10]",
    },
    {
      name: "Vikramaditya Mehta",
      role: "Equity & Futures Trader",
      location: "Delhi",
      returnStat: "78.4% Win Rate",
      quote:
        "The Risk Guard shield is the best feature. When market volatility spiked last month, TradeSeek automatically cut my positions at my exact 1.5% stop loss limit.",
      initials: "VM",
      color: "bg-gradient-to-tr from-blue-500 to-cyan-500",
    },
  ];

  return (
    <section className="py-[96px] md:py-[128px] relative z-10 bg-[#11151C]/50 border-y border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#66A7FF] mb-[16px]"
          >
            <ShieldCheck className="w-[14px] h-[14px]" />
            <span>Trader Community Stories</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Loved by traders across India.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            Hear how Indian retail traders are upgrading from manual chart watching to AI algorithmic execution.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="rounded-[28px] bg-[#171B22] border border-white/[0.06] p-[28px] hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-[24px]">
                  <div className="flex items-center gap-[4px] text-[#B8D957]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-[16px] h-[16px] fill-[#B8D957]" />
                    ))}
                  </div>
                  <span className="px-[12px] py-[4px] rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs font-mono font-bold">
                    {t.returnStat}
                  </span>
                </div>

                <p className="text-sm text-white/90 leading-relaxed italic mb-[32px] font-normal">
                  &quot;{t.quote}&quot;
                </p>
              </div>

              <div className="pt-[16px] border-t border-white/[0.06] flex items-center gap-[12px]">
                <div className={`w-[40px] h-[40px] rounded-full ${t.color} font-bold text-xs flex items-center justify-center`}>
                  {t.initials}
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">{t.name}</span>
                  <span className="text-xs text-[#98A2B3]">{t.role} • {t.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
