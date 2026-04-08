export type CmsFieldType = 'text' | 'textarea' | 'number' | 'url' | 'boolean' | 'image' | 'gallery';

export interface CmsField {
  name: string;
  type: CmsFieldType;
  required?: boolean;
}

export interface CmsContentType {
  id: number;
  name: string;
  slug: string;
  fields: CmsField[];
  createdAt: string;
  entryCount: number;
}

export interface CmsEntry {
  id: number;
  typeId: number;
  data: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Pick a display title from an entry's data fields. */
export function entryTitle(entry: CmsEntry, fields: CmsField[]): string {
  const titleField = fields.find((f) =>
    ['title', 'name', 'headline', 'label', 'slug'].includes(f.name.toLowerCase())
  );
  if (titleField) return String(entry.data[titleField.name] ?? '');
  // Fallback: first text field
  const first = fields.find((f) => f.type === 'text' || f.type === 'textarea');
  if (first) return String(entry.data[first.name] ?? '').slice(0, 60);
  return `Entry #${entry.id}`;
}

/** Build a GrapesJS-droppable HTML block from a content type's entries. */
export function buildCmsBlockHtml(type: CmsContentType, entries: CmsEntry[]): string {
  const titleField = type.fields.find((f) =>
    ['title', 'name', 'headline', 'label'].includes(f.name.toLowerCase())
  )?.name ?? type.fields.find((f) => f.type === 'text')?.name;

  const bodyField = type.fields.find((f) =>
    ['body', 'content', 'description', 'excerpt', 'summary'].includes(f.name.toLowerCase()) ||
    f.type === 'textarea'
  )?.name;

  const imageField = type.fields.find((f) => f.type === 'image')?.name
    ?? type.fields.find((f) => f.type === 'url' && /image|photo|thumb/i.test(f.name))?.name;

  const galleryField = type.fields.find((f) => f.type === 'gallery')?.name;

  const items = entries.map((e) => {
    const title = titleField ? String(e.data[titleField] ?? '') : `#${e.id}`;
    const body = bodyField ? String(e.data[bodyField] ?? '') : '';
    const img = imageField ? String(e.data[imageField] ?? '') : '';
    const gallery = galleryField && Array.isArray(e.data[galleryField])
      ? (e.data[galleryField] as string[])
      : [];

    const galleryHtml = gallery.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;margin-top:8px;">
          ${gallery.map((u) => `<img src="${u}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;" />`).join('')}
        </div>`
      : '';

    return `
  <div data-cms-entry="${e.id}" style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;background:#fff;">
    ${img ? `<img src="${img}" alt="${title}" style="width:100%;height:180px;object-fit:cover;border-radius:4px;margin-bottom:10px;" />` : ''}
    ${title ? `<h3 style="margin:0 0 6px;font-size:1rem;font-weight:600;color:#1e293b;">${title}</h3>` : ''}
    ${body ? `<p style="margin:0;font-size:.875rem;color:#64748b;">${body}</p>` : ''}
    ${galleryHtml}
  </div>`;
  }).join('');

  return `<section data-cms-type="${type.slug}" data-cms-type-id="${type.id}" style="padding:24px;background:#f8fafc;">
  <h2 style="margin:0 0 16px;font-size:1.25rem;font-weight:700;color:#0f172a;">${type.name}</h2>
  ${items || '<p style="color:#94a3b8;">No entries yet.</p>'}
</section>`;
}
