'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorContext, type PageData } from './EditorContext';
import 'grapesjs/dist/css/grapes.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolve = (mod: any) => mod.default ?? mod;

export default function GrapesEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setEditor, project, pages, currentPageIndex, setPages } = useEditorContext();
  const initDoneRef = useRef(false);
  const editorInstanceRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<PageData[]>(pages);
  const currentPageIndexRef = useRef<number>(currentPageIndex);
  const [initError, setInitError] = useState<string | null>(null);
  pagesRef.current = pages;
  currentPageIndexRef.current = currentPageIndex;

  const getInitialData = useCallback(() => {
    const page = pages[currentPageIndex];
    if (page?.components) return { components: page.components, styles: page.styles ?? [] };
    const raw = project.grapejsJson as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (raw?.components) return { components: raw.components, styles: raw.styles ?? [] };
    return { components: [], styles: [] };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initDoneRef.current || !containerRef.current) return;
    initDoneRef.current = true;
    let mounted = true;

    const init = async () => {
      try {
        // Load core + plugins — use allSettled so one bad plugin doesn't kill everything
        const [gjsResult, ...pluginResults] = await Promise.allSettled([
          import('grapesjs'),
          import('grapesjs-preset-webpage'),
          import('grapesjs-navbar'),
          import('grapesjs-tabs'),
          import('grapesjs-custom-code'),
          import('grapesjs-touch'),
          import('grapesjs-tooltip'),
          import('grapesjs-typed'),
          import('grapesjs-style-gradient'),
          import('grapesjs-style-filter'),
          import('grapesjs-style-bg'),
          import('grapesjs-blocks-flexbox'),
          import('grapesjs-plugin-forms'),
          import('grapesjs-component-countdown'),
        ]);

        if (gjsResult.status === 'rejected') {
          throw new Error(`Failed to load GrapesJS core: ${gjsResult.reason}`);
        }

        if (!mounted || !containerRef.current) return;

        const gjs = resolve(gjsResult.value);
        const initialData = getInitialData();

        // Collect successfully loaded plugins
        const loadedPlugins: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        pluginResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            loadedPlugins.push(resolve(result.value));
          } else {
            console.warn(`GrapesJS plugin [${i}] failed to load:`, result.reason);
          }
        });

        const [
          presetWebpage,,,,,,,,
          gjsBlocksFlexbox,,,
        ] = loadedPlugins;

        const editor = gjs.init({
          container: containerRef.current,
          height: '100%',
          width: '100%',
          storageManager: false,
          undoManager: { trackChanges: true },
          panels: { defaults: [] },
          blockManager: { appendTo: false },
          styleManager: { appendTo: '#gjs-styles-container' },
          layerManager: { appendTo: '#gjs-layers-container' },
          traitManager: { appendTo: '#gjs-traits-container' },
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Tablet', width: '768px', widthMedia: '992px' },
              { name: 'Mobile', width: '320px', widthMedia: '480px' },
            ],
          },
          assetManager: {
            upload: '/api/upload',
            uploadName: 'file',
            assets: [],
            multiUpload: true,
          },
          plugins: loadedPlugins,
          pluginsOpts: {
            ...(presetWebpage ? { [presetWebpage]: {} } : {}),
            ...(gjsBlocksFlexbox ? { [gjsBlocksFlexbox]: { flexboxBlock: true } } : {}),
          },
        });

        // Load initial page data
        const comps = initialData.components as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const styles = initialData.styles as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (comps?.length > 0) editor.setComponents(comps);
        if (styles?.length > 0) editor.setStyle(styles);

        // Debounced change → save to context
        const onEditorChange = () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const components = editor.getComponents().toJSON();
            const editorStyles = editor.getStyle().toJSON();
            const latestPages = pagesRef.current;
            const latestIdx = currentPageIndexRef.current;
            setPages(latestPages.map((p, i) => i === latestIdx ? { ...p, components, styles: editorStyles } : p));
          }, 500);
        };

        editor.on('component:add', onEditorChange);
        editor.on('component:remove', onEditorChange);
        editor.on('component:update', onEditorChange);
        editor.on('style:change', onEditorChange);

        editorInstanceRef.current = editor;
        setEditor(editor);
      } catch (err) {
        console.error('GrapesJS init error:', err);
        if (mounted) setInitError(String(err));
      }
    };

    init();

    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try { editorInstanceRef.current?.destroy(); } catch { /* ignore */ }
      editorInstanceRef.current = null;
      initDoneRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 text-xs p-8 gap-2">
        <p className="font-semibold">Editor failed to initialise</p>
        <pre className="bg-[#1a0000] border border-red-900 rounded p-3 max-w-full overflow-auto whitespace-pre-wrap text-red-300">
          {initError}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="gjs"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
