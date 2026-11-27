import type { APIRoute } from 'astro';
import { PANEL_QUERY, SITE_QUERY, canWrite, isSignedIn, json, panelRead, siteRead } from '../../../lib/panel-server';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  if (!(await isSignedIn(cookies))) return json({ error: 'Zaloguj się ponownie.' }, 401);
  try {
    const [panel, site] = await Promise.all([panelRead().fetch(PANEL_QUERY), siteRead().fetch(SITE_QUERY)]);
    return json({ panel, site, canWrite: canWrite() });
  } catch (e) {
    return json({ error: `Nie udało się pobrać danych: ${(e as Error).message}` }, 502);
  }
};
