// Skeleton loading shown immediately while /news JS chunk is compiling/loading
export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Featured article skeleton */}
        <div className="mb-10 aspect-[16/7] w-full rounded-none bg-black/8 animate-pulse" />

        {/* Article grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/3] w-full rounded-none bg-black/8 animate-pulse" />
              <div className="h-3 w-16 rounded bg-black/5 animate-pulse" />
              <div className="h-4 w-full rounded bg-black/10 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-black/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
