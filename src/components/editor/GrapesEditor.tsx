'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorContext, type PageData } from './EditorContext';
import 'grapesjs/dist/css/grapes.min.css';

export default function GrapesEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setEditor, project, pages, currentPageIndex, setPages } = useEditorContext();
  const initDoneRef = useRef(false);
  const editorInstanceRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesRef = useRef<PageData[]>(pages);
  const currentPageIndexRef = useRef<number>(currentPageIndex);
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
        const [
          gjs,
          presetWebpage,
          gjsNavbar,
          gjsTabs,
          gjsCustomCode,
          gjsTouch,
          gjsTooltip,
          gjsTuiImageEditor,
          gjsTyped,
          gjsLorySlider,
          gjsStyleGradient,
          gjsStyleFilter,
          gjsStyleBg,
          gjsBlocksFlexbox,
          gjsPluginForms,
          gjsComponentCountdown,
        ] = await Promise.all([
          import('grapesjs'),
          import('grapesjs-preset-webpage'),
          import('grapesjs-navbar'),
          import('grapesjs-tabs'),
          import('grapesjs-custom-code'),
          import('grapesjs-touch'),
          import('grapesjs-tooltip'),
          import('grapesjs-tui-image-editor'),
          import('grapesjs-typed'),
          import('grapesjs-lory-slider'),
          import('grapesjs-style-gradient'),
          import('grapesjs-style-filter'),
          import('grapesjs-style-bg'),
          import('grapesjs-blocks-flexbox'),
          import('grapesjs-plugin-forms'),
          import('grapesjs-component-countdown'),
        ]);

        if (!mounted || !containerRef.current) return;

        const initialData = getInitialData();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resolvePlugin = (mod: any) => mod.default ?? mod;

        const editor = resolvePlugin(gjs).init({
          container: containerRef.current,
          height: 'calc(100vh - 60px)',
          width: '100%',
          storageManager: false,
          undoManager: { trackChanges: true },
          panels: { defaults: [] },  // We build our own panels in React
          blockManager: { appendTo: false },  // We render blocks in React ourselves
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
          plugins: [
            resolvePlugin(presetWebpage),
            resolvePlugin(gjsNavbar),
            resolvePlugin(gjsTabs),
            resolvePlugin(gjsCustomCode),
            resolvePlugin(gjsTouch),
            resolvePlugin(gjsTooltip),
            resolvePlugin(gjsTuiImageEditor),
            resolvePlugin(gjsTyped),
            resolvePlugin(gjsLorySlider),
            resolvePlugin(gjsStyleGradient),
            resolvePlugin(gjsStyleFilter),
            resolvePlugin(gjsStyleBg),
            resolvePlugin(gjsBlocksFlexbox),
            resolvePlugin(gjsPluginForms),
            resolvePlugin(gjsComponentCountdown),
          ],
          pluginsOpts: {
            [resolvePlugin(presetWebpage)]: {},
            [resolvePlugin(gjsBlocksFlexbox)]: { flexboxBlock: true },
          },
        });

        // Load initial page data
        if ((initialData.components as any[])?.length > 0) { // eslint-disable-line @typescript-eslint/no-explicit-any
          editor.setComponents(initialData.components);
        }
        if ((initialData.styles as any[])?.length > 0) { // eslint-disable-line @typescript-eslint/no-explicit-any
          editor.setStyle(initialData.styles);
        }

        // Debounced change → save to context
        const onEditorChange = () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const components = editor.getComponents().toJSON();
            const styles = editor.getStyle().toJSON();
            const latestPages = pagesRef.current;
            const latestIdx = currentPageIndexRef.current;
            setPages(latestPages.map((p, i) => i === latestIdx ? { ...p, components, styles } : p));
          }, 500);
        };

        editor.on('component:add', onEditorChange);
        editor.on('component:remove', onEditorChange);
        editor.on('component:update', onEditorChange);
        editor.on('style:change', onEditorChange);

        editorInstanceRef.current = editor;
        setEditor(editor);

        // (Studio SDK handles block management natively)
      } catch (err) {
        console.error('GrapesJS init error:', err);
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

  return (
    <div
      ref={containerRef}
      id="gjs"
      style={{ height: 'calc(100vh - 60px)', width: '100%' }}
    />
  );
}
