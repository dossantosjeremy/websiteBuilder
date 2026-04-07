'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorContext } from './EditorContext';
import toast from 'react-hot-toast';
import RestoreConfirmDialog from './RestoreConfirmDialog';

interface Version {
  id: number;
  label: string | null;
  triggeredBy: string | null;
  createdAt: string | null;
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function VersionHistoryDrawer({ open, onClose }: VersionHistoryDrawerProps) {
  const { project, editor, setPages, setCurrentPageIndex, setVersions } = useEditorContext();
  const [versions, setLocalVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/projects/${project.id}/versions`)
      .then((r) => r.json())
      .then((data) => setLocalVersions(data.versions ?? []))
      .catch(() => toast.error('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [open, project.id]);

  const handleRestore = async (versionId: number) => {
    setRestoring(versionId);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/versions/${versionId}/restore`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Restore failed');
      const data = await res.json();
      // Update pages in context
      if (data.project?.pages) {
        setPages(data.project.pages);
        setCurrentPageIndex(0);
        // Reload GrapesJS canvas with restored data
        if (editor && data.project.grapejsJson) {
          try {
            const json = data.project.grapejsJson;
            if (json.components !== undefined) {
              editor.setComponents(json.components);
            }
            if (json.styles !== undefined) {
              editor.setStyle(json.styles);
            }
          } catch (err) {
            console.error('Failed to reload GrapesJS canvas:', err);
          }
        }
      }
      // Sync versions list in context by prepending the pre-restore snapshot
      // (versions will re-fetch on next open)
      setVersions([]);
      toast.success('Version restored successfully!');
      onClose();
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
      setConfirmVersion(null);
    }
  };

  const triggerBadgeColor = (t: string | null) => {
    switch (t) {
      case 'manual': return 'bg-blue-500/20 text-blue-400';
      case 'ai': return 'bg-purple-500/20 text-purple-400';
      case 'deploy': return 'bg-green-500/20 text-green-400';
      case 'import': return 'bg-orange-500/20 text-orange-400';
      case 'autosave': return 'bg-[hsl(0,0%,18%)] text-[hsl(0,0%,55%)]';
      default: return 'bg-[hsl(0,0%,18%)] text-[hsl(0,0%,55%)]';
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40"
          onClick={onClose}
        />
        {/* Drawer */}
        <div className="relative ml-auto w-80 bg-[hsl(0,0%,8%)] border-l border-[hsl(0,0%,18%)] flex flex-col h-full shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(0,0%,18%)]">
            <h2 className="font-semibold text-sm">Version History</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12 text-[hsl(0,0%,45%)] text-sm">
                Loading...
              </div>
            )}
            {!loading && versions.length === 0 && (
              <div className="flex items-center justify-center py-12 text-[hsl(0,0%,45%)] text-sm">
                No versions yet
              </div>
            )}
            {!loading &&
              versions.map((v) => (
                <div
                  key={v.id}
                  className="px-4 py-3 border-b border-[hsl(0,0%,13%)] hover:bg-[hsl(0,0%,11%)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {v.label ?? 'Autosave'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${triggerBadgeColor(
                        v.triggeredBy
                      )}`}
                    >
                      {v.triggeredBy ?? 'auto'}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(0,0%,45%)] mb-2">
                    {v.createdAt
                      ? formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })
                      : 'Unknown time'}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2 gap-1"
                      onClick={() => toast('Preview coming soon', { icon: '👀' })}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2 gap-1"
                      onClick={() => setConfirmVersion(v)}
                      disabled={restoring === v.id}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {restoring === v.id ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <RestoreConfirmDialog
        isOpen={confirmVersion !== null}
        versionLabel={confirmVersion?.label ?? 'this version'}
        onConfirm={() => confirmVersion && handleRestore(confirmVersion.id)}
        onCancel={() => setConfirmVersion(null)}
      />
    </>
  );
}
