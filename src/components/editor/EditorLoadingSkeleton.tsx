export default function EditorLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)] overflow-hidden animate-pulse">
      {/* Top bar skeleton */}
      <div className="h-[60px] bg-[hsl(0,0%,10%)] border-b border-[hsl(0,0%,18%)] flex items-center px-4 gap-3 shrink-0">
        <div className="h-8 w-8 rounded bg-[hsl(0,0%,16%)]" />
        <div className="h-6 w-6 rounded bg-[hsl(0,0%,16%)]" />
        <div className="h-4 w-32 rounded bg-[hsl(0,0%,16%)]" />
        <div className="flex-1" />
        <div className="h-7 w-24 rounded bg-[hsl(0,0%,14%)]" />
        <div className="flex-1" />
        <div className="h-8 w-16 rounded bg-[hsl(0,0%,16%)]" />
        <div className="h-8 w-16 rounded bg-[hsl(0,0%,16%)]" />
        <div className="h-8 w-20 rounded bg-[hsl(0,0%,18%)]" />
      </div>

      {/* Three column layout skeleton */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-64 bg-[hsl(0,0%,9%)] border-r border-[hsl(0,0%,18%)] flex flex-col gap-3 p-3 shrink-0">
          <div className="h-8 rounded bg-[hsl(0,0%,13%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,13%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,13%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
          <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
        </div>

        {/* Main canvas */}
        <div className="flex-1 bg-[hsl(0,0%,12%)] flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-lg bg-[hsl(0,0%,10%)]" />
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] bg-[hsl(0,0%,9%)] border-l border-[hsl(0,0%,18%)] flex flex-col gap-3 p-3 shrink-0">
          <div className="flex gap-2 mb-2">
            <div className="flex-1 h-8 rounded bg-[hsl(0,0%,13%)]" />
            <div className="flex-1 h-8 rounded bg-[hsl(0,0%,13%)]" />
            <div className="flex-1 h-8 rounded bg-[hsl(0,0%,13%)]" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-1/3 rounded bg-[hsl(0,0%,14%)]" />
              <div className="h-8 rounded bg-[hsl(0,0%,11%)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
