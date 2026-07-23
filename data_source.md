| Data Source                    | Intraday    | Historical                 | Free         | Notes                                                  |
| ------------------------------ | ----------- | -------------------------- | ------------ | ------------------------------------------------------ |
| **Yahoo Finance (`yfinance`)** | Limited     | ✅ Daily + limited intraday | ✅            | Best free option for MVP and AI training.              |
| **NSE Official (Bhavcopy)**    | ❌           | ✅ Daily                    | ✅            | Official end-of-day data only.                         |
| **Upstox API**                 | ✅           | ✅                          | 🟡           | Keep for later F&O investigation; community feedback says useful for F&O with data from Jan 2025. |
| **Shoonya API (Finvasia)**     | ✅           | ✅                          | ✅            | One of the best free broker APIs for Indian markets.   |
| **Angel One SmartAPI**         | ✅           | ✅                          | ✅            | Free-account fallback for historical/intraday candles after API login setup. |
| **Fyers API**                  | ✅           | ✅                          | ✅            | Preferred free-account equity historical source; verify current limits/range during setup. |
| **Kite Connect (Zerodha)**     | ✅           | ✅                          | ❌ ₹500/month | Industry standard, reliable.                           |
| **DhanHQ API**                 | ✅           | ✅                          | ❌            | Good API, historical data requires a paid plan.        |
| **TradingView**                | Charts only | Limited export             | ❌            | Great for visualization, **not** a free data API.      |
| **TrueData**                   | ✅           | ✅                          | ❌            | Professional-grade data provider.                      |
| **Global Datafeeds (GDFL)**    | ✅           | ✅                          | ❌            | Widely used by professional algo traders.              |

## Current MVP Choice

- Default Day 4 data: **local CSV fixtures** checked into the repo.
- Official open-source EOD path: **NSE Bhavcopy daily CSV** imported through the Bhavcopy adapter.
- Optional free public package path for quick experiments: **Yahoo Finance via `yfinance`** can be evaluated later, but should not be the deterministic test baseline.
- Deferred broker/API sources: **FYERS**, **Angel One SmartAPI**, **Shoonya**, and **Upstox** stay behind adapter interfaces until account credentials and current provider limits are verified.

Do not make the MVP depend on any single broker API. Keep imports normalized into our own OHLCV table so backtesting and paper-trading replay can run from stored candles even if provider access changes.
