'use client';

import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-semibold text-lg text-[hsl(var(--foreground))]">WebBuilder</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/dashboard/templates"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Settings
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
