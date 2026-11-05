import { defineMiddleware } from 'astro:middleware';
import { PREVIEW_COOKIE, PREVIEW_PREFIX, isValidPreviewCookie } from './lib/preview';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname, search } = ctx.url;
  ctx.locals.preview = false;

  if (pathname === PREVIEW_PREFIX || pathname.startsWith(`${PREVIEW_PREFIX}/`)) {
    const target = pathname.slice(PREVIEW_PREFIX.length) || '/';
    // No valid preview session → send the visitor to the normal page
    if (!(await isValidPreviewCookie(ctx.cookies.get(PREVIEW_COOKIE)?.value))) {
      return ctx.redirect(target + search, 307);
    }
    ctx.locals.preview = true;
    const res = await next(target + search);
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('X-Robots-Tag', 'noindex');
    return res;
  }

  return next();
});
