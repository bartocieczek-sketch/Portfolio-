// PostHog product analytics (EU cloud): pageviews, page leaves, clicks
// (autocapture) and a couple of named portfolio events. The project key is
// public by design (it only lets a browser send events). Nothing runs in the
// Sanity preview / Studio or while developing locally.
import posthog from 'posthog-js';

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) || 'https://eu.i.posthog.com';

export function startAnalytics() {
  if (!KEY || location.hostname === 'localhost' || location.pathname.startsWith('/preview') || location.pathname.startsWith('/studio')) return;
  posthog.init(KEY, {
    api_host: HOST,
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
  // named events for what matters on a portfolio
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element).closest?.('a');
      if (!a) return;
      if (a.classList.contains('case__live')) posthog.capture('live_site_clicked', { url: a.href, project: location.pathname });
      else if (/cooperate/i.test(a.textContent ?? '')) posthog.capture('cooperate_clicked', { url: a.href, from: location.pathname });
    },
    { capture: true },
  );
}
