import type { APIRoute } from 'astro';
import { isSignedIn, json, panelWrite } from '../../../lib/panel-server';

export const prerender = false;

// Vercel functions accept bodies up to ~4.5 MB; the browser shrinks photos before sending.
const MAX = 4.4 * 1024 * 1024;

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!(await isSignedIn(cookies))) return json({ error: 'Zaloguj się ponownie.' }, 401);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Plik jest za duży albo uszkodzony (limit 4 MB na plik).' }, 413);
  }
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'Brak pliku.' }, 400);
  if (file.size > MAX) return json({ error: `„${file.name}” ma ${(file.size / 1048576).toFixed(1)} MB. Limit to 4 MB: wideo dodaj jako link.` }, 413);
  const kind = file.type.startsWith('image/') ? 'image' : 'file';
  try {
    const asset = await panelWrite().assets.upload(kind, Buffer.from(await file.arrayBuffer()), { filename: file.name, contentType: file.type || undefined });
    return json({ ok: true, kind, ref: asset._id, url: asset.url, name: asset.originalFilename, size: asset.size });
  } catch (e) {
    const msg = (e as Error).message;
    return msg === 'NO_WRITE_TOKEN'
      ? json({ error: 'Upload jest wyłączony: w Vercelu brakuje tokenu SANITY_API_WRITE_TOKEN.' }, 503)
      : json({ error: `Nie udało się wysłać pliku: ${msg}` }, 502);
  }
};
