export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] rounded-xl overflow-hidden animate-pulse"
        >
          {/* Thumbnail skeleton */}
          <div className="h-40 bg-[hsl(0,0%,14%)]" />
          {/* Info skeleton */}
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[hsl(0,0%,18%)] rounded w-3/4" />
            <div className="h-3 bg-[hsl(0,0%,16%)] rounded w-1/2" />
            <div className="h-8 bg-[hsl(0,0%,16%)] rounded mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
