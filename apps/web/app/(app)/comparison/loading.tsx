export default function ComparisonLoading() {
  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      {/* 1. Top Banner Skeleton */}
      <section className="mb-6">
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 md:p-32 shadow-subtle animate-pulse">
          <div className="h-3.5 w-36 bg-white/[0.08] rounded-md mb-2" />
          <div className="h-8 w-64 bg-white/[0.1] rounded-lg mb-3" />
          <div className="h-4 w-full max-w-[700px] bg-white/[0.06] rounded-md" />
        </div>
      </section>

      {/* 2. Insights 2-Column Grid Skeleton */}
      <section className="mb-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[320px] flex flex-col justify-between animate-pulse">
            <div>
              <div className="h-3.5 w-32 bg-white/[0.08] rounded-md mb-2" />
              <div className="h-6 w-3/4 bg-white/[0.1] rounded-lg mb-3" />
              <div className="h-4 w-full bg-white/[0.06] rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-16 border-t border-white/[0.05] pt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-16 h-[72px]" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[320px] flex flex-col justify-between animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3.5 w-24 bg-white/[0.08] rounded-md" />
              <div className="h-7 w-44 bg-white/[0.06] rounded-full" />
            </div>
            <div className="space-y-3 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 w-full bg-white/[0.04] rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Market Comparison Stock Cards (10 Cards) */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 shadow-subtle animate-pulse space-y-4">
          <div className="h-4 w-48 bg-white/[0.08] rounded-md mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#171B22] border border-white/[0.06] rounded-[18px] p-14 min-h-[128px] flex flex-col justify-between"
              >
                <div>
                  <div className="h-4 w-24 bg-white/[0.1] rounded-md mb-1.5" />
                  <div className="h-3 w-32 bg-white/[0.05] rounded-md" />
                </div>
                <div className="space-y-1 mt-3">
                  <div className="h-5 w-20 bg-white/[0.08] rounded-md" />
                  <div className="h-3.5 w-16 bg-white/[0.05] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Load More Skeleton */}
      <div className="flex justify-center mt-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.06] rounded-md" />
      </div>
    </main>
  );
}
