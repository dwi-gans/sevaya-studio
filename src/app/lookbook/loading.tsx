// Skeleton loading shown immediately while /lookbook JS chunk is compiling/loading
export default function LookbookLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 sm:pt-20" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Chapter grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full rounded-none bg-black/8 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
