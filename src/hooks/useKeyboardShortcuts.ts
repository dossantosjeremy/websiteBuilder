import { useEffect, useCallback } from 'react';

export interface ShortcutDefinition {
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const metaMatch = shortcut.metaKey ? (e.metaKey || e.ctrlKey) : true;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey || !shortcut.shiftKey;
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : true;

        // More precise matching
        const metaRequired = shortcut.metaKey ?? false;
        const shiftRequired = shortcut.shiftKey ?? false;
        const ctrlRequired = shortcut.ctrlKey ?? false;

        if (
          keyMatch &&
          (metaRequired ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey || metaRequired) &&
          (shiftRequired ? e.shiftKey : !e.shiftKey) &&
          (ctrlRequired ? e.ctrlKey : true)
        ) {
          // Re-check more carefully
          const modMetaOk = metaRequired ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
          const modShiftOk = shiftRequired ? e.shiftKey : !e.shiftKey;

          if (modMetaOk && modShiftOk && keyMatch) {
            e.preventDefault();
            shortcut.action();
            break;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Simplified, correct implementation
export function useKeyboardShortcutsV2(shortcuts: ShortcutDefinition[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const sc of shortcuts) {
        const keyMatch = e.key.toLowerCase() === sc.key.toLowerCase();
        const metaMatch = sc.metaKey ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
        const shiftMatch = !!sc.shiftKey === e.shiftKey;
        const ctrlMatch = sc.ctrlKey ? e.ctrlKey : true;

        if (keyMatch && metaMatch && shiftMatch && ctrlMatch) {
          e.preventDefault();
          sc.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
