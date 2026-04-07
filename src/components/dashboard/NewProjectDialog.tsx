'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { slugify } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function NewProjectDialog({ open, onClose }: NewProjectDialogProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slugify(name.trim()) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create project');
      }

      const { project } = await res.json();
      toast.success('Project created!');
      onClose();
      setName('');
      router.push(`/editor/${project.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setName('');
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <label className="block text-sm text-[hsl(0,0%,60%)] mb-2">Project Name</label>
          <Input
            placeholder="My Awesome Website"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            autoFocus
          />
          {name.trim() && (
            <p className="mt-1.5 text-xs text-[hsl(0,0%,40%)]">
              Slug: {slugify(name.trim())}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" disabled={creating}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
