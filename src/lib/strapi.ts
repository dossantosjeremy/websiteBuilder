/**
 * Strapi v5 API client.
 * All calls go through the Next.js proxy at /api/cms/* to avoid CORS issues.
 *
 * Strapi v5 key changes vs v4:
 *  - Response shape is FLAT: { data: [{ id, documentId, ...fields }] }
 *    (no more nested "attributes" wrapper)
 *  - Use documentId (24-char string) as the stable identifier, not numeric id
 *  - content-type-builder endpoint: /api/content-type-builder/content-types
 */

const PROXY = '/api/cms';

// ─── Types ────────────────────────────────────────────────────────────────

export interface StrapiContentType {
  uid: string;          // e.g. "api::article.article"
  kind: 'collectionType' | 'singleType';
  displayName: string;
  singularName: string; // e.g. "article"
  pluralName: string;   // e.g. "articles" — used in REST URL
}

export interface StrapiEntry {
  id: number;
  documentId: string;   // v5 stable 24-char identifier
  [key: string]: unknown;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// ─── Connection ────────────────────────────────────────────────────────────

export async function pingStrapi(): Promise<boolean> {
  try {
    const res = await fetch(`${PROXY}/content-type-builder/content-types`, {
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Content Types ─────────────────────────────────────────────────────────
// Endpoint: GET /api/content-type-builder/content-types
// Only available in Strapi "develop" mode, not production start.
// Filter to api:: prefix to exclude Strapi internals (plugin::, admin::).

export async function getContentTypes(): Promise<StrapiContentType[]> {
  const res = await fetch(`${PROXY}/content-type-builder/content-types`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`getContentTypes: ${res.status}`);

  const json = await res.json();
  // v5 shape: { data: [{ uid, schema: { kind, displayName, singularName, pluralName } }] }
  const raw: Array<{ uid: string; schema: Record<string, unknown> }> = json.data ?? [];

  return raw
    .filter((t) => t.uid.startsWith('api::'))
    .map((t) => ({
      uid: t.uid,
      kind: (t.schema.kind as 'collectionType' | 'singleType') ?? 'collectionType',
      displayName: (t.schema.displayName as string) ?? t.uid,
      singularName: (t.schema.singularName as string) ?? t.uid.split('.')[1],
      pluralName: (t.schema.pluralName as string) ?? `${t.uid.split('.')[1]}s`,
    }));
}

// ─── Entries ───────────────────────────────────────────────────────────────
// Endpoint: GET /api/{pluralName}?pagination[pageSize]=N
// v5 flat response: { data: [{ id, documentId, title, ... }] }

export async function getEntries(
  pluralName: string,
  pageSize = 5
): Promise<StrapiEntry[]> {
  const url = `${PROXY}/${pluralName}?pagination[pageSize]=${pageSize}&pagination[page]=1`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`getEntries(${pluralName}): ${res.status}`);
  const json = await res.json();
  return (json.data ?? []) as StrapiEntry[];
}

// ─── Single Entry ──────────────────────────────────────────────────────────
// Endpoint: GET /api/{pluralName}/{documentId}   (use documentId, not numeric id)

export async function getEntry(
  pluralName: string,
  documentId: string
): Promise<StrapiEntry | null> {
  const res = await fetch(`${PROXY}/${pluralName}/${documentId}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getEntry(${pluralName}, ${documentId}): ${res.status}`);
  const json = await res.json();
  return json.data as StrapiEntry;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Pick the most likely human-readable title field from an entry. */
export function entryTitle(entry: StrapiEntry): string {
  const candidates = ['title', 'name', 'headline', 'label', 'slug', 'subject'];
  const field = candidates.find((f) => typeof entry[f] === 'string');
  return field ? String(entry[field]) : entry.documentId;
}

/** Pick the most likely description/body field from an entry. */
export function entryExcerpt(entry: StrapiEntry, maxLen = 90): string {
  const candidates = ['description', 'excerpt', 'summary', 'body', 'content'];
  const field = candidates.find((f) => typeof entry[f] === 'string');
  if (!field) return '';
  const text = String(entry[field]);
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/** Build the GrapesJS block HTML for a Strapi collection. */
export function buildCollectionBlockHtml(
  type: StrapiContentType,
  entries: StrapiEntry[]
): string {
  const rows = entries
    .slice(0, 3)
    .map(
      (e) => `
      <div data-strapi-type="${type.uid}" data-strapi-id="${e.documentId}"
        style="border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-bottom:8px;background:#fff;">
        <div style="font-weight:600;font-size:13px;color:#1e293b;margin-bottom:4px;">
          ${entryTitle(e)}
        </div>
        ${entryExcerpt(e) ? `<div style="font-size:11px;color:#64748b;">${entryExcerpt(e)}</div>` : ''}
      </div>`
    )
    .join('');

  return `
    <section data-strapi-collection="${type.uid}"
      style="padding:20px;font-family:sans-serif;background:#f8fafc;">
      <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 14px;">
        ${type.displayName}
      </h2>
      ${rows || '<p style="color:#94a3b8;font-size:13px;">No entries yet.</p>'}
    </section>`;
}
