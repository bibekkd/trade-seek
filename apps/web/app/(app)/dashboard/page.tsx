import { popularEquities } from "../../market-universe";
import HomeDashboardClient from "../../home-dashboard-client";

type DashboardProps = {
  searchParams?: {
    symbol?: string;
  };
};

export default function DashboardPage({ searchParams }: DashboardProps) {
  const instruments = popularEquities;
  const selectedSymbol = searchParams?.symbol ?? instruments[0]?.symbol ?? "RELIANCE";

  return (
    <HomeDashboardClient
      initialSnapshots={[]}
      initialIndexSnapshots={[]}
      initialChartItems={[]}
      selectedSymbol={selectedSymbol}
    />
  );
}
