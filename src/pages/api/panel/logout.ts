import type { APIRoute } from 'astro';
import { PANEL_COOKIE } from '../../../lib/panel-server';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(PANEL_COOKIE, { path: '/' });
  return redirect('/panel/login', 303);
};
