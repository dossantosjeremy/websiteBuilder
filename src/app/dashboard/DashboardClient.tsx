'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/dashboard/ProjectCard';
import NewProjectDialog from '@/components/dashboard/NewProjectDialog';
import EmptyState from '@/components/dashboard/EmptyState';
import ProjectGrid from '@/components/dashboard/ProjectGrid';
import type { Project } from '@/types';
import toast from 'react-hot-toast';

interface DashboardClientProps {
  initialProjects: Project[];
}

export default function DashboardClient({ initialProjects }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Optimistic deletion — remove immediately, revert on API failure
  const handleDelete = async (id: number) => {
    const prev = projects;
    setProjects((p) => p.filter((proj) => proj.id !== id));

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Project deleted');
    } catch {
      // Revert
      setProjects(prev);
      toast.error('Failed to delete project');
    }
  };

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">My Projects</h2>
          {projects.length > 0 && (
            <span className="px-2 py-0.5 bg-[hsl(0,0%,16%)] border border-[hsl(0,0%,22%)] rounded-full text-xs text-[hsl(0,0%,55%)]">
              {projects.length}
            </span>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects grid or empty state */}
      {projects.length === 0 ? (
        <EmptyState onCreateProject={() => setDialogOpen(true)} />
      ) : (
        <ProjectGrid>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDeleted={handleDelete}
            />
          ))}
          {/* Add new card */}
          <button
            onClick={() => setDialogOpen(true)}
            className="h-full min-h-[220px] border-2 border-dashed border-[hsl(0,0%,22%)] rounded-xl flex flex-col items-center justify-center gap-3 text-[hsl(0,0%,40%)] hover:text-[hsl(0,0%,65%)] hover:border-[hsl(0,0%,32%)] transition-all hover:bg-[hsl(0,0%,11%)]"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">New Project</span>
          </button>
        </ProjectGrid>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
