// @ts-check
import { defineConfig } from 'astro/config';

// Static-only build: pre-rendered HTML, all cart/checkout logic runs in the
// browser via @wix/sdk. Deployable to any static host (GitHub Pages, S3,
// Cloudflare Pages, …).
//
// Sub-path deploys (GitHub Pages project pages): set `BASE_PATH` env var
// when building, e.g. `BASE_PATH=/pxl-shop-headless npm run build`. Astro
// then prefixes all generated routes and asset URLs at build time. Use
// `import.meta.env.BASE_URL` (or `url()` from src/lib/url.ts) when you
// hand-write absolute paths in templates or client-side code.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
