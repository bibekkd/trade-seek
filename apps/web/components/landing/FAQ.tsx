"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Which Indian brokers are supported by TradeSeek?",
      a: "TradeSeek natively supports Zerodha Kite, Dhan HQ, Fyers API, Upstox Pro, Angel One SmartAPI, and Shoonya Finvasia via official OAuth API bridges. More brokers like Groww are coming soon.",
    },
    {
      q: "Is TradeSeek compliant with SEBI algorithmic trading guidelines?",
      a: "Yes. TradeSeek operates as a software copilot and API execution bridge. All user funds and securities remain strictly inside your SEBI-registered broker account. TradeSeek never holds client capital.",
    },
    {
      q: "Do I need coding or Python knowledge to build trading strategies?",
      a: "Not at all. You can describe your trading rules in plain English (e.g., 'Buy NIFTY 15m breakout when RSI > 60'). TradeSeek's AI engine automatically translates your text into clean, backtestable logic.",
    },
    {
      q: "How accurate is the tick-by-tick backtesting engine?",
      a: "TradeSeek uses high-frequency NSE market data streams accounting for slippage, bid-ask spread, exchange STT, GST, and brokerage charges to simulate real-world execution fidelity.",
    },
    {
      q: "What perks do early waitlist members receive?",
      a: "Waitlist members get priority access code, invitation to our private Quant Discord community, and 6 months of free Pro Trader access upon public launch.",
    },
  ];

  return (
    <section id="faq" className="py-[96px] md:py-[128px] relative z-10 bg-[#0B0D10]">
      <div className="max-w-[880px] mx-auto px-[16px] sm:px-[24px]">
        
        {/* Section Header */}
        <div className="text-center mb-[64px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-[8px] px-[14px] py-[6px] rounded-full bg-[#171B22] border border-white/10 text-xs text-[#66A7FF] mb-[16px]"
          >
            <HelpCircle className="w-[14px] h-[14px]" />
            <span>Frequently Asked Questions</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-[16px]"
          >
            Got questions? We have answers.
          </motion.h2>

          <p className="text-base text-[#98A2B3]">
            Everything you need to know about TradeSeek, broker connections, and algorithmic safety.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-[16px]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-[24px] bg-[#171B22] border border-white/[0.06] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-[24px] py-[20px] flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-base font-bold text-white pr-[16px]">{faq.q}</span>
                  <ChevronDown
                    className={`w-[20px] h-[20px] text-[#B8D957] transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-[24px] pb-[24px] pt-[4px] text-sm text-[#98A2B3] leading-relaxed border-t border-white/[0.04]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
