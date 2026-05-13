// Sub-path-aware URL helper. Astro's `base` config (driven by `BASE_PATH`)
// auto-prefixes ROUTES and resolved asset imports, but hand-written string
// literals (`<img src="/img/foo.png">`, `fetch('/pixograms/x.pxl')`) stay
// untouched. Use `url('/img/foo.png')` to get the correct path on any deploy.
//
// `import.meta.env.BASE_URL` is replaced at build time by Vite, so this
// helper has zero runtime cost in the bundle.

// Astro's BASE_URL may or may not carry a trailing slash depending on the
// `base` value + trailingSlash config, so we normalise to a single trailing
// slash here. Doing it once at module load keeps each url() call cheap.
const BASE_RAW = import.meta.env.BASE_URL;
const BASE = BASE_RAW.endsWith('/') ? BASE_RAW : BASE_RAW + '/';

/**
 * Prefix an absolute-from-public-folder path with the configured Astro base.
 *
 *   url('/img/foo.png')      → '/img/foo.png'              (dev / root deploy)
 *   url('/img/foo.png')      → '/pxl-shop-headless/img/foo.png'   (project page)
 *   url('img/foo.png')       → same as above (leading slash is optional)
 */
export function url(path: string): string {
  return BASE + path.replace(/^\/+/, '');
}
