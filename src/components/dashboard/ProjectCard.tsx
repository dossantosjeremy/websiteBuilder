'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  /** Called when the user confirms deletion. The parent handles the API call optimistically. */
  onDeleted: (id: number) => void;
}

export default function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Generate a deterministic gradient based on project id
  const gradients = [
    'from-blue-600 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-violet-600 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
  ];
  const gradient = gradients[project.id % gradients.length];

  const deployedUrl = (project.meta as { deployedUrl?: string } | null)?.deployedUrl ?? null;

  return (
    <div className="group bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] rounded-xl overflow-hidden hover:border-[hsl(0,0%,28%)] transition-all hover:shadow-lg hover:shadow-black/20">
      {/* Thumbnail */}
      <div className={`h-40 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-6xl font-bold select-none">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Hover overlay with quick edit */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link href={`/editor/${project.id}`}>
            <Button size="sm" className="gap-1.5">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm truncate">
            {project.name.length > 30 ? `${project.name.slice(0, 30)}…` : project.name}
          </h3>
          {deployedUrl && (
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[hsl(0,0%,40%)] hover:text-[hsl(221,83%,65%)] transition-colors"
              title="Open deployed site"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <p className="text-xs text-[hsl(0,0%,40%)] mb-3">
          Edited{' '}
          {project.updatedAt
            ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
            : 'recently'}
        </p>

        <div className="flex items-center gap-2">
          <Link href={`/editor/${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDeleted(project.id);
                  setConfirmDelete(false);
                }}
                className="text-xs px-2"
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[hsl(0,0%,45%)] hover:text-red-400 hover:bg-red-900/20"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
