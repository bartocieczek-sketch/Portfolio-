import type { APIRoute } from 'astro';
import { isSignedIn, json, panelWrite } from '../../../lib/panel-server';

export const prerender = false;

const TYPES = new Set(['quote', 'client', 'panelProject', 'caseMaterial']);
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$/;
const key = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

/** Every object in an array needs a unique _key for Sanity. */
function withKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? { _key: key(), ...(withKeys(x) as object) } : withKeys(x)));
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) if (val !== undefined && val !== null && val !== '') out[k] = withKeys(val);
    return out;
  }
  return v;
}

const STRIP = ['_rev', '_createdAt', '_updatedAt', 'clientName', 'quotes', 'projects', 'fileList', 'videoList'];
const fail = (e: unknown) =>
  (e as Error).message === 'NO_WRITE_TOKEN'
    ? json({ error: 'Zapis jest wyłączony: w Vercelu brakuje tokenu SANITY_API_WRITE_TOKEN.' }, 503)
    : json({ error: `Nie udało się zapisać: ${(e as Error).message}` }, 502);

// Save (create or replace) one document, published straight away.
export const POST: APIRoute = async ({ cookies, request }) => {
  if (!(await isSignedIn(cookies))) return json({ error: 'Zaloguj się ponownie.' }, 401);
  let doc: Record<string, unknown>;
  try {
    doc = await request.json();
  } catch {
    return json({ error: 'Nieprawidłowe dane.' }, 400);
  }
  const type = String(doc._type ?? '');
  if (!TYPES.has(type)) return json({ error: 'Nieznany typ dokumentu.' }, 400);
  const id = String(doc._id || `${type}-${key()}`).replace(/^drafts\./, '');
  if (!ID.test(id)) return json({ error: 'Nieprawidłowy identyfikator.' }, 400);
  for (const f of STRIP) delete doc[f];
  const clean = { ...(withKeys(doc) as Record<string, unknown>), _id: id, _type: type };
  try {
    const client = panelWrite();
    const res = await client.transaction().createOrReplace(clean as { _id: string; _type: string }).delete(`drafts.${id}`).commit({ visibility: 'sync' });
    return json({ ok: true, id, rev: res.transactionId });
  } catch (e) {
    return fail(e);
  }
};

export const DELETE: APIRoute = async ({ cookies, url }) => {
  if (!(await isSignedIn(cookies))) return json({ error: 'Zaloguj się ponownie.' }, 401);
  const id = String(url.searchParams.get('id') ?? '').replace(/^drafts\./, '');
  if (!ID.test(id)) return json({ error: 'Nieprawidłowy identyfikator.' }, 400);
  try {
    const client = panelWrite();
    const type = await client.fetch<string | null>('*[_id in [$id, "drafts." + $id]][0]._type', { id });
    if (!type || !TYPES.has(type)) return json({ error: 'Nie ma takiego dokumentu.' }, 404);
    await client.transaction().delete(id).delete(`drafts.${id}`).commit({ visibility: 'sync' });
    return json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (/reference/i.test(msg)) return json({ error: 'Nie można usunąć: inne dokumenty się do niego odwołują (np. wycena do klienta).' }, 409);
    return fail(e);
  }
};
