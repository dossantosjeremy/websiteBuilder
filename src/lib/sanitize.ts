/**
 * Strip script tags and on* event handlers from HTML strings.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate that a string is a safe URL slug.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,100}$/.test(slug);
}

/**
 * Validate project name — 1 to 100 characters.
 */
export function isValidProjectName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}
