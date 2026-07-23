export default function HomeLoading() {
  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      {/* 1. Top Indices Strip (5 Cards) */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 w-32 bg-white/[0.06] rounded-md animate-pulse" />
          <div className="h-4 w-20 bg-white/[0.06] rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1A1F27] border border-white/[0.06] rounded-[20px] p-16 h-[96px] flex flex-col justify-between animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-white/[0.08] rounded-md" />
                <div className="h-3 w-10 bg-white/[0.05] rounded-md" />
              </div>
              <div className="h-6 w-28 bg-white/[0.08] rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* 2. Bento Grid Layout (7 Cards matching DashboardBento) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card 1: Net Liquidity (Col 4) */}
        <div className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[230px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="h-3.5 w-24 bg-white/[0.08] rounded-md" />
              <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
            </div>
            <div className="h-9 w-48 bg-white/[0.1] rounded-lg mb-2" />
            <div className="h-4 w-36 bg-white/[0.06] rounded-md" />
          </div>
          <div className="h-2 w-full bg-white/[0.06] rounded-full" />
        </div>

        {/* Card 2: AI Copilot (Col 8) */}
        <div className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[230px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-white/[0.08]" />
              <div className="h-3.5 w-32 bg-white/[0.08] rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-white/[0.1] rounded-lg mb-2" />
            <div className="h-4 w-5/6 bg-white/[0.06] rounded-md" />
          </div>
          <div className="flex justify-between items-center border-t border-white/[0.05] pt-4">
            <div className="h-5 w-40 bg-white/[0.06] rounded-full" />
            <div className="h-4 w-28 bg-white/[0.05] rounded-md" />
          </div>
        </div>

        {/* Card 3: Interactive Terminal Chart (Col 8) */}
        <div className="md:col-span-8 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[420px] flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="h-3.5 w-36 bg-white/[0.08] rounded-md mb-2" />
              <div className="h-7 w-48 bg-white/[0.1] rounded-lg" />
            </div>
            <div className="h-8 w-28 bg-white/[0.08] rounded-lg" />
          </div>
          <div className="flex-1 w-full bg-white/[0.03] rounded-xl my-2" />
          <div className="flex justify-between items-center border-t border-white/[0.05] pt-4">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-10 bg-white/[0.06] rounded-full" />
              ))}
            </div>
            <div className="h-4 w-44 bg-white/[0.05] rounded-md" />
          </div>
        </div>

        {/* Card 4: My Watchlist (Col 4) */}
        <div className="md:col-span-4 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[420px] flex flex-col animate-pulse">
          <div className="h-3.5 w-24 bg-white/[0.08] rounded-md mb-3" />
          <div className="h-11 w-full bg-white/[0.05] rounded-[14px] mb-4" />
          <div className="space-y-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-white/[0.04] rounded-[16px]" />
            ))}
          </div>
        </div>

        {/* Card 5: Active Portfolio Holdings (Col 6) */}
        <div className="md:col-span-6 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-3.5 w-36 bg-white/[0.08] rounded-md" />
            <div className="h-3.5 w-20 bg-white/[0.06] rounded-md" />
          </div>
          <div className="space-y-3 flex-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 w-full bg-white/[0.04] rounded-[16px]" />
            ))}
          </div>
        </div>

        {/* Card 6: Strategy Engine (Col 3) */}
        <div className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-28 bg-white/[0.08] rounded-md" />
              <div className="w-5 h-5 bg-white/[0.08] rounded-full" />
            </div>
            <div className="h-24 w-full bg-white/[0.04] rounded-[16px] mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-white/[0.05] rounded-md" />
              <div className="h-4 w-full bg-white/[0.05] rounded-md" />
            </div>
          </div>
          <div className="h-11 w-full bg-white/[0.06] rounded-full mt-4" />
        </div>

        {/* Card 7: Recent Orders (Col 3) */}
        <div className="md:col-span-3 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[360px] flex flex-col justify-between animate-pulse">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-28 bg-white/[0.08] rounded-md" />
              <div className="w-5 h-5 bg-white/[0.08] rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-white/[0.04] rounded-lg" />
              ))}
            </div>
          </div>
          <div className="h-11 w-full bg-white/[0.06] rounded-full mt-4" />
        </div>
      </div>
    </main>
  );
}
