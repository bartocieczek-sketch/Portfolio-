import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

// Tell Presentation which page shows which document, both ways.
// Preview pages live under /preview/* (see src/middleware.ts).
export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/preview', filter: `_id == "homePage"` },
    { route: '/preview/about-me', filter: `_id == "aboutPage"` },
    { route: '/preview/:slug', filter: `_type == "project" && slug.current == $slug` },
  ]),
  locations: {
    homePage: defineLocations({
      message: 'Home page',
      locations: [{ title: 'Home', href: '/preview' }],
    }),
    aboutPage: defineLocations({
      message: 'About page',
      locations: [{ title: 'About me', href: '/preview/about-me' }],
    }),
    siteSettings: defineLocations({
      message: 'Used on every page (footer, contact links)',
      locations: [{ title: 'Home', href: '/preview' }],
    }),
    project: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || 'Case study', href: `/preview/${doc?.slug}` },
          { title: 'Home', href: '/preview' },
        ],
      }),
    }),
  },
};
