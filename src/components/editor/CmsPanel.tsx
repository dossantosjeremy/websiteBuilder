'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database, Plus, Trash2, ChevronDown, ChevronRight,
  Pencil, Check, X, RefreshCw, Layout, ImageIcon, Images,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildCmsBlockHtml, entryTitle } from '@/lib/cms';
import type { CmsContentType, CmsEntry, CmsField, CmsFieldType } from '@/lib/cms';
import { useEditorContext } from './EditorContext';

// ── API helpers ───────────────────────────────────────────────────────────────
const api = {
  setup: () => fetch('/api/cms/setup', { method: 'POST' }),
  types: {
    list: () => fetch('/api/cms/types').then((r) => r.json()) as Promise<CmsContentType[]>,
    create: (name: string, fields: CmsField[]) =>
      fetch('/api/cms/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fields }),
      }).then((r) => r.json()) as Promise<CmsContentType>,
    delete: (id: number) => fetch(`/api/cms/types/${id}`, { method: 'DELETE' }),
  },
  entries: {
    list: (typeId: number) =>
      fetch(`/api/cms/types/${typeId}/entries`).then((r) => r.json()) as Promise<CmsEntry[]>,
    create: (typeId: number, data: Record<string, unknown>) =>
      fetch(`/api/cms/types/${typeId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      }).then((r) => r.json()) as Promise<CmsEntry>,
    update: (typeId: number, entryId: number, data: Record<string, unknown>) =>
      fetch(`/api/cms/types/${typeId}/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      }).then((r) => r.json()) as Promise<CmsEntry>,
    delete: (typeId: number, entryId: number) =>
      fetch(`/api/cms/types/${typeId}/entries/${entryId}`, { method: 'DELETE' }),
  },
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const { url } = await res.json();
  return url as string;
}

// ── Field types ───────────────────────────────────────────────────────────────
const FIELD_TYPES: { value: CmsFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image (upload)' },
  { value: 'gallery', label: 'Gallery (upload)' },
  { value: 'boolean', label: 'Yes / No' },
];

// ── Image upload inputs ───────────────────────────────────────────────────────
function SingleImageInput({ value, onChange }: { value: unknown; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const url = typeof value === 'string' ? value : '';

  const handle = async (file: File) => {
    setUploading(true);
    try { onChange(await uploadFile(file)); } catch { /* ignore */ } finally { setUploading(false); }
  };

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      {url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-20 object-cover rounded border border-slate-200" />
          <button onClick={() => onChange('')}
            className="absolute top-1 right-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm hover:bg-red-50 hover:border-red-300">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="w-full border-2 border-dashed border-slate-200 rounded py-3 flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-50">
          {uploading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</>
            : <><ImageIcon className="w-4 h-4" /> Click to upload</>}
        </button>
      )}
    </div>
  );
}

