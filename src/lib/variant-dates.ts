import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import type { PageVariantSlug } from './page-variants';

// Files that determine the "last updated" timestamp for each variant. When a
// variant lives in its own dedicated file, we use only that file. When several
// variants share a layout component (the legacy original/tweak/experiment
// layouts), we combine the layout component with the per-variant data file so
// edits to either count.
const VARIANT_FILES: Record<PageVariantSlug, string[]> = {
  // Fresh layouts (own file each)
  ribbon:    ['src/components/StoryRibbonPage.astro'],
  sidebar:   ['src/components/LivingSidebarPage.astro'],
  native:    ['src/components/PixelNativePage.astro'],
  editorial: ['src/components/EditorialObjectPage.astro'],
  drop:      ['src/components/QuietDropPage.astro'],

  // Legacy layouts that share components
  default:   ['src/pages/index.astro', 'src/components/VariantPage.astro'],
  dev:       ['src/components/VariantPage.astro', 'src/lib/page-variants.ts'],
  maker:     ['src/components/VariantPage.astro', 'src/lib/page-variants.ts'],

  noir:      ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],
  prism:     ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],
  stack:     ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],
  grid:      ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],
  atelier:   ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],

  spatial:   ['src/components/OriginalTweakPage.astro', 'src/lib/page-variants.ts'],
  live:      ['src/components/OriginalTweakPage.astro', 'src/lib/page-variants.ts'],
  proof:     ['src/components/OriginalTweakPage.astro', 'src/lib/page-variants.ts'],

  poster:    ['src/components/ExperimentPage.astro'],
  console:   ['src/components/ExperimentPage.astro'],
  catalog:   ['src/components/ExperimentPage.astro'],
  interior:  ['src/components/ExperimentPage.astro'],
  buildbook: ['src/components/ExperimentPage.astro'],
};

function gitMtime(file: string): Date | null {
  try {
    const out = execSync(`git log -1 --format=%at -- ${file}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return null;
    const seconds = parseInt(out, 10);
    if (!seconds) return null;
    return new Date(seconds * 1000);
  } catch {
    return null;
  }
}

function fsMtime(file: string): Date | null {
  try {
    return statSync(path.resolve(process.cwd(), file)).mtime;
  } catch {
    return null;
  }
}

const cache = new Map<PageVariantSlug, Date | null>();

export function getVariantUpdate(slug: PageVariantSlug): Date | null {
  if (cache.has(slug)) return cache.get(slug) ?? null;

  const files = VARIANT_FILES[slug];
  if (!files) {
    cache.set(slug, null);
    return null;
  }

  // For each file, take the more recent of git mtime and fs mtime (so
  // uncommitted edits show up). Then take the latest across all files.
  let latest: Date | null = null;
  for (const f of files) {
    const g = gitMtime(f);
    const s = fsMtime(f);
    let candidate: Date | null = null;
    if (g && s) candidate = g > s ? g : s;
    else candidate = g ?? s;
    if (candidate && (!latest || candidate > latest)) latest = candidate;
  }
  cache.set(slug, latest);
  return latest;
}

export function formatVariantDate(date: Date | null, locale: 'de' | 'en'): string {
  if (!date) return '';
  if (locale === 'de') {
    const d = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
    const t = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return `${d}. ${t}`;
  }
  const d = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(date);
  const t = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${d}, ${t}`;
}

export function formatVariantDateLong(date: Date | null, locale: 'de' | 'en'): string {
  if (!date) return '';
  if (locale === 'de') {
    const d = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    const t = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return `${d}, ${t} Uhr`;
  }
  const d = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  const t = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${d}, ${t}`;
}
