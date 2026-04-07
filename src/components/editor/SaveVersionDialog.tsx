'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SaveVersionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  isSaving?: boolean;
}

export default function SaveVersionDialog({
  open,
  onClose,
  onSave,
  isSaving = false,
}: SaveVersionDialogProps) {
  const [label, setLabel] = useState('');

  const handleSave = () => {
    onSave(label.trim());
    setLabel('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <label className="block text-sm text-[hsl(0,0%,70%)] mb-2">
            Version label <span className="text-[hsl(0,0%,45%)]">(optional)</span>
          </label>
          <Input
            placeholder="e.g. Before homepage redesign"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
