import React from "react";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0B0D10] text-white selection:bg-[#B8D957]/30 selection:text-[#B8D957]">{children}</div>;
}
