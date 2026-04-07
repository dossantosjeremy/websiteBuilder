'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RestoreConfirmDialogProps {
  isOpen: boolean;
  versionLabel: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestoreConfirmDialog({
  isOpen,
  versionLabel,
  onConfirm,
  onCancel,
}: RestoreConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Restore Version
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-2">
          <p className="text-sm text-[hsl(0,0%,70%)]">
            Restore to: <span className="font-medium text-[hsl(0,0%,90%)]">{versionLabel ?? 'this version'}</span>
          </p>
          <p className="text-sm text-[hsl(0,0%,55%)]">
            This will restore your project to this version. Your current state will be saved as a snapshot first.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Restore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
