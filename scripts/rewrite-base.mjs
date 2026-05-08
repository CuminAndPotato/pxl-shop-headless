#!/usr/bin/env node
// Post-build path rewriter for sub-path deploys (GitHub Pages project page).
//
// Astro builds with a default base ("/") so dev server and root-deploy hosts
// keep working unchanged. When we deploy to a sub-path like
// /pxl-shop-headless/, this script rewrites every absolute path in the dist
// output so links and assets resolve under that sub-path.
//
// Set the BASE env var to override the default. Skip this step entirely by
// running with BASE="" (empty string).

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.BASE ?? '/pxl-shop-headless';
const DIST = process.env.DIST ?? './dist';

if (!BASE) {
  console.log('[rewrite-base] BASE is empty — skipping rewrite.');
  process.exit(0);
}

const TEXT_EXTS = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.svg', '.json', '.txt']);

/**
 * Walk a directory recursively and yield file paths matching TEXT_EXTS.
 * @param {string} dir
 * @returns {AsyncGenerator<string>}
 */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      const ext = dot >= 0 ? entry.name.slice(dot).toLowerCase() : '';
      if (TEXT_EXTS.has(ext)) yield full;
    }
  }
}

// Rewrite rules — each rule is [regex, replacement].
// Order matters; the first that matches wins per occurrence.
const rules = [
  // HTML attributes: href="/foo", src="/foo", action="/foo", srcset="/foo …",
  // including single quotes. Skip "//" (protocol-relative) and "/" + BASE
  // (already prefixed) by anchoring on a non-/ char following the slash.
  [/(\b(?:href|src|action|content|formaction|poster)=["'])\/(?!\/|pxl-shop-headless)/gi, `$1${BASE}/`],
  // srcset — match each `/foo` in the comma-separated list.
  [/(\bsrcset=["'])([^"']*)(["'])/gi, (_m, pre, list, post) =>
    pre + list.replace(/(^|,\s*)\/(?!\/)/g, `$1${BASE}/`) + post,
  ],
  // Inline data-* path attributes the codebase emits (data-cart-href etc.)
  [/(\bdata-[a-z-]*-?(?:href|src|url|to|home)=["'])\/(?!\/|pxl-shop-headless)/gi, `$1${BASE}/`],
  // CSS url(/foo)
  [/url\(\s*["']?\/(?!\/|pxl-shop-headless)/gi, `url(${BASE}/`],
  // JS string literals like "/img/…" or '/cart' inside hydration scripts.
  // Anchored on the leading quote to reduce false positives, and we stay away
  // from "//" protocol-relative URLs.
  [/(["'])\/((?:img|logos|video|favicon|cart|thank-you|de\/|v\/|compare)\b[^"']*)\1/g,
    (_m, q, rest) => `${q}${BASE}/${rest}${q}`],
];

let touched = 0;
let changed = 0;
for await (const file of walk(DIST)) {
  touched += 1;
  let content = await readFile(file, 'utf-8');
  const before = content;
  for (const [pattern, replacement] of rules) {
    content = content.replace(pattern, /** @type any */ (replacement));
  }
  if (content !== before) {
    await writeFile(file, content);
    changed += 1;
  }
}

console.log(`[rewrite-base] BASE=${BASE} · scanned ${touched} files · rewrote ${changed} files`);
