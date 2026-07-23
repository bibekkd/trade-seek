export default function InstrumentDataLoading() {
  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      {/* 1. Header Banner Skeleton */}
      <section className="mb-8">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 md:p-32 shadow-subtle animate-pulse">
          <div className="h-3.5 w-36 bg-white/[0.08] rounded-md mb-2" />
          <div className="h-8 w-64 bg-white/[0.1] rounded-lg mb-3" />
          <div className="h-4 w-full max-w-[700px] bg-white/[0.06] rounded-md" />
        </div>
      </section>

      {/* 2. Workspace Explorer Skeleton */}
      <section className="space-y-6">
        <div className="flex justify-between items-center mb-2 animate-pulse">
          <div>
            <div className="h-3.5 w-32 bg-white/[0.08] rounded-md mb-2" />
            <div className="h-7 w-56 bg-white/[0.1] rounded-lg" />
          </div>
          <div className="h-9 w-24 bg-[#1A1F27] border border-white/[0.06] rounded-full" />
        </div>

        {/* 3. Available Instruments Card Skeleton */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 shadow-subtle space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-white/[0.08] rounded-md mb-3" />
          <div className="space-y-3">
            <div className="h-3.5 w-16 bg-white/[0.06] rounded-md" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-white/[0.05] rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Trader Workspace Card Skeleton */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 shadow-subtle animate-pulse">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="h-3.5 w-28 bg-white/[0.08] rounded-md mb-2" />
              <div className="h-8 w-44 bg-white/[0.1] rounded-lg mb-2" />
              <div className="h-4 w-56 bg-white/[0.06] rounded-md" />
            </div>
            <div className="h-9 w-32 bg-[#B7D65C]/20 rounded-full" />
          </div>

          {/* 5 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-16 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 h-[76px] flex flex-col justify-between">
                <div className="h-3 w-16 bg-white/[0.08] rounded-md" />
                <div className="h-5 w-24 bg-white/[0.1] rounded-md" />
              </div>
            ))}
          </div>

          {/* 2-Column Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-8 bg-[#171B22] border border-white/[0.06] rounded-[24px] p-20 h-[340px] flex flex-col justify-between">
              <div className="h-4 w-28 bg-white/[0.08] rounded-md mb-4" />
              <div className="flex-1 w-full bg-white/[0.03] rounded-xl" />
            </div>
            <div className="lg:col-span-4 bg-[#171B22] border border-white/[0.06] rounded-[24px] p-20 h-[340px] flex flex-col justify-between">
              <div className="h-4 w-28 bg-white/[0.08] rounded-md mb-4" />
              <div className="flex-1 w-full bg-white/[0.03] rounded-xl" />
            </div>
          </div>
        </div>

        {/* 5. Data Table Skeleton */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] overflow-hidden shadow-subtle p-6 space-y-4 animate-pulse">
          <div className="h-6 w-full bg-white/[0.06] rounded-md mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-white/[0.03] rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}
