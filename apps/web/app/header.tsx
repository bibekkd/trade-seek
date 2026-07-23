"use client";

import { usePathname } from "next/navigation";
import { Menu, Layers } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname() ?? "/";

  let pageTitle = "Dashboard";
  if (pathname.startsWith("/markets")) pageTitle = "Market Board";
  else if (pathname.startsWith("/comparison")) pageTitle = "Stock Comparison";
  else if (pathname.startsWith("/strategy-backtest")) pageTitle = "Strategy Lab";
  else if (pathname.startsWith("/instrument-data")) pageTitle = "OHLCV Explorer";
  else if (pathname.startsWith("/charts")) pageTitle = "TradingView Charts";

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="mobile-brand-icon">
          <Layers className="w-5 h-5 text-[#B7D65C]" />
        </div>
        <div className="app-header-title">{pageTitle}</div>
      </div>

      <div className="app-header-telemetry">
        <div className="telemetry-badge active">
          <span>API</span>
          <strong>Active</strong>
        </div>
        <div className="telemetry-badge">
          <span>Data</span>
          <strong>FYERS</strong>
        </div>
      </div>
    </header>
  );
}


