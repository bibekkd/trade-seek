import {
  broadEquities,
  getMarketSnapshots,
  recentMarketWindow,
} from "../../market-universe";
import ComparisonWorkspace from "./comparison-workspace";

export const dynamic = "force-dynamic";

const pageSize = 10;

export default async function ComparisonPage() {
  const initialEquities = broadEquities.slice(0, pageSize);
  const { start, end } = recentMarketWindow();
  const snapshots = await getMarketSnapshots(initialEquities, start, end);

  return (
    <main className="app-shell">
      <section className="top-band compact-band" aria-labelledby="comparison-heading">
        <div>
          <p className="eyebrow">FYERS Comparison</p>
          <h1 id="comparison-heading">Stock Comparison</h1>
          <p className="lede">
            Compare NSE stocks incrementally. Start with 10 stocks, then load 10
            more at a time without requesting the full universe upfront.
          </p>
        </div>
      </section>

      <ComparisonWorkspace
        initialSnapshots={snapshots}
        instruments={broadEquities}
        pageSize={pageSize}
      />
    </main>
  );
}
