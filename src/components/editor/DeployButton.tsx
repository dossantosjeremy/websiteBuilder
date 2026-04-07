'use client';

import { useState, useRef } from 'react';
import { Rocket, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditorContext } from './EditorContext';
import toast from 'react-hot-toast';

type DeployPhase = 'idle' | 'confirming' | 'deploying' | 'polling' | 'done' | 'error';

export default function DeployButton() {
  const { project } = useEditorContext();
  const [phase, setPhase] = useState<DeployPhase>('idle');
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleOpenDialog = () => {
    setPhase('confirming');
    setErrorMsg(null);
    setDeployUrl(null);
    setDeploymentId(null);
    setDialogOpen(true);
  };

  const startPolling = (id: string) => {
    setPhase('polling');
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/deploy/status/${id}`);
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json() as { status: string; url: string | null };

        if (data.status === 'READY') {
          clearPoll();
          setDeployUrl(data.url);
          setPhase('done');
          toast.success(
            <span>
              Deployed!{' '}
              <a
                href={data.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View site →
              </a>
            </span>
          );
        } else if (data.status === 'ERROR' || data.status === 'CANCELED') {
          clearPoll();
          setPhase('error');
          setErrorMsg('Deployment failed on Vercel. Check your Vercel dashboard for details.');
        }
      } catch {
        // transient error — keep polling
      }
    }, 3000);
  };

  const handleDeploy = async () => {
    setPhase('deploying');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: String(project.id) }),
      });

      const data = await res.json() as {
        deploymentId?: string;
        url?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? 'Deploy failed');
      }

      setDeploymentId(data.deploymentId ?? null);
      setDeployUrl(data.url ?? null);
      startPolling(data.deploymentId!);
    } catch (err) {
      clearPoll();
      const msg = err instanceof Error ? err.message : 'Deploy failed';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(msg);
    }
  };

  const handleClose = () => {
    clearPoll();
    setDialogOpen(false);
    setPhase('idle');
  };

  const isWorking = phase === 'deploying' || phase === 'polling';

  return (
    <>
      <Button
        size="sm"
        className="h-8 px-3 gap-1.5 bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
        onClick={handleOpenDialog}
        disabled={isWorking}
      >
        {isWorking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Rocket className="h-3.5 w-3.5" />
        )}
        <span className="text-xs">Deploy</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,20%)] text-[hsl(0,0%,95%)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[hsl(221,83%,53%)]" />
              Deploy to Vercel
            </DialogTitle>
            <DialogDescription className="text-[hsl(0,0%,60%)]">
              This will deploy your site to Vercel and create a version snapshot.
            </DialogDescription>
          </DialogHeader>

          {phase === 'confirming' && (
            <p className="text-sm text-[hsl(0,0%,75%)]">
              Ready to deploy <strong>{project.name}</strong> to production?
            </p>
          )}

          {(phase === 'deploying' || phase === 'polling') && (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(221,83%,53%)]" />
              <span className="text-sm text-[hsl(0,0%,75%)]">
                {phase === 'deploying' ? 'Initiating deployment...' : 'Deploying — checking status...'}
              </span>
            </div>
          )}

          {phase === 'done' && deployUrl && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-green-400 font-medium">Deployment successful!</p>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[hsl(221,83%,65%)] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {deployUrl}
              </a>
            </div>
          )}

          {phase === 'error' && (
            <div className="py-2">
              <p className="text-sm text-red-400">
                {errorMsg ?? 'An unknown error occurred.'}
              </p>
            </div>
          )}

          <DialogFooter>
            {phase === 'confirming' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-[hsl(0,0%,60%)]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
                  onClick={handleDeploy}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy Now
                </Button>
              </>
            )}
            {(phase === 'done' || phase === 'error') && (
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-[hsl(0,0%,60%)]">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
