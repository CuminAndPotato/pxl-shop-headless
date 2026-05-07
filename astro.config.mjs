// @ts-check
import { defineConfig } from 'astro/config';

// Static-only build: pre-rendered HTML, all cart/checkout logic runs in the
// browser via @wix/sdk. Deployable to any static host (GitHub Pages, S3,
// Cloudflare Pages, …).
export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
