export default function ChartsLoading() {
  return (
    <main className="app-shell bg-[#0E1117] min-h-screen text-white p-24 md:p-32">
      <section className="space-y-6 animate-pulse">
        {/* Header Card Skeleton */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 md:p-32 shadow-subtle flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <div className="h-3.5 w-32 bg-white/[0.08] rounded-md mb-2" />
            <div className="h-3 w-24 bg-white/[0.06] rounded-md mb-2" />
            <div className="h-8 w-56 bg-white/[0.1] rounded-lg mb-2" />
            <div className="h-4 w-full max-w-[600px] bg-white/[0.06] rounded-md" />
          </div>
          <div className="h-9 w-32 bg-white/[0.08] rounded-full" />
        </div>

        {/* Full Chart Frame Skeleton */}
        <div className="bg-[#1A1F27] border border-white/[0.06] rounded-[24px] p-24 h-[500px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-40 bg-white/[0.08] rounded-md" />
            <div className="h-4 w-28 bg-white/[0.06] rounded-md" />
          </div>
          <div className="flex-1 w-full bg-white/[0.03] rounded-xl my-2" />
          <div className="h-4 w-48 bg-white/[0.05] rounded-md mx-auto mt-2" />
        </div>
      </section>
    </main>
  );
}
