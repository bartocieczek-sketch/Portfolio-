// Server side of the portal (panel.bartocieczek.com): password session and
// Sanity access with server-only tokens. Nothing here reaches the browser.
import { sanityClient } from 'sanity:client';
import type { AstroCookies } from 'astro';

export const PANEL_COOKIE = 'bo-panel';
const env = (k: string): string | undefined => process.env[k] || (import.meta.env as Record<string, string | undefined>)[k] || undefined;

export const panelPassword = () => env('PANEL_PASSWORD');
const writeToken = () => env('SANITY_API_WRITE_TOKEN');
const readToken = () => env('SANITY_API_READ_TOKEN') || writeToken();

async function hmac(message: string): Promise<string | undefined> {
  const secret = panelPassword();
  if (!secret) return undefined;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`bo-panel:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString('base64url');
}

/** Cookie value: "<expiry>.<signature>" */
export async function sessionValue(days = 30): Promise<string | undefined> {
  const exp = Date.now() + days * 864e5;
  const sig = await hmac(String(exp));
  return sig ? `${exp}.${sig}` : undefined;
}

export async function isSignedIn(cookies: AstroCookies): Promise<boolean> {
  const v = cookies.get(PANEL_COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await hmac(exp);
  if (!expected || expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function checkPassword(input: string): boolean {
  const pw = panelPassword();
  if (!pw || !input || input.length !== pw.length) return false;
  let diff = 0;
  for (let i = 0; i < pw.length; i++) diff |= pw.charCodeAt(i) ^ input.charCodeAt(i);
  return diff === 0;
}

export const canWrite = () => !!writeToken();
export const panelRead = () => sanityClient.withConfig({ dataset: 'panel', token: readToken(), useCdn: false, perspective: 'drafts' });
export const siteRead = () => sanityClient.withConfig({ dataset: 'production', token: readToken(), useCdn: false, perspective: 'drafts' });
export const panelWrite = () => {
  const token = writeToken();
  if (!token) throw new Error('NO_WRITE_TOKEN');
  return sanityClient.withConfig({ dataset: 'panel', token, useCdn: false, perspective: 'raw' });
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });

export const PANEL_QUERY = `{
  "quotes": *[_type == "quote"] | order(coalesce(issuedAt, _createdAt) desc){..., "clientName": client->name},
  "projects": *[_type == "panelProject"] | order(_updatedAt desc){..., "clientName": client->name,
    "quotes": count(*[_type == "quote" && project._ref == ^._id]),
    "fileList": files[]{_key, "url": asset->url, "name": asset->originalFilename, "size": asset->size}},
  "clients": *[_type == "client"] | order(name asc){..., "projects": count(*[_type == "panelProject" && client._ref == ^._id]), "quotes": count(*[_type == "quote" && client._ref == ^._id])},
  "materials": *[_type == "caseMaterial"] | order(_updatedAt desc){..., "videoList": videos[]{_key, "url": asset->url, "name": asset->originalFilename}}
}`;
export const SITE_QUERY = `{
  "order": *[_id == "homePage"][0].projects[]._ref,
  "projects": *[_type == "project"] | order(_updatedAt desc){_id, title, cardTitle, year, "slug": slug.current, cover, _updatedAt}
}`;
