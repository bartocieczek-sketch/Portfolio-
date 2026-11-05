import { sanityClient } from 'sanity:client';
import type { QueryParams } from '@sanity/client';
import { readToken } from './preview';

// Only these fields get invisible edit markers (stega) in preview, so URLs,
// class names and attributes are never polluted.
const EDITABLE_KEYS = new Set([
  'heroText', 'title', 'cardTitle', 'text', 'quote', 'introLead', 'introBody', 'currentRole',
  'experienceLead', 'experienceBody', 'footerHeadline', 'ctaText', 'workHeadline',
  'testimonialsHeading', 'brandsLabel', 'company', 'role', 'period', 'client', 'services',
  'credits', 'yearLabel', 'year', 'cardTags', 'focus', 'viewAllLabel', 'badgeLabel',
  'established', 'location', 'copyright',
]);

/**
 * Fetch from Sanity. On normal pages: published content from the CDN.
 * In preview (Studio → Presentation): drafts, with click-to-edit markers.
 */
export async function load<T = any>(locals: App.Locals, query: string, params: QueryParams = {}): Promise<T> {
  if (!locals.preview) return sanityClient.fetch<T>(query, params);

  return sanityClient.fetch<T>(query, params, {
    perspective: 'drafts',
    token: readToken(),
    useCdn: false,
    cache: 'no-store',
    stega: {
      enabled: true,
      studioUrl: '/studio',
      filter: ({ sourcePath }) => {
        const key = [...sourcePath].reverse().find((seg) => typeof seg === 'string');
        return typeof key === 'string' && EDITABLE_KEYS.has(key);
      },
    },
  });
}
