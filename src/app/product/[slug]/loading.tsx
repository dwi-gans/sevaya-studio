// Skeleton loading shown immediately while /product/[slug] JS chunk is compiling/loading
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product image skeleton */}
          <div className="aspect-[2/3] w-full rounded-none bg-black/8 animate-pulse" />

          {/* Product info skeleton */}
          <div className="flex flex-col gap-4 py-4">
            <div className="h-3 w-20 rounded bg-black/5 animate-pulse" />
            <div className="h-6 w-64 rounded bg-black/10 animate-pulse" />
            <div className="h-4 w-32 rounded bg-black/8 animate-pulse" />
            <div className="mt-2 h-px w-full bg-black/5" />
            {/* Swatches */}
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-black/8 animate-pulse" />
              ))}
            </div>
            {/* Size buttons */}
            <div className="flex gap-2 mt-2">
              {['S-M', 'M-L', 'L-XL', 'XL-2XL'].map((s) => (
                <div key={s} className="h-9 w-16 rounded-none bg-black/5 animate-pulse" />
              ))}
            </div>
            {/* CTA */}
            <div className="mt-4 h-11 w-full rounded-none bg-black/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
