import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "TradeSeek — The Future of AI-Powered Algorithmic Trading",
  description:
    "AI-native algorithmic trading platform for Indian retail traders. Build, backtest, automate, and monitor NIFTY, BankNIFTY, and stock strategies in natural language.",
  keywords: ["AI Trading", "Algorithmic Trading", "Indian Stock Market", "NIFTY 50", "Zerodha", "Dhan", "Backtesting"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#0B0D10] text-white antialiased selection:bg-[#B8D957]/30 selection:text-[#B8D957]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


