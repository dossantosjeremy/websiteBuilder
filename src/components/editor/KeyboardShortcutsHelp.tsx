'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['⌘', 'Z'], description: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
  { keys: ['⌘', 'S'], description: 'Save project' },
  { keys: ['⌘', 'E'], description: 'Export project as ZIP' },
  { keys: ['⌘', 'P'], description: 'Open deploy dialog' },
  { keys: ['?'], description: 'Show this help' },
] as const;

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,20%)] rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-[hsl(0,0%,95%)]">
              Keyboard Shortcuts
            </Dialog.Title>
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,80%)] hover:bg-[hsl(0,0%,16%)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((sc, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[hsl(0,0%,16%)] last:border-0"
              >
                <span className="text-sm text-[hsl(0,0%,70%)]">{sc.description}</span>
                <div className="flex items-center gap-1">
                  {sc.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-0.5 bg-[hsl(0,0%,16%)] border border-[hsl(0,0%,25%)] rounded text-xs text-[hsl(0,0%,80%)] font-mono"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-[hsl(0,0%,40%)]">
            On Windows/Linux, use Ctrl instead of ⌘
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
