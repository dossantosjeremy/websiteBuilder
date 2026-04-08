'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database, RefreshCw, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, ExternalLink, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  pingStrapi, getContentTypes, getEntries,
  buildCollectionBlockHtml, entryTitle, entryExcerpt,
} from '@/lib/strapi';
import type { StrapiContentType, StrapiEntry } from '@/lib/strapi';
import { useEditorContext } from './EditorContext';

type Status = 'checking' | 'connected' | 'disconnected';

export default function CmsPanel() {
  const { editor } = useEditorContext();
  const [status, setStatus] = useState<Status>('checking');
  const [types, setTypes] = useState<StrapiContentType[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, StrapiEntry[]>>({});
  const [loading, setLoading] = useState(false);

  // ── Connection check ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setStatus('checking');
    setLoading(true);
    try {
      const alive = await pingStrapi();
      if (!alive) { setStatus('disconnected'); return; }
      setStatus('connected');
      const fetched = await getContentTypes();
      setTypes(fetched);
    } catch {
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Register GrapesJS block for a content type ────────────────────────────
  const registerBlock = useCallback(
    (type: StrapiContentType, entries: StrapiEntry[]) => {
      if (!editor) return;
      const blockId = `strapi--${type.uid}`;
      if (editor.BlockManager.get(blockId)) return; // already registered

      editor.BlockManager.add(blockId, {
        label: type.displayName,
        category: 'CMS',
        media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>`,
        content: buildCollectionBlockHtml(type, entries),
      });
    },
    [editor]
  );

  // Register block whenever we fetch entries for a type
  useEffect(() => {
    types.forEach((t) => {
      const entries = previews[t.uid];
      if (entries) registerBlock(t, entries);
    });
  }, [types, previews, registerBlock]);

  // ── Expand a type row → fetch preview entries ─────────────────────────────
  const toggle = async (type: StrapiContentType) => {
    if (expanded === type.uid) { setExpanded(null); return; }
    setExpanded(type.uid);
    if (!previews[type.uid]) {
      try {
        const entries = await getEntries(type.pluralName, 3);
        setPreviews((prev) => ({ ...prev, [type.uid]: entries }));
      } catch {
        setPreviews((prev) => ({ ...prev, [type.uid]: [] }));
      }
    }
  };

  // ── Add block to canvas on click ─────────────────────────────────────────
  const addToCanvas = (type: StrapiContentType) => {
    if (!editor) return;
    const entries = previews[type.uid] ?? [];
    registerBlock(type, entries);
    const blockId = `strapi--${type.uid}`;
    const block = editor.BlockManager.get(blockId);
    if (block) editor.addComponents(block.get('content'));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white text-slate-800">

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-1.5">
          {status === 'checking' && <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
          {status === 'connected' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
          {status === 'disconnected' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          <span className={cn('text-[11px] font-medium', {
            'text-amber-600': status === 'checking',
            'text-teal-700': status === 'connected',
            'text-red-600': status === 'disconnected',
          })}>
            {status === 'checking' && 'Connecting…'}
            {status === 'connected' && `Strapi · ${types.length} type${types.length !== 1 ? 's' : ''}`}
            {status === 'disconnected' && 'Strapi offline'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'connected' && (
            <a
              href="http://localhost:1337/admin"
              target="_blank"
              rel="noreferrer"
              title="Open Strapi admin"
              className="p-1 rounded hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh"
            className="p-1 rounded hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3 text-slate-400', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Disconnected state */}
        {status === 'disconnected' && (
          <div className="p-5 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-xs text-slate-600 font-medium mb-1">Strapi is not running</p>
            <p className="text-[10px] text-slate-400 mb-3">
              Start it with:
            </p>
            <code className="block bg-slate-100 border border-slate-200 rounded px-3 py-2 text-[10px] text-slate-700 font-mono mb-4">
              npm run dev:cms
            </code>
            <p className="text-[10px] text-slate-400">
              Then open{' '}
              <a
                href="http://localhost:1337/admin"
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 underline"
              >
                localhost:1337/admin
              </a>{' '}
              to create your first content type.
            </p>
          </div>
        )}

        {/* Empty state */}
        {status === 'connected' && types.length === 0 && !loading && (
          <div className="p-5 text-center">
            <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-1">No content types yet</p>
            <p className="text-[10px] text-slate-400 mb-3">
              Create a collection type in the Strapi admin, then refresh.
            </p>
            <a
              href="http://localhost:1337/admin/plugins/content-type-builder"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 underline"
            >
              Open Content-Type Builder <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Content type list */}
        {status === 'connected' && types.map((type) => {
          const isExpanded = expanded === type.uid;
          const entries = previews[type.uid];

          return (
            <div key={type.uid} className="border-b border-slate-100 last:border-0">
              {/* Type row */}
              <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors group">
                {/* Expand toggle */}
                <button
                  onClick={() => toggle(type)}
                  className="shrink-0 text-slate-400 hover:text-teal-600"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />
                  }
                </button>

                <Database className="w-3.5 h-3.5 shrink-0 text-teal-600" />

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(type)}>
                  <div className="text-xs font-medium text-slate-700 truncate">{type.displayName}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {type.kind === 'singleType' ? 'Single Type' : 'Collection'} · /{type.pluralName}
                  </div>
                </div>

                {/* Add to canvas button */}
                <button
                  onClick={() => addToCanvas(type)}
                  title="Add to canvas"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Entry previews */}
              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100 px-3 pb-3">
                  {!entries ? (
                    <div className="py-3 flex items-center gap-2 text-[10px] text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Loading entries…
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="py-3 text-[10px] text-slate-400">
                      No published entries yet.
                    </div>
                  ) : (
                    <div className="pt-2 space-y-1.5">
                      {entries.map((entry) => (
                        <div
                          key={entry.documentId}
                          className="flex items-start gap-2 py-1.5 px-2 bg-white rounded border border-slate-200"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium text-slate-700 truncate">
                              {entryTitle(entry)}
                            </div>
                            {entryExcerpt(entry, 60) && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {entryExcerpt(entry, 60)}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-300 font-mono shrink-0 ml-auto">
                            {entry.documentId.slice(0, 6)}
                          </span>
                        </div>
                      ))}
                      <p className="text-[9px] text-slate-400 text-center pt-1">
                        Click <span className="font-semibold text-teal-600">+</span> on the row above to add this collection to the canvas
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
