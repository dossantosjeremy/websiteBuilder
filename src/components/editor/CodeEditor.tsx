'use client';

import { useEffect, useRef } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'javascript';
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  height = '300px',
  readOnly = false,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    let destroyed = false;

    const initEditor = async () => {
      const [
        { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine },
        { defaultKeymap, historyKeymap, history },
        { EditorState },
        { autocompletion, closeBrackets },
        { oneDark },
        htmlLang,
        cssLang,
        jsLang,
      ] = await Promise.all([
        import('@codemirror/view'),
        import('@codemirror/commands'),
        import('@codemirror/state'),
        import('@codemirror/autocomplete'),
        import('@codemirror/theme-one-dark'),
        import('@codemirror/lang-html'),
        import('@codemirror/lang-css'),
        import('@codemirror/lang-javascript'),
      ]);

      if (destroyed || !containerRef.current) return;

      const langExtension =
        language === 'html'
          ? htmlLang.html()
          : language === 'css'
          ? cssLang.css()
          : jsLang.javascript({ typescript: false });

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !readOnly) {
          onChange(update.state.doc.toString());
        }
      });

      const extensions = [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        autocompletion(),
        closeBrackets(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        langExtension,
        oneDark,
        updateListener,
        EditorView.theme({
          '&': { height },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'monospace' },
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ];

      const state = EditorState.create({
        doc: value,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;
    };

    initEditor().catch(console.error);

    return () => {
      destroyed = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly, height]);

  // Sync external value changes
  useEffect(() => {
    if (!viewRef.current) return;
    const current = viewRef.current.state.doc.toString();
    if (current !== value) {
      viewRef.current.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-[hsl(0,0%,18%)] overflow-hidden text-sm"
      style={{ height }}
    />
  );
}
