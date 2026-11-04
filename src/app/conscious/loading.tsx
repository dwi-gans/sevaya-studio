// Skeleton loading shown immediately while /conscious (About) JS chunk is compiling/loading
export default function ConsciousLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Title skeleton */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className="h-2.5 w-24 rounded bg-black/5 animate-pulse" />
          <div className="h-5 w-72 rounded bg-black/8 animate-pulse" />
          <div className="h-3 w-96 max-w-full rounded bg-black/5 animate-pulse" />
          <div className="h-3 w-80 max-w-full rounded bg-black/5 animate-pulse" />
        </div>

        {/* Hero panoramic image skeleton */}
        <div className="mb-14 aspect-[16/7] w-full rounded-none bg-black/8 animate-pulse" />

        {/* Content blocks skeleton */}
        <div className="mx-auto max-w-3xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-full rounded bg-black/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
