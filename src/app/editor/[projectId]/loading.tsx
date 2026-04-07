export default function EditorLoading() {
  return (
    <div className="flex h-screen bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)] overflow-hidden">
      {/* Top bar skeleton */}
      <div className="fixed top-0 left-0 right-0 h-[60px] bg-[hsl(0,0%,8%)] border-b border-[hsl(0,0%,18%)] flex items-center px-4 gap-3 z-50">
        <div className="h-8 w-8 bg-[hsl(0,0%,14%)] rounded animate-pulse" />
        <div className="h-6 w-6 bg-[hsl(221,83%,53%)]/40 rounded animate-pulse" />
        <div className="h-4 w-32 bg-[hsl(0,0%,14%)] rounded animate-pulse" />
        <div className="flex-1" />
        <div className="h-8 w-24 bg-[hsl(0,0%,14%)] rounded animate-pulse" />
        <div className="h-8 w-8 bg-[hsl(0,0%,14%)] rounded animate-pulse" />
        <div className="h-8 w-8 bg-[hsl(0,0%,14%)] rounded animate-pulse" />
        <div className="h-8 w-16 bg-[hsl(221,83%,53%)]/40 rounded animate-pulse" />
      </div>

      {/* Main content skeleton */}
      <div className="flex w-full mt-[60px]">
        {/* Left sidebar */}
        <div
          className="border-r border-[hsl(0,0%,18%)] flex flex-col gap-2 p-3"
          style={{ width: 280 }}
        >
          <div className="h-8 w-full bg-[hsl(0,0%,11%)] rounded animate-pulse" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-[hsl(0,0%,11%)] rounded animate-pulse" />
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[hsl(0,0%,15%)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[hsl(0,0%,35%)]">
            <div className="h-12 w-12 border-2 border-[hsl(221,83%,53%)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading editor...</p>
          </div>
        </div>

        {/* Right sidebar */}
        <div
          className="border-l border-[hsl(0,0%,18%)] flex flex-col gap-2 p-3"
          style={{ width: 280 }}
        >
          <div className="h-8 w-full bg-[hsl(0,0%,11%)] rounded animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-[hsl(0,0%,11%)] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
