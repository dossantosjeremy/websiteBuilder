'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorContext, type PageData } from './EditorContext';
import 'grapesjs/dist/css/grapes.min.css';
import PagesSidebarPanel from './PagesSidebarPanel';
import CmsPanel from './CmsPanel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolve = (mod: any) => mod.default ?? mod;

export default function GrapesEditor() {
  const canvasRef = useRef<HTMLDivElement>(null);
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
    if (initDoneRef.current || !canvasRef.current) return;
    initDoneRef.current = true;
    let mounted = true;

    const init = async () => {
      try {
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
          import('grapesjs-lory-slider'),
          import('grapesjs-plugin-export'),
          import('grapesjs-tui-image-editor'),
        ]);

        if (gjsResult.status === 'rejected') {
          throw new Error(`GrapesJS core failed: ${gjsResult.reason}`);
        }

        if (!mounted || !canvasRef.current) return;

        const gjs = resolve(gjsResult.value);
        const loadedPlugins: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        pluginResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            loadedPlugins.push(resolve(r.value));
          } else {
            console.warn(`Plugin [${i}] skipped:`, r.reason);
          }
        });

        const initialData = getInitialData();

        const editor = gjs.init({
          container: canvasRef.current,
          height: '100%',
          width: '100%',
          storageManager: false,
          undoManager: { trackChanges: true },
          // Let preset-webpage populate the views panel with buttons
          panels: {
            defaults: [
              // The preset adds open-sm / open-layers / open-blocks / open-tm buttons here
              { id: 'views', el: '#gjs-views-buttons' },
              // GrapesJS shows the active manager content in this container
              { id: 'views-container', el: '#gjs-views-container' },
            ],
          },
          // No custom appendTo — blocks + style + layers + traits all route through
          // the native views-container, switched by the panel buttons on the right
          styleManager: {},
          layerManager: {},
          traitManager: {},
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Tablet', width: '768px', widthMedia: '1024px' },
              { name: 'Mobile landscape', width: '568px', widthMedia: '767px' },
              { name: 'Mobile portrait', width: '320px', widthMedia: '480px' },
            ],
          },
          assetManager: {
            upload: '/api/upload',
            uploadName: 'file',
            assets: [],
            multiUpload: true,
          },
          plugins: loadedPlugins,
          pluginsOpts: {},
        });

        const comps = initialData.components as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const styles = initialData.styles as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (comps?.length > 0) editor.setComponents(comps);
        if (styles?.length > 0) editor.setStyle(styles);

        const onEditorChange = () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const components = editor.getComponents().toJSON();
            const editorStyles = editor.getStyle().toJSON();
            const latestPages = pagesRef.current;
            const latestIdx = currentPageIndexRef.current;
            setPages(latestPages.map((p, i) =>
              i === latestIdx ? { ...p, components, styles: editorStyles } : p
            ));
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
      <div className="flex flex-col items-center justify-center flex-1 h-full text-red-600 text-xs p-8 gap-2 bg-white">
        <p className="font-semibold">Editor failed to initialise</p>
        <pre className="bg-red-50 border border-red-200 rounded p-3 max-w-full overflow-auto whitespace-pre-wrap text-red-700">
          {initError}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left panel */}
      <div
        className="shrink-0 flex flex-col border-r border-slate-200 bg-white"
        style={{ width: 260 }}
      >
        {/* GrapesJS icon strip — style / layers / traits / blocks buttons */}
        <div
          id="gjs-views-buttons"
          className="shrink-0 flex flex-row border-b border-slate-200 bg-slate-50"
          style={{ minHeight: 40 }}
        />

        {/* Pages list */}
        <div className="shrink-0 border-b border-slate-200" style={{ maxHeight: '35%', overflowY: 'auto' }}>
          <PagesSidebarPanel />
        </div>

        {/* CMS — Strapi content types */}
        <div className="shrink-0 border-b border-slate-200" style={{ maxHeight: '40%', overflowY: 'auto' }}>
          <CmsPanel />
        </div>

        {/* GrapesJS active manager content (style / layers / traits / blocks) */}
        <div
          id="gjs-views-container"
          className="flex-1 overflow-y-auto min-h-0"
        />
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        id="gjs"
        className="flex-1 h-full min-w-0"
      />
    </div>
  );
}
