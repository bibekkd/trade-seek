"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowUpRight, Zap, Layers } from "lucide-react";

export default function Integrations() {
  const brokers = [
    { name: "Zerodha Kite", status: "Live", latency: "12ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Dhan HQ", status: "Live", latency: "14ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Fyers API", status: "Live", latency: "11ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Upstox Pro", status: "Live", latency: "15ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Angel One SmartAPI", status: "Live", latency: "18ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Shoonya Finvasia", status: "Live", latency: "16ms", badgeColor: "bg-[#22C55E]/10 text-[#22C55E]" },
    { name: "Groww", status: "Coming Soon", latency: "Q4 2026", badgeColor: "bg-[#8D63FF]/10 text-[#8D63FF]" },
    { name: "Interactive Brokers", status: "Global", latency: "22ms", badgeColor: "bg-[#66A7FF]/10 text-[#66A7FF]" },
    { name: "Polygon.io Market Data", status: "Feed Ready", latency: "5ms", badgeColor: "bg-[#B8D957]/10 text-[#B8D957]" },
  ];

  return (
    <section id="integrations" className="py-[96px] md:py-[128px] relative z-10 bg-[#11151C]/60 border-y border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#22C55E] mb-[16px]"
          >
            <ShieldCheck className="w-[14px] h-[14px]" />
            <span>Native Indian Broker Ecosystem</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[20px]"
          >
            Connect your existing broker account in 60 seconds.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#98A2B3]"
          >
            TradeSeek bridges directly with leading Indian brokers using official OAuth and high-speed webhooks. No capital stays with TradeSeek.
          </motion.p>
        </div>

        {/* Broker Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          {brokers.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="p-[24px] rounded-[24px] bg-[#171B22] border border-white/[0.06] hover:border-white/20 transition-all duration-300 flex items-center justify-between group hover:shadow-xl"
            >
              <div className="flex items-center gap-[16px]">
                <div className="w-[48px] h-[48px] rounded-2xl bg-[#11151C] border border-white/10 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-[#B8D957] transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-xs text-[#98A2B3] font-mono">Latency: {item.latency}</span>
                </div>
              </div>

              <span className={`px-[12px] py-[4px] rounded-full text-xs font-semibold border border-white/5 ${item.badgeColor}`}>
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