function GalleryInput({ value, onChange }: { value: unknown; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const urls: string[] = Array.isArray(value) ? (value as string[]) : [];

  const handle = async (files: FileList) => {
    setUploading(true);
    try {
      const newUrls = await Promise.all(Array.from(files).map(uploadFile));
      onChange([...urls, ...newUrls]);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  const remove = (i: number) => onChange(urls.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-1.5">
      <input ref={ref} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => e.target.files && handle(e.target.files)} />
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {urls.map((u, i) => (
            <div key={i} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover rounded border border-slate-200" />
              <button onClick={() => remove(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50">
                <X className="w-2.5 h-2.5 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => ref.current?.click()} disabled={uploading}
        className="w-full border-2 border-dashed border-slate-200 rounded py-2 flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors disabled:opacity-50">
        {uploading
          ? <><RefreshCw className="w-3 h-3 animate-spin" /> Uploading…</>
          : <><Images className="w-3 h-3" /> Add images</>}
      </button>
    </div>
  );
}

// ── Field input dispatcher ────────────────────────────────────────────────────
function FieldInput({ field, value, onChange }: {
  field: CmsField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === 'image') return <SingleImageInput value={value} onChange={onChange as (v: string) => void} />;
  if (field.type === 'gallery') return <GalleryInput value={value} onChange={onChange as (v: string[]) => void} />;

  const base = 'w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="accent-teal-600" />
        {field.name}
      </label>
    );
  }
  if (field.type === 'textarea') {
    return <textarea rows={2} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
      placeholder={field.name} className={cn(base, 'resize-none')} />;
  }
  return (
    <input type={field.type === 'number' ? 'number' : 'text'}
      value={String(value ?? '')}
      onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={field.name} className={base} />
  );
}

// ── Entry form ────────────────────────────────────────────────────────────────
function EntryForm({ fields, initial, onSave, onCancel }: {
  fields: CmsField[];
  initial?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Record<string, unknown>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const set = (name: string, v: unknown) => setData((prev) => ({ ...prev, [name]: v }));

  const submit = async () => {
    setSaving(true);
    try { await onSave(data); } finally { setSaving(false); }
  };

  return (
    <div className="p-2 space-y-1.5 bg-slate-50 border-t border-slate-200">
      {fields.length === 0
        ? <p className="text-[10px] text-slate-400 text-center py-2">No fields defined.</p>
        : fields.map((f) => (
          <div key={f.name}>
            {f.type !== 'boolean' && (
              <label className="block text-[10px] text-slate-500 mb-0.5 capitalize">{f.name}</label>
            )}
            <FieldInput field={f} value={data[f.name]} onChange={(v) => set(f.name, v)} />
          </div>
        ))
      }
      <div className="flex gap-1.5 pt-1">
        <button onClick={submit} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded py-1 disabled:opacity-50">
          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
        </button>
        <button onClick={onCancel} className="px-3 text-[11px] border border-slate-200 rounded py-1 hover:bg-slate-100 text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── New type form ─────────────────────────────────────────────────────────────
function NewTypeForm({ onSave, onCancel }: {
  onSave: (name: string, fields: CmsField[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<CmsField[]>([{ name: 'title', type: 'text' }]);
  const [saving, setSaving] = useState(false);

  const addField = () => setFields((f) => [...f, { name: '', type: 'text' }]);
  const removeField = (i: number) => setFields((f) => f.filter((_, idx) => idx !== i));
  const setFieldProp = (i: number, key: keyof CmsField, val: string) =>
    setFields((f) => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onSave(name.trim(), fields.filter((f) => f.name.trim())); } finally { setSaving(false); }
  };

  return (
    <div className="p-3 space-y-2 border-b border-slate-200 bg-slate-50">
      <p className="text-[11px] font-semibold text-slate-700">New Content Type</p>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blog Posts"
        className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white" />
      <p className="text-[10px] text-slate-500 font-medium">Fields</p>
      <div className="space-y-1">
        {fields.map((f, i) => (
          <div key={i} className="flex gap-1">
            <input value={f.name} onChange={(e) => setFieldProp(i, 'name', e.target.value)} placeholder="name"
              className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white" />
            <select value={f.type} onChange={(e) => setFieldProp(i, 'type', e.target.value)}
              className="text-[11px] border border-slate-200 rounded px-1 py-1 bg-white focus:outline-none">
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={() => removeField(i)} className="text-slate-300 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addField} className="text-[10px] text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
        <Plus className="w-3 h-3" /> Add field
      </button>
      <div className="flex gap-1.5 pt-1">
        <button onClick={submit} disabled={saving || !name.trim()}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded py-1 disabled:opacity-50">
          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Create
        </button>
        <button onClick={onCancel} className="px-3 text-[11px] border border-slate-200 rounded py-1 hover:bg-slate-100 text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main CMS panel ────────────────────────────────────────────────────────────
export default function CmsPanel() {
  const { editor } = useEditorContext();
  const [ready, setReady] = useState(false);
  const [types, setTypes] = useState<CmsContentType[]>([]);
  const [entries, setEntries] = useState<Record<number, CmsEntry[]>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showNewType, setShowNewType] = useState(false);
  const [addingEntry, setAddingEntry] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ typeId: number; entry: CmsEntry } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try { setTypes(await api.types.list()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api.setup().then(() => { setReady(true); loadTypes(); });
  }, [loadTypes]);

  const loadEntries = async (typeId: number) => {
    const list = await api.entries.list(typeId);
    setEntries((prev) => ({ ...prev, [typeId]: list }));
    return list;
  };

  const toggleExpand = async (typeId: number) => {
    if (expanded === typeId) { setExpanded(null); return; }
    setExpanded(typeId);
    if (!entries[typeId]) await loadEntries(typeId);
  };

  const createType = async (name: string, fields: CmsField[]) => {
    await api.types.create(name, fields);
    setShowNewType(false);
    await loadTypes();
  };

  const deleteType = async (id: number) => {
    if (!confirm('Delete this content type and all its entries?')) return;
    await api.types.delete(id);
    setTypes((prev) => prev.filter((t) => t.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const createEntry = async (typeId: number, data: Record<string, unknown>) => {
    await api.entries.create(typeId, data);
    setAddingEntry(null);
    await loadEntries(typeId);
    setTypes((prev) => prev.map((t) => t.id === typeId ? { ...t, entryCount: t.entryCount + 1 } : t));
  };

  const updateEntry = async (typeId: number, entryId: number, data: Record<string, unknown>) => {
    await api.entries.update(typeId, entryId, data);
    setEditingEntry(null);
    await loadEntries(typeId);
  };

  const deleteEntry = async (typeId: number, entryId: number) => {
    if (!confirm('Delete this entry?')) return;
    await api.entries.delete(typeId, entryId);
    setEntries((prev) => ({ ...prev, [typeId]: (prev[typeId] ?? []).filter((e) => e.id !== entryId) }));
    setTypes((prev) => prev.map((t) => t.id === typeId ? { ...t, entryCount: Math.max(0, t.entryCount - 1) } : t));
  };

  // Always fetches fresh entries so the canvas block shows current data
  const addToCanvas = async (type: CmsContentType) => {
    if (!editor) return;
    const latestEntries = await loadEntries(type.id);
    const html = buildCmsBlockHtml(type, latestEntries);
    // Remove stale block so next add always reflects latest entries
    const blockId = `cms--${type.slug}`;
    try { editor.BlockManager.remove(blockId); } catch { /* ok */ }
    editor.BlockManager.add(blockId, {
      label: type.name,
      category: 'CMS',
      media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
      content: html,
    });
    editor.addComponents(html);
  };

  // Find all CMS collection blocks on the canvas and re-fetch their entries
  const syncCanvas = async () => {
    if (!editor) return;
    setSyncing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allComponents: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walk = (comps: any) => { comps?.forEach((c: any) => { allComponents.push(c); walk(c.components()); }); };
      walk(editor.getComponents());

      const updated = new Set<number>();
      for (const comp of allComponents) {
        const typeId = Number(comp.getAttributes?.()?.['data-cms-type-id']);
        if (!typeId || updated.has(typeId)) continue;
        updated.add(typeId);
        const type = types.find((t) => t.id === typeId);
        if (!type) continue;
        const fresh = await api.entries.list(typeId);
        setEntries((prev) => ({ ...prev, [typeId]: fresh }));
        const html = buildCmsBlockHtml(type, fresh);
        comp.replaceWith(html);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-4 text-[11px] text-slate-400 gap-1.5">
        <RefreshCw className="w-3 h-3 animate-spin" /> Setting up CMS…
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-[11px] font-semibold text-slate-700">
            CMS{types.length > 0 && <span className="text-slate-400 font-normal"> · {types.length} type{types.length !== 1 ? 's' : ''}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={syncCanvas} disabled={syncing || !editor} title="Sync all CMS blocks on canvas"
            className="p-1 rounded hover:bg-slate-200">
            <RefreshCw className={cn('w-3 h-3 text-slate-400', syncing && 'animate-spin')} />
          </button>
          <button onClick={() => setShowNewType((v) => !v)} title="New content type" className="p-1 rounded hover:bg-slate-200">
            <Plus className="w-3.5 h-3.5 text-teal-600" />
          </button>
        </div>
      </div>

      {showNewType && <NewTypeForm onSave={createType} onCancel={() => setShowNewType(false)} />}

      {types.length === 0 && !showNewType && (
        <div className="p-4 text-center">
          <Database className="w-6 h-6 text-slate-200 mx-auto mb-2" />
          <p className="text-[11px] text-slate-500 mb-1">No content types yet</p>
          <button onClick={() => setShowNewType(true)} className="text-[11px] text-teal-600 hover:text-teal-700 underline">
            Create your first type
          </button>
        </div>
      )}

      {types.map((type) => {
        const isOpen = expanded === type.id;
        const typeEntries = entries[type.id];
        const typeFields = type.fields as CmsField[];

        return (
          <div key={type.id} className="border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 group">
              <button onClick={() => toggleExpand(type.id)} className="shrink-0 text-slate-400 hover:text-teal-600">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(type.id)}>
                <div className="text-[11px] font-medium text-slate-700 truncate">{type.name}</div>
                <div className="text-[10px] text-slate-400">{type.entryCount} {type.entryCount === 1 ? 'entry' : 'entries'}</div>
              </div>
              <button onClick={() => addToCanvas(type)} title="Add to canvas"
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded bg-teal-600 hover:bg-teal-700 text-white transition-opacity">
                <Layout className="w-3 h-3" />
              </button>
              <button onClick={() => deleteType(type.id)} title="Delete type"
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {isOpen && (
              <div className="bg-slate-50 border-t border-slate-100">
                {!typeEntries ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 text-[10px] text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    {typeEntries.map((entry) => {
                      const isEditing = editingEntry?.entry.id === entry.id;
                      return (
                        <div key={entry.id}>
                          {isEditing ? (
                            <EntryForm fields={typeFields} initial={entry.data as Record<string, unknown>}
                              onSave={(data) => updateEntry(type.id, entry.id, data)}
                              onCancel={() => setEditingEntry(null)} />
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-100 group/entry hover:bg-white">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                              <span className="flex-1 text-[11px] text-slate-600 truncate">
                                {entryTitle(entry, typeFields)}
                              </span>
                              <button onClick={() => setEditingEntry({ typeId: type.id, entry })}
                                className="opacity-0 group-hover/entry:opacity-100 p-0.5 text-slate-300 hover:text-teal-600">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteEntry(type.id, entry.id)}
                                className="opacity-0 group-hover/entry:opacity-100 p-0.5 text-slate-300 hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {addingEntry === type.id ? (
                      <EntryForm fields={typeFields}
                        onSave={(data) => createEntry(type.id, data)}
                        onCancel={() => setAddingEntry(null)} />
                    ) : (
                      <button onClick={() => { setAddingEntry(type.id); setEditingEntry(null); }}
                        className="flex items-center gap-1 px-4 py-2 text-[11px] text-teal-600 hover:text-teal-700 hover:bg-white w-full">
                        <Plus className="w-3 h-3" /> Add entry
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
