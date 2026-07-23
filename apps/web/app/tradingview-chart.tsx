type Props = {
  symbol: string;
};

export default function TradingViewChart({ symbol }: Props) {
  const params = new URLSearchParams({
    symbol,
    interval: "D",
    timezone: "Asia/Kolkata",
    theme: "dark",
    style: "1",
    locale: "en",
    hide_top_toolbar: "0",
    hide_side_toolbar: "0",
    allow_symbol_change: "1",
    saveimage: "1",
    withdateranges: "1",
    hideideas: "1",
  });

  return (
    <iframe
      className="tradingview-iframe"
      src={`https://www.tradingview.com/widgetembed/?${params.toString()}`}
      title={`${symbol} TradingView chart`}
      loading="eager"
      allow="fullscreen"
    />
  );
}
