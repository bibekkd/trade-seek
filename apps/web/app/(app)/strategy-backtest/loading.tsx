export default function StrategyBacktestLoading() {
  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      {/* Top Banner Skeleton */}
      <section className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 md:p-32 shadow-subtle mb-6 flex flex-col md:flex-row justify-between md:items-center gap-6 animate-pulse">
        <div>
          <div className="h-3.5 w-28 bg-white/[0.08] rounded-md mb-2" />
          <div className="h-8 w-64 bg-white/[0.1] rounded-lg mb-3" />
          <div className="h-4 w-full max-w-[550px] bg-white/[0.06] rounded-md" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#171B22] border border-white/[0.06] rounded-[16px] px-16 py-12 min-w-[100px] h-[58px]" />
          ))}
        </div>
      </section>

      {/* 2-Column Workspaces Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[560px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="h-4 w-36 bg-white/[0.08] rounded-md mb-4" />
            <div className="h-24 w-full bg-white/[0.04] rounded-2xl mb-4" />
            <div className="h-12 w-full bg-white/[0.05] rounded-xl mb-4" />
          </div>
          <div className="h-11 w-full bg-white/[0.08] rounded-full" />
        </div>

        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[560px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="h-4 w-36 bg-white/[0.08] rounded-md mb-4" />
            <div className="h-24 w-full bg-white/[0.04] rounded-2xl mb-4" />
            <div className="h-12 w-full bg-white/[0.05] rounded-xl mb-4" />
          </div>
          <div className="h-11 w-full bg-white/[0.08] rounded-full" />
        </div>
      </div>
    </main>
  );
}
