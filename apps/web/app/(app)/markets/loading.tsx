export default function MarketsLoading() {
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

      {/* 2. Headline Indices Skeleton (5 Cards) */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-40 bg-white/[0.08] rounded-md animate-pulse" />
          <div className="h-4 w-24 bg-white/[0.06] rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1A1F27] border border-white/[0.06] rounded-[18px] p-16 h-[90px] flex flex-col justify-between animate-pulse"
            >
              <div className="h-3.5 w-24 bg-white/[0.08] rounded-md" />
              <div className="h-6 w-28 bg-white/[0.1] rounded-md" />
            </div>
          ))}
        </div>

        {/* 3. Popular Equities Grid Skeleton (10 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1A1F27] border border-white/[0.06] rounded-[18px] p-14 min-h-[128px] flex flex-col justify-between animate-pulse"
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
      </section>

      {/* 4. Pagination Skeleton Bar */}
      <nav className="flex justify-between items-center mt-8 animate-pulse">
        <div className="h-9 w-24 bg-[#1A1F27] border border-white/[0.06] rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-9 h-9 bg-[#1A1F27] border border-white/[0.06] rounded-full" />
          ))}
        </div>
        <div className="h-9 w-24 bg-[#1A1F27] border border-white/[0.06] rounded-full" />
      </nav>
    </main>
  );
}
