// Server-only helpers for Sanity Presentation (visual editing).
// Draft content is served only under /preview/* and only with a valid
// preview cookie, which is set after Sanity validates the request.

export const PREVIEW_PREFIX = '/preview';
export const PREVIEW_COOKIE = 'sanity-preview';

export function readToken(): string | undefined {
  return process.env.SANITY_API_READ_TOKEN || import.meta.env.SANITY_API_READ_TOKEN || undefined;
}

/** HMAC of a fixed message with the read token, so the cookie can't be forged. */
export async function previewCookieValue(): Promise<string | undefined> {
  const token = readToken();
  if (!token) return undefined;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('sanity-preview-v1'));
  return Buffer.from(sig).toString('hex');
}

export async function isValidPreviewCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await previewCookieValue();
  return !!expected && value === expected;
}

/** Prefix internal links while previewing so navigation stays in draft mode. */
export function href(locals: App.Locals, path: string): string {
  if (!locals.preview || !path.startsWith('/')) return path;
  return path === '/' ? PREVIEW_PREFIX : `${PREVIEW_PREFIX}${path}`;
}
