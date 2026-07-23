const indexSymbols: Record<string, string> = {
  "NSE:NIFTY50-INDEX": "NSE:NIFTY",
  "NSE:NIFTYBANK-INDEX": "NSE:BANKNIFTY",
  "NSE:FINNIFTY-INDEX": "NSE:FINNIFTY",
  "NSE:NIFTYIT-INDEX": "NSE:CNXIT",
  "NSE:NIFTYMIDCAP50-INDEX": "NSE:NIFTYMIDCAP50",
};

const labels: Record<string, string> = {
  "NSE:NIFTY50-INDEX": "Nifty 50",
  "NSE:NIFTYBANK-INDEX": "Nifty Bank",
  "NSE:FINNIFTY-INDEX": "Nifty Financial Services",
  "NSE:NIFTYIT-INDEX": "Nifty IT",
  "NSE:NIFTYMIDCAP50-INDEX": "Nifty Midcap 50",
};

export function getChartSymbol(symbol: string): string {
  if (indexSymbols[symbol]) return indexSymbols[symbol];
  if (symbol.includes(":")) return symbol;
  return `NSE:${symbol}`;
}

export function getInstrumentLabel(symbol: string): string {
  return labels[symbol] ?? symbol.replace(/^NSE:/, "");
}
