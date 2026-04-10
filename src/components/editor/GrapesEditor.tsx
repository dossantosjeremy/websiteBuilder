'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Layers, Palette, LayoutGrid, Settings2 } from 'lucide-react';
import { useEditorContext, type PageData } from './EditorContext';
import 'grapesjs/dist/css/grapes.min.css';
import PagesSidebarPanel from './PagesSidebarPanel';
import CmsPanel from './CmsPanel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolve = (mod: any) => mod.default ?? mod;

type EditorTab = 'blocks' | 'styles' | 'layers' | 'traits';

interface Props {
  leftPanelWidth?: number;
  onLeftResize?: (dx: number) => void;
}

export default function GrapesEditor({ leftPanelWidth = 280, onLeftResize }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { setEditor, project, pages, currentPageIndex, setPages } = useEditorContext();
  const [zoom, setZoom] = useState(100);
  const initDoneRef = useRef(false);
  const editorInstanceRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<PageData[]>(pages);
  const currentPageIndexRef = useRef<number>(currentPageIndex);
  const [initError, setInitError] = useState<string | null>(null);

  // Left sidebar section open/close
  const [pagesOpen, setPagesOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);

  // Active tab inside the Editor section
  const [activeTab, setActiveTab] = useState<EditorTab>('blocks');

  // Resize
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
        const [gjsResult, ...allPluginResults] = await Promise.allSettled([
          import('grapesjs'),
          // Critical — run directly
          import('grapesjs-preset-webpage'),      // 0
          import('grapesjs-navbar'),              // 1
          import('grapesjs-tabs'),                // 2
          import('grapesjs-custom-code'),         // 3
          import('grapesjs-touch'),               // 4
          import('grapesjs-tooltip'),             // 5
          import('grapesjs-typed'),               // 6
          import('grapesjs-style-gradient'),      // 7
          import('grapesjs-style-filter'),        // 8
          import('grapesjs-style-bg'),            // 9
          import('grapesjs-blocks-flexbox'),      // 10
          import('grapesjs-plugin-forms'),        // 11
          import('grapesjs-component-countdown'), // 12
          // Optional — safe-wrapped
          import('grapesjs-lory-slider'),         // 13
          import('grapesjs-plugin-export'),       // 14
          import('grapesjs-tui-image-editor'),    // 15
        ]);

        if (gjsResult.status === 'rejected') throw new Error(`GrapesJS core failed: ${gjsResult.reason}`);
        if (!mounted || !canvasRef.current) return;

        const gjs = resolve(gjsResult.value);
        const loadedPlugins: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

        const safeWrap = (plugin: any, name: string) => (editor: any, opts: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          try { plugin(editor, opts); }
          catch (e) { console.warn(`Optional plugin "${name}" skipped:`, e); }
        };

        const CRITICAL_COUNT = 13;
        const optionalNames = ['lory-slider', 'plugin-export', 'tui-image-editor'];

        allPluginResults.forEach((r, i) => {
          if (r.status === 'rejected') { console.warn(`Plugin [${i}] failed:`, r.reason); return; }
          const plugin = resolve(r.value);
          loadedPlugins.push(
            i < CRITICAL_COUNT ? plugin : safeWrap(plugin, optionalNames[i - CRITICAL_COUNT] ?? `opt-${i}`)
          );
        });

        const initialData = getInitialData();

        const editor = gjs.init({
          container: canvasRef.current,
          height: '100%',
          width: '100%',
          storageManager: false,
          undoManager: { trackChanges: true },

          // ── Route every manager into our left-sidebar DOM elements ──────
          // This is the correct GrapesJS API: appendTo on each manager.
          // GrapesJS mounts the manager's UI into whichever element matches.
          blockManager:  { appendTo: '#left-panel-blocks' },
          styleManager:  { appendTo: '#left-panel-styles' },
          layerManager:  { appendTo: '#left-panel-layers' },
          traitManager:  { appendTo: '#left-panel-traits' },

          // Disable ALL default GrapesJS panel chrome (the icon strip + container
          // that render on the right of the canvas). Our sidebar replaces them.
          panels: { defaults: [] },

          deviceManager: {
            devices: [
              { name: 'Desktop',           width: ''      },
              { name: 'Tablet',            width: '768px',  widthMedia: '1024px' },
              { name: 'Mobile landscape',  width: '568px',  widthMedia: '767px'  },
              { name: 'Mobile portrait',   width: '320px',  widthMedia: '480px'  },
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

        const comps  = initialData.components as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        const styles = initialData.styles as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (comps?.length  > 0) editor.setComponents(comps);
        if (styles?.length > 0) editor.setStyle(styles);

        const onEditorChange = () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const components   = editor.getComponents().toJSON();
            const editorStyles = editor.getStyle().toJSON();
            const latestPages  = pagesRef.current;
            const latestIdx    = currentPageIndexRef.current;
            setPages(latestPages.map((p, i) =>
              i === latestIdx ? { ...p, components, styles: editorStyles } : p
            ));
          }, 500);
        };

        editor.on('component:add',    onEditorChange);
        editor.on('component:remove', onEditorChange);
        editor.on('component:update', onEditorChange);
        editor.on('style:change',     onEditorChange);

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

  // ── Handlers ────────────────────────────────────────────────────────────
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

  // ── UI helpers ───────────────────────────────────────────────────────────
  const SectionHeader = ({
    label, open, onToggle,
  }: { label: string; open: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-500 hover:bg-slate-100 bg-slate-50 border-b border-slate-200 select-none"
    >
      <span>{label}</span>
      {open
        ? <ChevronDown  className="w-3 h-3 text-slate-400 shrink-0" />
        : <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
    </button>
  );

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'blocks', label: 'Blocks', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'styles', label: 'Style',  icon: <Palette    className="w-3.5 h-3.5" /> },
    { id: 'layers', label: 'Layers', icon: <Layers     className="w-3.5 h-3.5" /> },
    { id: 'traits', label: 'Traits', icon: <Settings2  className="w-3.5 h-3.5" /> },
  ];

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

      {/* ════════════════════════════════════════════════
          LEFT SIDEBAR
          ════════════════════════════════════════════════ */}
      <div
        className="shrink-0 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden"
        style={{ width: leftPanelWidth }}
      >

        {/* ── PAGES ─────────────────────────────────── */}
        <div className="shrink-0">
          <SectionHeader label="PAGES" open={pagesOpen} onToggle={() => setPagesOpen(v => !v)} />
          {pagesOpen && (
            <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
              <PagesSidebarPanel />
            </div>
          )}
        </div>

        {/* ── CMS ───────────────────────────────────── */}
        <div className="shrink-0">
          <SectionHeader label="CMS" open={cmsOpen} onToggle={() => setCmsOpen(v => !v)} />
          {cmsOpen && (
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              <CmsPanel />
            </div>
          )}
        </div>

        {/* ── EDITOR (Blocks / Style / Layers / Traits) ─
            Takes all remaining height so panels can fill
            the sidebar and scroll internally.           */}
        <div className="flex flex-col flex-1 min-h-0">
          <SectionHeader label="EDITOR" open={editorOpen} onToggle={() => setEditorOpen(v => !v)} />

          {editorOpen && (
            <div className="flex flex-col flex-1 min-h-0">

              {/* Tab strip */}
              <div className="shrink-0 flex border-b border-slate-200 bg-slate-50">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[9px] font-semibold transition-colors
                      ${activeTab === tab.id
                        ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Panel content area — scrollable, fills remaining height.
                  ALL four divs are always in the DOM so GrapesJS can mount
                  into them. We show/hide via display so GrapesJS internal
                  state is never disrupted.                                */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden gjs-left-panel-content">
                <div id="left-panel-blocks" style={{ display: activeTab === 'blocks' ? 'block' : 'none' }} />
                <div id="left-panel-styles" style={{ display: activeTab === 'styles' ? 'block' : 'none' }} />
                <div id="left-panel-layers" style={{ display: activeTab === 'layers' ? 'block' : 'none' }} />
                <div id="left-panel-traits" style={{ display: activeTab === 'traits' ? 'block' : 'none' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Left resize handle ─────────────────────── */}
      {onLeftResize && (
        <div
          onMouseDown={handleLeftMouseDown}
          className="shrink-0 w-1 cursor-col-resize bg-slate-200 hover:bg-teal-400 active:bg-teal-500 transition-colors"
          style={{ zIndex: 10 }}
        />
      )}

      {/* ════════════════════════════════════════════════
          CANVAS (GrapesJS renders only the canvas here,
          all panels are in the sidebar above)
          ════════════════════════════════════════════════ */}
      <div className="relative flex-1 h-full min-w-0">
        <div ref={canvasRef} id="gjs" className="w-full h-full" />

        {/* Zoom controls */}
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
