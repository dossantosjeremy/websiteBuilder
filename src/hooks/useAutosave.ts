'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useAutosave(
  projectId: string | number,
  getEditorData: () => { grapejsJson: unknown; pages: unknown[] },
  intervalMs = 30000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const getDataRef = useRef(getEditorData);

  // Keep the ref current so stale closures aren't an issue
  useEffect(() => {
    getDataRef.current = getEditorData;
  });

  const performSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const data = getDataRef.current();
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Autosave error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = setInterval(performSave, intervalMs);
    return () => clearInterval(timer);
  }, [performSave, intervalMs]);

  return { isSaving, lastSaved, triggerSave: performSave };
}
