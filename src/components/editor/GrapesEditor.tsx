'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorContext, type PageData } from './EditorContext';
import 'grapesjs/dist/css/grapes.min.css';
import PagesSidebarPanel from './PagesSidebarPanel';
import CmsPanel from './CmsPanel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolve = (mod: any) => mod.default ?? mod;

interface Props {
  leftPanelWidth?: number;
  onLeftResize?: (dx: number) => void;
}

export default function GrapesEditor({ leftPanelWidth = 260, onLeftResize }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { setEditor, project, pages, currentPageIndex, setPages } = useEditorContext();
  const [zoom, setZoom] = useState(100);
  const initDoneRef = useRef(false);
  const editorInstanceRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<PageData[]>(pages);
  const currentPageIndexRef = useRef<number>(currentPageIndex);
  const [initError, setInitError] = useState<string | null>(null);
  const leftResizeDragging = useRef(false);
  const leftResizeLastX = useRef(0);
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

        // Wrap each plugin so a runtime error during init doesn't crash the editor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeWrap = (plugin: any, name: string) => (editor: any, opts: any) => {
          try { plugin(editor, opts); }
          catch (e) { console.warn(`Plugin "${name}" failed during init, skipping:`, e); }
        };

        const pluginNames = [
          'preset-webpage', 'navbar', 'tabs', 'custom-code', 'touch',
          'tooltip', 'typed', 'style-gradient', 'style-filter', 'style-bg',
          'blocks-flexbox', 'plugin-forms', 'component-countdown',
          'lory-slider', 'plugin-export', 'tui-image-editor',
        ];
        pluginResults.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            loadedPlugins.push(safeWrap(resolve(r.value), pluginNames[i] ?? `plugin-${i}`));
          } else {
            console.warn(`Plugin "${pluginNames[i]}" import failed, skipping:`, r.reason);
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

  const handleLeftMouseDown = (e: React.MouseEvent) => {
    if (!onLeftResize) return;
    e.preventDefault();
    leftResizeDragging.current = true;
    leftResizeLastX.current = e.clientX;
    const onMove = (ev: MouseEvent) => {
      if (!leftResizeDragging.current) return;
      onLeftResize(ev.clientX - leftResizeLastX.current);
      leftResizeLastX.current = ev.clientX;
    };
    const onUp = () => {
      leftResizeDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const changeZoom = (delta: number) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const next = Math.min(200, Math.max(25, (editor.Canvas.getZoom?.() ?? zoom) + delta));
    editor.Canvas.setZoom?.(next);
    setZoom(next);
  };

  const resetZoom = () => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    editor.Canvas.setZoom?.(100);
    setZoom(100);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left panel */}
      <div
        className="shrink-0 flex flex-col border-r border-slate-200 bg-white"
        style={{ width: leftPanelWidth }}
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

        {/* CMS content types */}
        <div className="shrink-0 border-b border-slate-200" style={{ maxHeight: '40%', overflowY: 'auto' }}>
          <CmsPanel />
        </div>

        {/* GrapesJS active manager content (style / layers / traits / blocks) */}
        <div
          id="gjs-views-container"
          className="flex-1 overflow-y-auto min-h-0"
        />
      </div>

      {/* Left resize handle */}
      {onLeftResize && (
        <div
          onMouseDown={handleLeftMouseDown}
          className="shrink-0 w-1 cursor-col-resize bg-slate-200 hover:bg-teal-400 active:bg-teal-500 transition-colors"
          style={{ zIndex: 10 }}
        />
      )}

      {/* Canvas + zoom overlay */}
      <div className="relative flex-1 h-full min-w-0">
        <div ref={canvasRef} id="gjs" className="w-full h-full" />

        {/* Zoom controls — bottom centre */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-sm px-2 py-1 z-20 select-none">
          <button
            onClick={() => changeZoom(-10)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm font-bold"
            title="Zoom out"
          >−</button>
          <button
            onClick={resetZoom}
            className="px-2 h-6 text-xs text-slate-600 hover:bg-slate-100 rounded font-mono min-w-[42px] text-center"
            title="Reset zoom"
          >{zoom}%</button>
          <button
            onClick={() => changeZoom(10)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-sm font-bold"
            title="Zoom in"
          >+</button>
        </div>
      </div>
    </div>
  );
}
