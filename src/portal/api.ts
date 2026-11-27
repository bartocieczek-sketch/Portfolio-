import { createImageUrlBuilder } from '@sanity/image-url';
import type { QuoteData } from '../lib/quote-render';

export type Ref = { _type: 'reference'; _ref: string };
export type Img = { _type: 'image'; _key?: string; asset: { _type: 'reference'; _ref: string }; caption?: string };
export type FileRef = { _type: 'file'; _key?: string; asset: { _type: 'reference'; _ref: string } };

export type Quote = QuoteData & { _id: string; _type: 'quote'; status?: string; client?: Ref; project?: Ref; shareToken?: string; notes?: string; clientName?: string; _updatedAt?: string };
export type Client = { _id: string; _type: 'client'; name: string; contact?: string; email?: string; phone?: string; website?: string; logo?: Img; notes?: string; projects?: number; quotes?: number };
export type Project = {
  _id: string; _type: 'panelProject'; name: string; client?: Ref; status?: string; start?: string; end?: string; budget?: number; caseSlug?: string; notes?: string;
  files?: FileRef[]; fileList?: { _key: string; url: string; name: string; size: number }[]; clientName?: string; quotes?: number; _updatedAt?: string;
};
export type Material = {
  _id: string; _type: 'caseMaterial'; title: string; status?: string; client?: string; year?: string; services?: string; liveUrl?: string; story?: string; results?: string[];
  cover?: Img; images?: Img[]; videos?: FileRef[]; videoList?: { _key: string; url: string; name: string }[]; videoLinks?: string[]; forClaude?: string; siteSlug?: string; _updatedAt?: string;
};
export type SiteProject = { _id: string; title: string; cardTitle?: string; year?: string; slug?: string; cover?: Img; _updatedAt: string };
export type Data = {
  panel: { quotes: Quote[]; projects: Project[]; clients: Client[]; materials: Material[] };
  site: { order: string[] | null; projects: SiteProject[] };
  canWrite: boolean;
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  if (res.status === 401) {
    location.href = `/panel/login?next=${encodeURIComponent(location.pathname)}`;
    throw new Error('Zaloguj się ponownie.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Błąd ${res.status}`);
  return body as T;
}

export const loadData = () => call<Data>('/api/panel/data');
export const saveDoc = (doc: object) =>
  call<{ ok: true; id: string }>('/api/panel/doc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) });
export const deleteDoc = (id: string) => call<{ ok: true }>(`/api/panel/doc?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

/** Shrinks big photos in the browser so they fit the 4 MB upload limit. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (file.size < 3.5 * 1048576) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  for (const [max, q] of [[3200, 0.86], [2600, 0.82], [2000, 0.8]] as const) {
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', q));
    if (blob && blob.size < 4 * 1048576) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  }
  return file;
}

export async function upload(file: File): Promise<{ kind: 'image' | 'file'; ref: string; url: string; name: string; size: number }> {
  const f = await shrink(file);
  const fd = new FormData();
  fd.append('file', f);
  return call('/api/panel/upload', { method: 'POST', body: fd });
}

const panelImg = createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'panel' });
const siteImg = createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'production' });
// biome-ignore lint/suspicious/noExplicitAny: image source
export const imgUrl = (src: any, w: number, h?: number, dataset: 'panel' | 'production' = 'panel') => {
  if (!src?.asset?._ref) return '';
  const b = (dataset === 'panel' ? panelImg : siteImg).image(src).width(w).auto('format');
  return (h ? b.height(h).fit('crop') : b).url();
};

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
export const newKey = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
export const newToken = () => {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
};
export const today = () => new Date().toISOString().slice(0, 10);
export const ref = (id?: string): Ref | undefined => (id ? { _type: 'reference', _ref: id } : undefined);
export const imageOf = (assetRef: string, extra?: Partial<Img>): Img => ({ _type: 'image', _key: newKey(), asset: { _type: 'reference', _ref: assetRef }, ...extra });
export const fileOf = (assetRef: string): FileRef => ({ _type: 'file', _key: newKey(), asset: { _type: 'reference', _ref: assetRef } });
