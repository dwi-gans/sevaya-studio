// Skeleton loading shown immediately while /shop JS chunk is compiling/loading
export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category filter skeleton */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 shrink-0 rounded-full bg-black/8 animate-pulse" />
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[2/3] w-full rounded-none bg-black/8 animate-pulse" />
              <div className="mt-3 flex flex-col items-center gap-1.5">
                <div className="h-2.5 w-28 rounded bg-black/8 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-black/5 animate-pulse" />
                {/* Swatch dots */}
                <div className="mt-1 flex gap-1.5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3.5 w-3.5 rounded-full bg-black/8 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
