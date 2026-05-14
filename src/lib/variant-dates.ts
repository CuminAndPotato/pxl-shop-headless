import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import type { PageVariantSlug } from './page-variants';
import { pageVariants } from './page-variants';

// Layout slug → component file. Mirrors LAYOUT_COMPONENTS in
// src/components/VariantPage.astro. The variant's `layout` field picks the
// component file whose mtime is the variant's "updated at" timestamp.
//
// Some variants share a component (original/tweak/experiment + their data
// files), so a layout maps to one OR MORE files; we take the newest mtime.
const LAYOUT_FILES: Record<string, string[]> = {
  default:    ['src/components/DefaultLayout.astro'],
  dev:        ['src/components/DevLayout.astro', 'src/lib/page-variants.ts'],
  maker:      ['src/components/MakerLayout.astro', 'src/lib/page-variants.ts'],
  original:   ['src/components/OriginalDraftPage.astro', 'src/lib/original-drafts.ts'],
  tweak:      ['src/components/OriginalTweakPage.astro', 'src/lib/page-variants.ts'],
  experiment: ['src/components/ExperimentPage.astro'],
  ribbon:     ['src/components/StoryRibbonPage.astro'],
  sidebar:    ['src/components/LivingSidebarPage.astro'],
  native:     ['src/components/PixelNativePage.astro'],
  editorial:  ['src/components/EditorialObjectPage.astro'],
  drop:       ['src/components/QuietDropPage.astro'],
  plus:       ['src/components/OriginalPlusPage.astro'],
  plus2:      ['src/components/OriginalPlus2Page.astro'],
  plus3:      ['src/components/OriginalPlus3Page.astro'],
  plus4:      ['src/components/OriginalPlus4Page.astro'],
  plus5:      ['src/components/OriginalPlus5Page.astro'],
};

function filesFor(slug: PageVariantSlug): string[] {
  const v = pageVariants.find((x) => x.slug === slug);
  if (!v) return [];
  return LAYOUT_FILES[v.layout] ?? [];
}

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

  const files = filesFor(slug);
  if (files.length === 0) {
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
