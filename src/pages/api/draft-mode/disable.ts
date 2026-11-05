import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '../../../lib/preview';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/' });
  return redirect('/', 307);
};
