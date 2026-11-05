# bartocieczek.com

Portfolio built with [Astro](https://astro.build) and [Sanity](https://www.sanity.io), hosted on Vercel.
Migrated 1:1 from the original Framer site.

## Editing content

Open **/studio** on the live site (e.g. `https://bartocieczek.com/studio`) and sign in with your Sanity account.

- **Home page** – hero text, video, the list and order of case studies, brand logos, testimonial.
- **About page** – intro, focus areas, experience.
- **Case studies** – one document per project: card (image, name, year, tags) and page (intro, details, gallery).
- **Site settings** – contact links, footer, SEO.

Published changes appear on the site within about a minute (pages are cached for 60 s).

## Local development

```bash
npm install
npm run dev        # http://localhost:4321, Studio at /studio
```

Requires Node 22.12+. Project ID and dataset default to `jf65lv25` / `production`
(override with `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET`, see `.env.example`).

## Fonts

The original site uses licensed fonts (PP Neue Corp, PP Neue Montreal, Helvetica Now Display).
Until they're added, free look-alikes are used. See `src/styles/fonts.css`.

## Structure

- `src/pages` – `index`, `about-me`, `[slug]` (case studies, e.g. `/case-kfc`)
- `src/components` – hero, cards, gallery media, testimonial, footer, nav
- `src/sanity` – Studio schema and sidebar structure
- `sanity.config.ts` – embedded Studio config
