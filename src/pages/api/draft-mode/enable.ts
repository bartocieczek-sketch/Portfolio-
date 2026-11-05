import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { PREVIEW_COOKIE, PREVIEW_PREFIX, previewCookieValue, readToken } from '../../../lib/preview';

export const prerender = false;

// Called by Sanity Presentation. Sanity proves the request comes from a
// logged-in Studio session; we then set the preview cookie.
export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const token = readToken();
  if (!token) {
    return new Response('Visual editing is not set up yet: add SANITY_API_READ_TOKEN in Vercel.', { status: 500 });
  }
  const client = sanityClient.withConfig({ token, useCdn: false });
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(client, request.url);
  if (!isValid) return new Response('Invalid preview secret', { status: 401 });

  cookies.set(PREVIEW_COOKIE, (await previewCookieValue())!, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  });
  const target = redirectTo.startsWith(PREVIEW_PREFIX)
    ? redirectTo
    : redirectTo === '/'
      ? PREVIEW_PREFIX
      : `${PREVIEW_PREFIX}${redirectTo}`;
  return redirect(target, 307);
};
