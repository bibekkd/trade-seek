"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, MessageSquare, Github } from "lucide-react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Options Trader");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = ["Options Trader", "Quant Developer", "Retail Trader", "HNI / Investor"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, source: "landing-waitlist" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "We could not save your signup right now. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not save your signup right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-[96px] md:py-[144px] relative z-10 overflow-hidden bg-[#0B0D10]">
      <div className="max-w-[1120px] mx-auto px-[16px] sm:px-[24px] relative">
        
        {/* Glow Background Gradient Halo */}
        <div className="absolute -inset-[16px] bg-gradient-to-r from-[#B8D957]/20 via-[#8D63FF]/20 to-[#66A7FF]/20 rounded-[40px] blur-3xl opacity-60" />

        {/* Conversion Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[36px] bg-[#171B22]/95 border border-white/10 p-[32px] sm:p-[56px] text-center shadow-2xl backdrop-blur-2xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-[8px] px-[16px] py-[6px] rounded-full bg-[#B8D957]/10 border border-[#B8D957]/20 text-xs text-[#B8D957] font-semibold mb-[24px]">
            <Sparkles className="w-[16px] h-[16px]" />
            <span>Limited Early Access Slots Remaining</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto mb-[24px]">
            Join the Future of AI Trading.
          </h2>

          <p className="text-base sm:text-lg text-[#98A2B3] max-w-2xl mx-auto mb-[32px] leading-relaxed">
            Reserve your VIP waitlist spot today. Get priority onboarding, early access API keys, and 6 months of Pro Trader access free.
          </p>

          {/* Form */}
          {!submitted ? (
            <div className="max-w-[560px] mx-auto space-y-[20px]">
              
              {/* Role Selector Pills */}
              <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[16px]">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-[14px] py-[6px] rounded-full text-xs font-semibold border transition-all ${
                      role === r
                        ? "bg-[#B8D957] text-[#0B0D10] border-[#B8D957]"
                        : "bg-[#11151C] text-[#98A2B3] border-white/10 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-[12px]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-[24px] py-[16px] rounded-full bg-[#11151C] border border-white/10 text-white placeholder-[#98A2B3] text-sm focus:outline-none focus:border-[#B8D957] transition-all shadow-inner"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-[32px] py-[16px] rounded-full bg-[#B8D957] text-[#0B0D10] font-extrabold text-sm hover:bg-[#c6e865] transition-all duration-300 shadow-xl shadow-[#B8D957]/25 flex items-center justify-center gap-[8px] group whitespace-nowrap active:scale-[0.98]"
                >
                  <span>{isSubmitting ? "Saving..." : "Request Access"}</span>
                  <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-[4px]" />
                </button>
              </form>

              {error && <p className="text-xs text-[#FF5C5C] text-left ml-[16px]">{error}</p>}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[560px] mx-auto p-[24px] rounded-3xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-center text-[#22C55E] space-y-[8px]"
            >
              <div className="w-[48px] h-[48px] rounded-full bg-[#22C55E]/20 text-[#22C55E] mx-auto flex items-center justify-center mb-[12px]">
                <CheckCircle2 className="w-[24px] h-[24px]" />
              </div>
              <h3 className="text-xl font-extrabold text-white">🎉 Welcome aboard!</h3>
              <p className="text-sm text-[#22C55E]/90">
                You are registered as <strong className="text-white">#{Math.floor(Math.random() * 200) + 1480}</strong> on the TradeSeek VIP Waitlist ({role}).
              </p>
              <p className="text-xs text-[#98A2B3] pt-[8px]">
                We sent a confirmation link to <strong className="text-white">{email}</strong>. Check your inbox!
              </p>
            </motion.div>
          )}

          {/* Social Links */}
          <div className="mt-[48px] pt-[32px] border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-[24px] text-xs text-[#98A2B3]">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-[8px] hover:text-white transition-colors"
            >
              <MessageSquare className="w-[16px] h-[16px] text-[#8D63FF]" />
              <span>Join Quant Discord (2,400+ Members)</span>
            </a>

            <div className="h-[16px] w-px bg-white/10 hidden sm:block" />

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-[8px] hover:text-white transition-colors"
            >
              <Github className="w-[16px] h-[16px] text-white" />
              <span>Star on GitHub (480 Stars)</span>
            </a>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
