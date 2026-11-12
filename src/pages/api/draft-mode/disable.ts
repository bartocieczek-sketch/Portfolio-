import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '../../../lib/preview';
import { flushPostHogPreviewLogs, getPostHogPreviewLogger } from '../../../lib/posthog-server-logs';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/' });
  getPostHogPreviewLogger()?.emit({
    severityText: 'INFO',
    body: 'Sanity preview disabled',
    attributes: { route: 'draft_mode_disable' },
  });
  await flushPostHogPreviewLogs();
  return redirect('/', 307);
};
