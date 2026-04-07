'use client';

import { useState, useEffect } from 'react';

export interface SelectedComponentInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedComponent: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedComponentJson: any | null;
  selectedComponentType: string | null;
  selectedComponentLabel: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSelectedComponent(editor: any | null): SelectedComponentInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedComponentJson, setSelectedComponentJson] = useState<any | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string | null>(null);
  const [selectedComponentLabel, setSelectedComponentLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSelect = (component: any) => {
      setSelectedComponent(component);
      try {
        setSelectedComponentJson(component?.toJSON?.() ?? null);
      } catch {
        setSelectedComponentJson(null);
      }
      setSelectedComponentType(component?.get?.('type') ?? component?.type ?? null);
      setSelectedComponentLabel(
        component?.getName?.() ?? component?.get?.('name') ?? component?.get?.('tagName') ?? null
      );
    };

    const onDeselect = () => {
      setSelectedComponent(null);
      setSelectedComponentJson(null);
      setSelectedComponentType(null);
      setSelectedComponentLabel(null);
    };

    editor.on('component:selected', onSelect);
    editor.on('component:deselected', onDeselect);

    return () => {
      editor.off('component:selected', onSelect);
      editor.off('component:deselected', onDeselect);
    };
  }, [editor]);

  return { selectedComponent, selectedComponentJson, selectedComponentType, selectedComponentLabel };
}
