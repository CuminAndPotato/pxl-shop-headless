import type { Locale } from '../i18n/strings';
import { lifestyleGallery, workshopGallery, shapeSpacesBg, startedBg } from './assets';

export type OriginalDraftSlug = 'noir' | 'prism' | 'stack' | 'grid' | 'atelier';

export interface OriginalDraftConfig {
  slug: OriginalDraftSlug;
  headerVariant: 'dark' | 'light';
  heroImage: string;
  supportImage: string;
  detailImage: string;
  statementImage: string;
  gallery: string[];
  stageNote: Record<Locale, string>;
  galleryNote: Record<Locale, string>;
}

const productStage = '/img/products/whatis-clock-tight.png';

export const originalDrafts: Record<OriginalDraftSlug, OriginalDraftConfig> = {
  noir: {
    slug: 'noir',
    headerVariant: 'dark',
    heroImage: productStage,
    supportImage: lifestyleGallery[2],
    detailImage: workshopGallery[2],
    statementImage: shapeSpacesBg,
    gallery: [lifestyleGallery[0], workshopGallery[1], lifestyleGallery[5], workshopGallery[5]],
    stageNote: {
      en: 'Dark stage, bright pixels, sharp geometry.',
      de: 'Dunkle Bühne, helle Pixel, scharfe Geometrie.',
    },
    galleryNote: {
      en: 'A darker sales page that sells presence before it sells features.',
      de: 'Eine dunklere Sales-Page, die erst Präsenz verkauft und dann Features.',
    },
  },
  prism: {
    slug: 'prism',
    headerVariant: 'light',
    heroImage: productStage,
    supportImage: lifestyleGallery[8],
    detailImage: workshopGallery[6],
    statementImage: startedBg,
    gallery: [lifestyleGallery[4], workshopGallery[4], lifestyleGallery[9], workshopGallery[8]],
    stageNote: {
      en: 'Translucent planes and depth without drifting back to plain white.',
      de: 'Transluzente Flächen und Tiefe, ohne wieder in pures Weiß zu kippen.',
    },
    galleryNote: {
      en: 'This draft keeps the page bright, but more layered and object-like.',
      de: 'Dieser Entwurf bleibt hell, wirkt aber deutlich geschichteter und objektartiger.',
    },
  },
  stack: {
    slug: 'stack',
    headerVariant: 'dark',
    heroImage: productStage,
    supportImage: lifestyleGallery[10],
    detailImage: workshopGallery[9],
    statementImage: startedBg,
    gallery: [lifestyleGallery[11], workshopGallery[10], lifestyleGallery[12], workshopGallery[11]],
    stageNote: {
      en: 'Overlapping cards, sticky chapters, and depth through motion.',
      de: 'Überlagerte Karten, sticky Kapitel und Tiefe durch Bewegung.',
    },
    galleryNote: {
      en: 'This direction pushes the feeling that one section physically slides into the next.',
      de: 'Diese Richtung spielt bewusst damit, dass ein Bereich physisch in den nächsten hineingleitet.',
    },
  },
  grid: {
    slug: 'grid',
    headerVariant: 'dark',
    heroImage: productStage,
    supportImage: lifestyleGallery[6],
    detailImage: workshopGallery[3],
    statementImage: shapeSpacesBg,
    gallery: [lifestyleGallery[1], workshopGallery[7], lifestyleGallery[7], workshopGallery[12]],
    stageNote: {
      en: 'A visual system borrowed from the LED matrix itself.',
      de: 'Ein visuelles System, das direkt von der LED-Matrix selbst abgeleitet ist.',
    },
    galleryNote: {
      en: 'This draft is the most product-native: framing, rhythm, and spacing come from the grid.',
      de: 'Dieser Entwurf ist am stärksten aus dem Produkt selbst abgeleitet: Rahmung, Rhythmus und Spacing kommen aus dem Grid.',
    },
  },
  atelier: {
    slug: 'atelier',
    headerVariant: 'dark',
    heroImage: productStage,
    supportImage: lifestyleGallery[3],
    detailImage: workshopGallery[13],
    statementImage: startedBg,
    gallery: [lifestyleGallery[13], workshopGallery[0], lifestyleGallery[6], workshopGallery[6]],
    stageNote: {
      en: 'Warmer mineral tones, studio framing, and a more handcrafted mood.',
      de: 'Wärmere Mineral-Töne, Studio-Rahmung und eine handwerklichere Stimmung.',
    },
    galleryNote: {
      en: 'This version leans into material, workshop, and object value instead of a tech-first look.',
      de: 'Diese Version lehnt sich stärker an Material, Werkstatt und Objektwert an statt an einen Tech-First-Look.',
    },
  },
};

export function getOriginalDraft(slug: string): OriginalDraftConfig | undefined {
  return originalDrafts[slug as OriginalDraftSlug];
}