'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutosaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export default function AutosaveIndicator({ isSaving, lastSaved }: AutosaveIndicatorProps) {
  const [, setTick] = useState(0);

  // Re-render every 10 seconds to keep "X ago" fresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[hsl(0,0%,55%)] min-w-[110px]">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[hsl(0,0%,55%)] min-w-[110px]">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[hsl(0,0%,55%)] min-w-[110px]">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
      <span>Unsaved changes</span>
    </div>
  );
}
