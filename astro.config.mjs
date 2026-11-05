// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const projectId = env.PUBLIC_SANITY_PROJECT_ID || 'jf65lv25';
const dataset = env.PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  site: 'https://bartocieczek.com',
  output: 'server',
  adapter: vercel({
    // Pages are cached at the edge and refreshed in the background,
    // so changes published in Sanity show up within a minute.
    isr: {
      expiration: 60,
      exclude: [/^\/studio/],
    },
  }),
  integrations: [
    sanity({
      projectId,
      dataset,
      apiVersion: '2026-11-01',
      useCdn: true,
      studioBasePath: '/studio',
    }),
    react(),
  ],
});
