import type { Candle } from "@/lib/api";

type Props = {
  candles: Candle[];
};

const width = 1200;
const height = 360;
const padding = { top: 24, right: 24, bottom: 40, left: 110 };

export default function LocalMarketChart({ candles }: Props) {
  const values = candles.map((candle) => Number(candle.close));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = candles.map((candle, index) => {
    const x = padding.left + (index / Math.max(candles.length - 1, 1)) * plotWidth;
    const y = padding.top + ((max - Number(candle.close)) / range) * plotHeight;
    return { x, y, candle };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${width - padding.right},${height - padding.bottom}`;
  const latest = candles.at(-1);
  const first = candles[0];
  const change = latest && first ? Number(latest.close) - Number(first.close) : 0;
  const changePct = first && Number(first.close) !== 0 ? (change / Number(first.close)) * 100 : 0;
  const positive = change >= 0;

  return (
    <div className="local-chart-wrap w-full h-full">
      <div className="local-chart-summary">
        <div>
          <span>Latest close</span>
          <strong>{latest ? formatPrice(latest.close) : "—"}</strong>
        </div>
        <div>
          <span>45-day move</span>
          <strong className={positive ? "positive" : "negative"}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
          </strong>
        </div>
        <div>
          <span>Data source</span>
          <strong>FYERS</strong>
        </div>
      </div>

      <svg className="local-chart w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Price chart">
        {[0, 1, 2, 3, 4].map((step) => {
          const y = padding.top + (step / 4) * plotHeight;
          const value = max - (step / 4) * range;
          return (
            <g key={step}>
              <line className="chart-grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="chart-axis-label" x={padding.left - 12} y={y + 5} textAnchor="end">{formatPrice(String(value))}</text>
            </g>
          );
        })}
        <polygon className={positive ? "chart-area positive-area" : "chart-area negative-area"} points={area} />
        <polyline className={positive ? "chart-line positive-line" : "chart-line negative-line"} points={line} />
        {points.filter((_, index) => index === 0 || index === points.length - 1).map(({ x, y, candle }) => (
          <g key={candle.timestamp}>
            <circle className="chart-point" cx={x} cy={y} r="5" />
            <text className="chart-date-label" x={x} y={height - 16} textAnchor={x === padding.left ? "start" : "end"}>
              {formatDate(candle.timestamp)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function VolumeBars({ candles }: Props) {
  const visible = candles.slice(-30);
  const maxVolume = Math.max(...visible.map((candle) => Number(candle.volume)), 1);

  return (
    <div className="volume-chart w-full h-full" aria-label="Trading volume over the selected period">
      {visible.map((candle) => (
        <div className="volume-bar-slot" key={`${candle.symbol}-${candle.timestamp}`} title={`${formatDate(candle.timestamp)} · ${Number(candle.volume).toLocaleString("en-IN")}`}>
          <span
            className="volume-bar"
            style={{ height: `${Math.max((Number(candle.volume) / maxVolume) * 100, 4)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function formatPrice(value: string): string {
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
