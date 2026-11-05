import { sanityClient } from 'sanity:client';
import { createImageUrlBuilder } from '@sanity/image-url';

const builder = createImageUrlBuilder(sanityClient);

// biome-ignore lint/suspicious/noExplicitAny: image source shape comes from GROQ
export const urlFor = (source: any) => builder.image(source).auto('format');

/** srcset for responsive images */
// biome-ignore lint/suspicious/noExplicitAny: image source shape comes from GROQ
export function srcset(source: any, widths = [480, 800, 1200, 1600, 2200]) {
  return widths.map((w) => `${urlFor(source).width(w).quality(82).url()} ${w}w`).join(', ');
}

const imageFields = `..., asset->{_id, url, mimeType, metadata{dimensions, lqip}}`;

export const SETTINGS_QUERY = `*[_id == "siteSettings"][0]`;

export const HOME_QUERY = `*[_id == "homePage"][0]{
  ...,
  "heroVideoUrl": heroVideo.asset->url,
  projects[]->{_id, title, cardTitle, year, cardTags, "slug": slug.current, cover{${imageFields}}},
  brands[]{_key, name, logo{${imageFields}}},
  testimonial{..., "videoUrl": video.asset->url, thumbnail{${imageFields}}}
}`;

export const ABOUT_QUERY = `*[_id == "aboutPage"][0]{
  ...,
  portrait{${imageFields}},
  experience[]{..., logo{${imageFields}}}
}`;

export const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  gallery[]{
    _key, kind, size,
    image{${imageFields}},
    poster{${imageFields}},
    "videoUrl": video.asset->url,
    "videoMime": video.asset->mimeType,
    "lottieUrl": lottie.asset->url
  }
}`;

export async function fetchSettings() {
  return sanityClient.fetch(SETTINGS_QUERY);
}
