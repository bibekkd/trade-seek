"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BarChart3,
  GitCompare,
  Sliders,
  CandlestickChart,
  Layers,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutGrid className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: "Market Board",
      href: "/markets",
      icon: <BarChart3 className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: "Stock Comparison",
      href: "/comparison",
      icon: <GitCompare className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: "Strategy Lab",
      href: "/strategy-backtest",
      icon: <Sliders className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: "OHLCV Explorer",
      href: "/instrument-data",
      icon: <CandlestickChart className="w-5 h-5 flex-shrink-0" />,
    },
  ];

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""
          }`}
      >
        {/* Sidebar Brand & Collapse Toggle */}
        <div className="sidebar-brand">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="brand-logo text-[#B7D65C] flex-shrink-0">
                  <Layers className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="brand-text min-w-0">
                  <h2 className="truncate">TradeSeek</h2>
                  <span className="truncate">Trading Co-Pilot</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="collapse-toggle-btn hidden lg:flex"
                  onClick={onToggleCollapse}
                  aria-label="Collapse Sidebar"
                  title="Collapse Sidebar"
                >
                  <ChevronsLeft className="w-5 h-5 text-[#A3A8B3] hover:text-white transition-colors" />
                </button>
                <button
                  type="button"
                  className="sidebar-close-btn lg:hidden"
                  onClick={onClose}
                  aria-label="Close sidebar navigation"
                >
                  <X className="w-5 h-5 text-[#A3A8B3] hover:text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5 w-full">
              <div className="brand-logo text-[#B7D65C] flex-shrink-0">
                <Layers className="w-5 h-5 stroke-[2.5]" />
              </div>
              <button
                type="button"
                className="collapse-toggle-btn"
                onClick={onToggleCollapse}
                aria-label="Expand Sidebar"
                title="Expand Sidebar"
              >
                <ChevronsRight className="w-5 h-5 text-[#B7D65C] hover:text-white transition-colors" />
              </button>
            </div>
          )}
        </div>

        {/* Primary Menu Links */}
        <nav className="sidebar-menu">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`sidebar-link ${active ? "active" : ""}`}
                onClick={onClose}
                title={isCollapsed ? link.name : undefined}
              >
                {link.icon}
                {!isCollapsed && <span className="truncate">{link.name}</span>}
                {isCollapsed && (
                  <span className="sidebar-tooltip">{link.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="telemetry-compact">
            {!isCollapsed ? (
              <>
                <span className="telemetry-label">Telemetry Status</span>
                <div className="telemetry-row">
                  <span className="telemetry-indicator-pulse"></span>
                  <strong>Connected to FYERS</strong>
                </div>
              </>
            ) : (
              <div
                className="flex items-center justify-center py-1"
                title="Connected to FYERS API"
              >
                <span className="telemetry-indicator-pulse"></span>
                <span className="sidebar-tooltip">Connected to FYERS API</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}


