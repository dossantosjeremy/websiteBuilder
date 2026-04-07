'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateProject: () => void;
}

export default function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-[hsl(0,0%,25%)] rounded-2xl p-16 text-center">
      <div className="w-16 h-16 bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] rounded-xl flex items-center justify-center text-3xl mx-auto mb-6">
        ◈
      </div>
      <h2 className="text-xl font-semibold mb-3">No projects yet</h2>
      <p className="text-[hsl(0,0%,55%)] mb-8 max-w-sm mx-auto text-sm leading-relaxed">
        Create your first project to start building amazing websites with AI assistance and visual
        editing.
      </p>
      <Button onClick={onCreateProject} className="gap-2">
        <Plus className="h-4 w-4" />
        Create your first project
      </Button>
    </div>
  );
}
