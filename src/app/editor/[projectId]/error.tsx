'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)]">
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-[hsl(0,0%,55%)] mb-8 text-sm leading-relaxed">
          The editor encountered an unexpected error. Your work may have been auto-saved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-[hsl(0,0%,35%)]">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
