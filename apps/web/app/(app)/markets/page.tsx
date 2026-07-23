import {
  broadEquities,
} from "../../market-universe";
import MarketsClient from "./markets-client";

type MarketsPageProps = {
  searchParams?: {
    page?: string;
    symbol?: string;
  };
};

const pageSize = 10;

export default function MarketsPage({ searchParams }: MarketsPageProps) {
  const pageCount = Math.ceil(broadEquities.length / pageSize);
  const currentPage = clampPage(Number(searchParams?.page ?? 1), pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEquities = broadEquities.slice(pageStart, pageStart + pageSize);
  const selectedSymbol = searchParams?.symbol ?? pageEquities[0]?.symbol ?? "RELIANCE";

  return (
    <MarketsClient
      currentPage={currentPage}
      pageCount={pageCount}
      pageEquities={pageEquities}
      selectedSymbol={selectedSymbol}
      initialSnapshots={[]}
      initialIndexSnapshots={[]}
    />
  );
}

function clampPage(value: number, pageCount: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 1), pageCount);
}
