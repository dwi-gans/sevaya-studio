// Skeleton loading shown immediately while /profile JS chunk is compiling/loading
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top spacing for header */}
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Avatar + name skeleton */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-black/8 animate-pulse" />
          <div className="h-4 w-32 rounded bg-black/8 animate-pulse" />
          <div className="h-3 w-48 rounded bg-black/5 animate-pulse" />
        </div>

        {/* Tab skeleton */}
        <div className="mb-6 flex gap-4 border-b border-black/10">
          <div className="h-3 w-16 rounded bg-black/10 animate-pulse pb-3" />
          <div className="h-3 w-16 rounded bg-black/5 animate-pulse pb-3" />
        </div>

        {/* Order card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-4 rounded-none border border-black/8 p-4">
            <div className="mb-3 flex justify-between">
              <div className="h-3 w-28 rounded bg-black/8 animate-pulse" />
              <div className="h-5 w-20 rounded bg-black/5 animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-14 w-10 rounded-none bg-black/5 animate-pulse" />
              <div className="flex flex-1 flex-col gap-2 justify-center">
                <div className="h-3 w-40 rounded bg-black/8 animate-pulse" />
                <div className="h-3 w-24 rounded bg-black/5 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
