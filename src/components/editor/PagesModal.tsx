'use client';

import * as Dialog from '@radix-ui/react-dialog';
import PageManager from './PageManager';

interface PagesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PagesModal({ open, onClose }: PagesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl w-80 max-h-[70vh] overflow-y-auto p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-white">Pages</h2>
            <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
              ✕
            </Dialog.Close>
          </div>
          <PageManager />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
