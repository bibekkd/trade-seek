import type { Candle, Instrument } from "@/lib/api";
import LocalMarketChart from "./local-market-chart";

type ChartItem = {
  instrument: Instrument;
  candles: Candle[];
};

export default function HomeMarketCharts({ items }: { items: ChartItem[] }) {
  return (
    <section className="market-dashboard home-charts" aria-labelledby="home-charts-heading">
      <div className="section-header">
        <div>
          <p className="eyebrow">Learn the market</p>
          <h2 id="home-charts-heading">Market charts</h2>
        </div>
        <a className="pill link-pill" href="/instrument-data">Explore instruments</a>
      </div>
      <p className="section-helper">
        Start with simple price trends, then open any chart for deeper analysis and tools.
      </p>
      <div className="home-chart-grid">
        {items.map(({ instrument, candles }) => (
          <article className="home-chart-card" key={instrument.symbol}>
            <div className="home-chart-card-header">
              <div>
                <strong>{instrument.symbol.replace(/^NSE:/, "")}</strong>
                <span>{instrument.name}</span>
              </div>
              <a href={`/charts?symbol=${encodeURIComponent(instrument.symbol)}`} aria-label={`Open ${instrument.name} chart`}>
                Open chart ↗
              </a>
            </div>
            {candles.length > 1 ? (
              <div className="home-chart-frame">
                <LocalMarketChart candles={candles} />
              </div>
            ) : (
              <div className="chart-empty">Chart data unavailable</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
