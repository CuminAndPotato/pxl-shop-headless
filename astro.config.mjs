// @ts-check
import { defineConfig } from 'astro/config';

// Static-only build: pre-rendered HTML, all cart/checkout logic runs in the
// browser via @wix/sdk. Deployable to any static host (GitHub Pages, S3,
// Cloudflare Pages, …).
//
// Note on deploy paths: when this site is deployed to a project-page sub-path
// (GitHub Pages: /pxl-shop-headless/), a post-build step (`scripts/rewrite-base.mjs`)
// rewrites absolute paths in the dist output. Astro itself stays on the
// default base ("/") so dev server and any non-sub-path host still work
// without surprises.
export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
