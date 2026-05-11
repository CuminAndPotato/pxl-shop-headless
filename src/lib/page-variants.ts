import type { Locale } from '../i18n/strings';
import type { OriginalDraftSlug } from './original-drafts';

export type OriginalTweakSlug = 'spatial' | 'live' | 'proof';
export type ExperimentVariantSlug = 'poster' | 'console' | 'catalog' | 'interior' | 'buildbook';
export type FreshLayoutSlug = 'ribbon' | 'sidebar' | 'native' | 'editorial' | 'drop' | 'plus';
export type PageVariantSlug = 'default' | 'dev' | 'maker' | OriginalDraftSlug | OriginalTweakSlug | ExperimentVariantSlug | FreshLayoutSlug;

interface VariantLocaleCopy {
  name: string;
  shortName: string;
  thesis: string;
  introEyebrow: string;
  introTitle: string[];
  introLead: string;
  bullets: string[];
  note: string;
  quote: {
    line1: string;
    line2: string;
  };
}

export interface PageVariant {
  slug: PageVariantSlug;
  layout:
    | 'default' | 'dev' | 'maker' | 'original' | 'tweak' | 'experiment'
    | 'ribbon' | 'sidebar' | 'native' | 'editorial' | 'drop' | 'plus';
  theme: 'graphite' | 'amber' | 'mist';
  headerVariant?: 'dark' | 'light';
  copy: Record<Locale, VariantLocaleCopy>;
}

function originalTweakVariant(
  slug: OriginalTweakSlug,
  shortName: string,
  name: Record<Locale, string>,
  thesis: Record<Locale, string>,
  lead: Record<Locale, string>,
  bullets: Record<Locale, string[]>,
): PageVariant {
  return {
    slug,
    layout: 'tweak',
    theme: slug === 'live' ? 'graphite' : slug === 'proof' ? 'amber' : 'mist',
    headerVariant: 'dark',
    copy: {
      en: {
        name: name.en,
        shortName,
        thesis: thesis.en,
        introEyebrow: 'Original tweak',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: lead.en,
        bullets: bullets.en,
        note: thesis.en,
        quote: { line1: name.en, line2: thesis.en },
      },
      de: {
        name: name.de,
        shortName,
        thesis: thesis.de,
        introEyebrow: 'Original-Tweak',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: lead.de,
        bullets: bullets.de,
        note: thesis.de,
        quote: { line1: name.de, line2: thesis.de },
      },
    },
  };
}

function experimentVariant(
  slug: ExperimentVariantSlug,
  shortName: string,
  name: Record<Locale, string>,
  thesis: Record<Locale, string>,
  lead: Record<Locale, string>,
  bullets: Record<Locale, string[]>,
): PageVariant {
  return {
    slug,
    layout: 'experiment',
    theme: 'graphite',
    headerVariant: slug === 'catalog' || slug === 'interior' ? 'light' : 'dark',
    copy: {
      en: {
        name: name.en,
        shortName,
        thesis: thesis.en,
        introEyebrow: 'New experiment',
        introTitle: ['PXL Clock'],
        introLead: lead.en,
        bullets: bullets.en,
        note: thesis.en,
        quote: { line1: name.en, line2: thesis.en },
      },
      de: {
        name: name.de,
        shortName,
        thesis: thesis.de,
        introEyebrow: 'Neuer Entwurf',
        introTitle: ['PXL Clock'],
        introLead: lead.de,
        bullets: bullets.de,
        note: thesis.de,
        quote: { line1: name.de, line2: thesis.de },
      },
    },
  };
}

export const pageVariants: PageVariant[] = [
  {
    slug: 'default',
    layout: 'default',
    theme: 'graphite',
    copy: {
      en: {
        name: 'Default story',
        shortName: 'Default',
        thesis: 'Current narrative-first version with the strongest mood and the slowest reveal.',
        introEyebrow: 'Brand baseline',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'This is the current cinematic story arc: lifestyle first, product clarity second, technical depth later.',
        bullets: ['Strongest visual mood', 'Slow reveal of details', 'Best control version for comparisons'],
        note: 'Use this as the baseline when we test sharper positioning angles against the existing brand story.',
        quote: {
          line1: 'For people who want',
          line2: 'the full story first.',
        },
      },
      de: {
        name: 'Default-Story',
        shortName: 'Default',
        thesis: 'Aktuelle narrative Version mit der stärksten Stimmung und dem langsamsten Reveal.',
        introEyebrow: 'Marken-Basis',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Das ist die aktuelle cineastische Dramaturgie: erst Lifestyle, dann Produktklarheit, danach Technik.',
        bullets: ['Stärkste visuelle Stimmung', 'Langsamer Reveal der Details', 'Beste Kontrollversion für Vergleiche'],
        note: 'Diese Variante dient als Basis, wenn wir schärfere Positionierungen gegen die bestehende Markenstory testen.',
        quote: {
          line1: 'Für Menschen, die zuerst',
          line2: 'die ganze Geschichte sehen wollen.',
        },
      },
    },
  },
  {
    slug: 'dev',
    layout: 'dev',
    theme: 'amber',
    copy: {
      en: {
        name: 'Developer pitch',
        shortName: 'Dev',
        thesis: 'Lead with programmability, simulator flow, and specific product facts for technical buyers.',
        introEyebrow: 'For developers',
        introTitle: ['Programmable', 'desk hardware', 'with character.'],
        introLead: 'This version opens with a clear product thesis for technical people: real object, programmable pixels, fast setup, no vague lifestyle detour.',
        bullets: ['Technical framing first', 'Setup and product facts earlier', 'Less atmosphere, more intent'],
        note: 'This tests whether a dev audience responds better when we earn trust through specificity before we sell taste.',
        quote: {
          line1: 'Built for people who would rather',
          line2: 'ship code than buy generic decor.',
        },
      },
      de: {
        name: 'Developer-Pitch',
        shortName: 'Dev',
        thesis: 'Startet mit Programmierbarkeit, Simulator-Flow und konkreten Produktfakten für technische Käufer.',
        introEyebrow: 'Für Entwickler',
        introTitle: ['Programmierbare', 'Desk-Hardware', 'mit Charakter.'],
        introLead: 'Diese Version eröffnet mit einer klaren Produktaussage für technische Menschen: echtes Objekt, programmierbare Pixel, schneller Setup, kein vager Lifestyle-Umweg.',
        bullets: ['Technisches Framing zuerst', 'Setup und Produktfakten früher', 'Weniger Atmosphäre, mehr Absicht'],
        note: 'Das testet, ob eine Dev-Zielgruppe besser reagiert, wenn wir erst durch Konkretheit Vertrauen aufbauen und danach Geschmack verkaufen.',
        quote: {
          line1: 'Gebaut für Menschen, die lieber',
          line2: 'Code shippen als Deko kaufen.',
        },
      },
    },
  },
  {
    slug: 'maker',
    layout: 'maker',
    theme: 'mist',
    copy: {
      en: {
        name: 'Studio object',
        shortName: 'Studio',
        thesis: 'Lead with craftsmanship, materiality, and the clock as a physical object with presence.',
        introEyebrow: 'For spaces with intent',
        introTitle: ['A real object.', 'Not another', 'screen.'],
        introLead: 'This version pushes material, silhouette, and atmosphere first. The clock should feel collected, not merely purchased.',
        bullets: ['Craft and glass up front', 'Lifestyle and gallery earlier', 'Product panel arrives after desire'],
        note: 'This tests whether the stronger design-object framing creates more desire before we talk about checkout and specs.',
        quote: {
          line1: 'For desks that deserve',
          line2: 'an object with presence.',
        },
      },
      de: {
        name: 'Studio-Objekt',
        shortName: 'Studio',
        thesis: 'Startet mit Handwerk, Materialität und der Uhr als physischem Objekt mit Präsenz.',
        introEyebrow: 'Für Räume mit Haltung',
        introTitle: ['Ein echtes Objekt.', 'Nicht einfach', 'noch ein Screen.'],
        introLead: 'Diese Version stellt Material, Silhouette und Atmosphäre nach vorne. Die Uhr soll sich gesammelt anfühlen, nicht bloß gekauft.',
        bullets: ['Handwerk und Glas zuerst', 'Lifestyle und Galerie früher', 'Produktpanel kommt nach dem Verlangen'],
        note: 'Das testet, ob das stärkere Designobjekt-Framing mehr Begehren erzeugt, bevor wir über Checkout und Specs sprechen.',
        quote: {
          line1: 'Für Schreibtische, die',
          line2: 'ein Objekt mit Präsenz verdienen.',
        },
      },
    },
  },
  {
    slug: 'noir',
    layout: 'original',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Noir geometry',
        shortName: 'Noir',
        thesis: 'A darker, higher-contrast original version that sells presence and silhouette before detail.',
        introEyebrow: 'Original copy, darker stage',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'This keeps the original messaging, but pushes it onto a more cinematic, more physical stage with less empty white space.',
        bullets: ['Darker surfaces', 'Sharper geometry', 'Stronger product silhouette'],
        note: 'The goal is not more decoration. The goal is to make the clock feel more valuable and spatial before the customer reads deeper.',
        quote: {
          line1: 'A darker stage for the same',
          line2: 'core story.',
        },
      },
      de: {
        name: 'Noir-Geometrie',
        shortName: 'Noir',
        thesis: 'Eine dunklere, kontrastreichere Originalversion, die zuerst Präsenz und Silhouette verkauft und erst dann Details.',
        introEyebrow: 'Original-Copy, dunklere Bühne',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Die Botschaft bleibt weitgehend gleich, aber die Bühne wird cineastischer, physischer und deutlich weniger weiß.',
        bullets: ['Dunklere Flächen', 'Schärfere Geometrie', 'Stärkere Produktsilhouette'],
        note: 'Das Ziel ist nicht mehr Dekoration. Das Ziel ist, dass die Uhr wertiger und räumlicher wirkt, bevor der Kunde tiefer liest.',
        quote: {
          line1: 'Eine dunklere Bühne für dieselbe',
          line2: 'Kernstory.',
        },
      },
    },
  },
  {
    slug: 'prism',
    layout: 'original',
    theme: 'mist',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Prism layers',
        shortName: 'Prism',
        thesis: 'A brighter draft that still avoids flat white by building translucent depth and overlap.',
        introEyebrow: 'Original copy, layered light',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'This is the answer to keeping the page lighter without falling back into a plain white ecommerce slab.',
        bullets: ['Translucent panels', 'Layered overlap', 'More object-like depth'],
        note: 'This version is useful if you want premium lightness, but with more shape and tension than the current page.',
        quote: {
          line1: 'Lighter than noir,',
          line2: 'but still dimensional.',
        },
      },
      de: {
        name: 'Prismatische Flächen',
        shortName: 'Prism',
        thesis: 'Ein hellerer Entwurf, der dennoch flaches Weiß vermeidet und stattdessen transluzente Tiefe und Überlagerung baut.',
        introEyebrow: 'Original-Copy, geschichtetes Licht',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Das ist die Antwort auf eine hellere Seite, die trotzdem nicht wieder wie eine simple weiße Ecommerce-Fläche wirkt.',
        bullets: ['Transluzente Panels', 'Geschichtete Überlagerung', 'Mehr räumliche Tiefe'],
        note: 'Diese Version ist sinnvoll, wenn du Helligkeit behalten willst, aber mit deutlich mehr Form und Spannung als aktuell.',
        quote: {
          line1: 'Heller als Noir,',
          line2: 'aber trotzdem dimensional.',
        },
      },
    },
  },
  {
    slug: 'stack',
    layout: 'original',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Depth stack',
        shortName: 'Stack',
        thesis: 'A motion-led version where sections overlap and feel like physical layers sliding over each other.',
        introEyebrow: 'Original copy, more motion',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'This draft leans into scrolling as part of the art direction, with more physical layering and less static page slicing.',
        bullets: ['Sticky chapters', 'Section overlap', 'More motion without framework overhead'],
        note: 'Use this when you want the experience to feel more authored and spatial, not just cleaner.',
        quote: {
          line1: 'One section should feel like it',
          line2: 'slides into the next.',
        },
      },
      de: {
        name: 'Depth-Stack',
        shortName: 'Stack',
        thesis: 'Eine bewegungsbetonte Version, in der Sektionen sich überlagern und wie physische Ebenen ineinanderschieben.',
        introEyebrow: 'Original-Copy, mehr Bewegung',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Dieser Entwurf nutzt Scrollen stärker als Teil der Art Direction, mit mehr räumlicher Überlagerung und weniger statischer Seitenteilung.',
        bullets: ['Sticky Kapitel', 'Überlagerte Sektionen', 'Mehr Bewegung ohne Framework-Overhead'],
        note: 'Diese Richtung ist interessant, wenn das Erlebnis stärker kuratiert und räumlich wirken soll, nicht nur cleaner.',
        quote: {
          line1: 'Ein Bereich soll sich so anfühlen, als',
          line2: 'gleite er in den nächsten hinein.',
        },
      },
    },
  },
  {
    slug: 'grid',
    layout: 'original',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Grid frame',
        shortName: 'Grid',
        thesis: 'A more product-native visual language built from the matrix rhythm, frame, and modular geometry.',
        introEyebrow: 'Original copy, product-native visuals',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'Instead of generic luxury cues, this draft derives the page language directly from the grid, frame, and pixel rhythm of the clock.',
        bullets: ['Matrix-derived spacing', 'Modular framing', 'Cleaner technical confidence'],
        note: 'This could become the strongest signature look because it belongs to this product more than to web design trends.',
        quote: {
          line1: 'The site language should feel like it',
          line2: 'came from the product itself.',
        },
      },
      de: {
        name: 'Grid-Rahmen',
        shortName: 'Grid',
        thesis: 'Eine stärker produktnahe visuelle Sprache, die aus Matrix-Rhythmus, Rahmen und modularer Geometrie gebaut ist.',
        introEyebrow: 'Original-Copy, produktnahe Visuals',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Statt generischer Luxury-Cues leitet dieser Entwurf die Seitensprache direkt aus Grid, Rahmen und Pixelrhythmus der Uhr ab.',
        bullets: ['Vom Matrixraster abgeleitet', 'Modulare Rahmung', 'Sauberere technische Souveränität'],
        note: 'Das könnte langfristig der stärkste Signature-Look werden, weil er stärker zum Produkt gehört als zu Webdesign-Trends.',
        quote: {
          line1: 'Die Sprache der Seite sollte sich so anfühlen,',
          line2: 'als komme sie direkt aus dem Produkt.',
        },
      },
    },
  },
  {
    slug: 'atelier',
    layout: 'original',
    theme: 'amber',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Atelier warm',
        shortName: 'Atelier',
        thesis: 'A warmer and more material draft that emphasizes workshop, craft, and collected-object energy.',
        introEyebrow: 'Original copy, warmer materiality',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'This version softens the tech edge slightly and gives more room to craft, real glass, and the feeling of a limited object.',
        bullets: ['Warmer tones', 'More studio mood', 'Handmade value up front'],
        note: 'If the current page feels too digital, this is the direction that brings back material and maker energy.',
        quote: {
          line1: 'More studio,',
          line2: 'less showroom white.',
        },
      },
      de: {
        name: 'Atelier warm',
        shortName: 'Atelier',
        thesis: 'Ein wärmerer, materialbetonter Entwurf, der Werkstatt, Handwerk und Sammlerobjekt-Energie stärker hervorhebt.',
        introEyebrow: 'Original-Copy, wärmere Materialität',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Diese Version nimmt der Tech-Kante etwas Schärfe und gibt Handwerk, echtem Glas und dem Gefühl eines limitierten Objekts mehr Raum.',
        bullets: ['Wärmere Töne', 'Mehr Studio-Stimmung', 'Handmade-Wert sofort sichtbar'],
        note: 'Wenn sich die aktuelle Seite zu digital anfühlt, bringt diese Richtung Materialität und Maker-Energie zurück.',
        quote: {
          line1: 'Mehr Atelier,',
          line2: 'weniger Showroom-Weiß.',
        },
      },
    },
  },
  originalTweakVariant(
    'spatial',
    'Spatial',
    { en: 'Original Spatial Flow', de: 'Original Spatial Flow' },
    {
      en: 'Keeps the original hero, then replaces flat section cuts with geometry, overlap, and images that push into the next chapter.',
      de: 'Behält den Original-Hero und ersetzt danach flache Abschnittskanten durch Geometrie, Überlagerung und Bilder, die in das nächste Kapitel hineinragen.',
    },
    {
      en: 'This is the closest continuation of the existing page: same mood, same product story, but the transitions become more physical and the sections feel less like separate blocks.',
      de: 'Das ist die naheste Fortsetzung der bestehenden Seite: gleiche Stimmung, gleiche Produktstory, aber die Übergänge werden körperlicher und die Sektionen fühlen sich weniger wie getrennte Blöcke an.',
    },
    {
      en: ['Geometric section cuts', 'Images crossing boundaries', 'Less text-image symmetry'],
      de: ['Geometrische Abschnittskanten', 'Bilder ragen über Grenzen', 'Weniger Text-Bild-Symmetrie'],
    },
  ),
  originalTweakVariant(
    'live',
    'Live',
    { en: 'Original Live Demo', de: 'Original Live Demo' },
    {
      en: 'Turns the programmable clock demo into a central sales moment instead of hiding it late in the page.',
      de: 'Macht die programmierbare Clock-Demo zu einem zentralen Verkaufsargument, statt sie spät auf der Seite zu verstecken.',
    },
    {
      en: 'The original hero stays. The page then pivots into an interactive 24x24 playground, mode ideas, code hints, and practical examples of what a customer can actually do with the clock.',
      de: 'Der Original-Hero bleibt. Danach kippt die Seite in eine interaktive 24x24-Spielwiese mit Modi, Code-Hinweisen und konkreten Beispielen, was man mit der Uhr wirklich machen kann.',
    },
    {
      en: ['Live demo early', 'Pixogram and code focus', 'Concrete use cases'],
      de: ['Live-Demo früh', 'Pixogramm- und Code-Fokus', 'Konkrete Use-Cases'],
    },
  ),
  originalTweakVariant(
    'proof',
    'Proof',
    { en: 'Original Proof Path', de: 'Original Proof Path' },
    {
      en: 'Adds more thematic proof between the big emotional sections: craft, setup, shipping, beta, and community.',
      de: 'Ergänzt zwischen den großen emotionalen Abschnitten mehr thematischen Beweis: Handwerk, Setup, Versand, Beta und Community.',
    },
    {
      en: 'This draft keeps the emotional opening, but gives undecided buyers more reasons to trust the price and the team before the final buy moment.',
      de: 'Dieser Entwurf behält den emotionalen Einstieg, gibt unentschlossenen Käufern aber mehr Gründe, Preis und Team zu vertrauen, bevor der finale Kaufmoment kommt.',
    },
    {
      en: ['Trust-building chapters', 'Process and material proof', 'Clearer purchase confidence'],
      de: ['Trust-Kapitel', 'Prozess- und Materialbeweis', 'Mehr Kaufsicherheit'],
    },
  ),
  experimentVariant(
    'poster',
    'Poster',
    { en: 'Living Poster', de: 'Living Poster' },
    {
      en: 'A bold art-poster direction that treats the clock as a collectible visual object first.',
      de: 'Eine plakative Art-Poster-Richtung, die die Uhr zuerst als sammelbares visuelles Objekt behandelt.',
    },
    {
      en: 'Less shop, more poster wall: one strong visual claim, huge type, immediate facts, then a set of reasons to want it in the room.',
      de: 'Weniger Shop, mehr Plakatwand: eine starke visuelle Behauptung, riesige Typografie, direkte Fakten und dann Gründe, warum man sie im Raum haben will.',
    },
    {
      en: ['Art object first', 'Large editorial typography', 'Fast product facts'],
      de: ['Erst Kunstobjekt', 'Große Editorial-Typografie', 'Schnelle Produktfakten'],
    },
  ),
  experimentVariant(
    'console',
    'Console',
    { en: 'Pixel Console', de: 'Pixel Console' },
    {
      en: 'A playful control-room direction that makes programmability visible and tactile.',
      de: 'Eine spielerische Control-Room-Richtung, die Programmierbarkeit sichtbar und greifbar macht.',
    },
    {
      en: 'This version behaves like a mini simulator page: modes, pixograms, code hints, and a strong sense that the object is alive and hackable.',
      de: 'Diese Version fühlt sich wie eine Mini-Simulator-Seite an: Modi, Pixogramme, Code-Hinweise und das klare Gefühl, dass das Objekt lebendig und hackbar ist.',
    },
    {
      en: ['Interactive pixel canvas', 'Mode controls', 'Developer proof'],
      de: ['Interaktive Pixel-Leinwand', 'Mode Controls', 'Developer Proof'],
    },
  ),
  experimentVariant(
    'catalog',
    'Catalog',
    { en: 'Serious Product Page', de: 'Serious Product Page' },
    {
      en: 'A dense, confidence-building product-detail page for people who need facts before desire.',
      de: 'Eine dichte, vertrauensbildende Produktdetailseite für Menschen, die vor dem Begehren erst Fakten brauchen.',
    },
    {
      en: 'This one deliberately stops being dreamy. It answers what it is, what you get, why it costs what it costs, how it ships, and what you can do with it.',
      de: 'Diese Variante hört bewusst auf, dreamy zu sein. Sie beantwortet: Was ist es, was bekommt man, warum kostet es das, wie wird es verschickt und was kann man damit machen?',
    },
    {
      en: ['Information dense', 'Trust and specs', 'Clear purchase path'],
      de: ['Informationsdicht', 'Trust und Specs', 'Klarer Kaufpfad'],
    },
  ),
  experimentVariant(
    'interior',
    'Interior',
    { en: 'Interior Magazine', de: 'Interior Magazine' },
    {
      en: 'A quiet interior-design direction that sells the clock as furniture, light, and atmosphere.',
      de: 'Eine ruhige Interior-Design-Richtung, die die Uhr als Möbelstück, Licht und Atmosphäre verkauft.',
    },
    {
      en: 'This version talks to people who care less about specs at first and more about whether the object belongs on their wall, shelf, or desk.',
      de: 'Diese Version spricht Menschen an, denen Specs zuerst weniger wichtig sind als die Frage, ob das Objekt an Wand, Regal oder Schreibtisch gehört.',
    },
    {
      en: ['Room-first storytelling', 'Warm editorial layout', 'Material presence'],
      de: ['Raum zuerst', 'Warmes Editorial Layout', 'Materialpräsenz'],
    },
  ),
  experimentVariant(
    'buildbook',
    'Buildbook',
    { en: 'Buildbook', de: 'Buildbook' },
    {
      en: 'A documentary maker-story direction that uses process, constraints, and detail as the sales argument.',
      de: 'Eine dokumentarische Maker-Story, die Prozess, Einschränkungen und Details als Verkaufsargument nutzt.',
    },
    {
      en: 'This is the version for people who fall in love once they see how much work and care sits behind the simple square object.',
      de: 'Das ist die Version für Menschen, die sich verlieben, wenn sie sehen, wie viel Arbeit und Sorgfalt hinter dem einfachen quadratischen Objekt steckt.',
    },
    {
      en: ['Process-led', 'Human and handmade', 'More proof, less polish'],
      de: ['Prozessgeführt', 'Menschlich und handgemacht', 'Mehr Beweis, weniger Glanz'],
    },
  ),
  {
    slug: 'ribbon',
    layout: 'ribbon',
    theme: 'amber',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Story Ribbon',
        shortName: 'Ribbon',
        thesis: 'Magazine flow with geometric section transitions, a TL;DR strip, live pixogram preview, and an AI sandbox.',
        introEyebrow: 'Editorial flow',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'Keeps the existing hero, then guides through the product with soft geometric cuts and warm beige editorial pacing.',
        bullets: ['Hero stays', 'Geometric section cuts', 'Live pixogram + AI sandbox'],
        note: 'Closest to the existing site, but breaks the flat block-and-margin rhythm into a connected magazine flow.',
        quote: { line1: 'Magazine flow,', line2: 'connected, never sliced.' },
      },
      de: {
        name: 'Story Ribbon',
        shortName: 'Ribbon',
        thesis: 'Magazinfluss mit geometrischen Sektionsübergängen, TL;DR-Streifen, Live-Pixogramm-Vorschau und KI-Sandbox.',
        introEyebrow: 'Editorial-Fluss',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Behält den bestehenden Hero und führt mit weichen geometrischen Cuts und warmen Beige-Tönen durch das Produkt.',
        bullets: ['Hero bleibt', 'Geometrische Übergänge', 'Live-Pixogramm + KI-Sandbox'],
        note: 'Am nächsten an der bestehenden Seite, bricht aber das flache Block-mit-Rand-Schema in einen zusammenhängenden Magazinfluss auf.',
        quote: { line1: 'Magazinfluss,', line2: 'verbunden, nie zerschnitten.' },
      },
    },
  },
  {
    slug: 'sidebar',
    layout: 'sidebar',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Living Sidebar',
        shortName: 'Sidebar',
        thesis: 'Dark, warm split-screen with a sticky pixel display that walks through pixograms as the story scrolls.',
        introEyebrow: 'Split-screen story',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'A sticky pixel screen on the left, five chapters scrolling on the right. The clock answers the chapter you are reading.',
        bullets: ['Sticky live screen', 'Five short chapters', 'Warm dark tones, amber accent'],
        note: 'Dense, modern, cinematic. The product itself is the sidebar — not a sales add-on.',
        quote: { line1: 'The clock follows', line2: 'the story you are reading.' },
      },
      de: {
        name: 'Living Sidebar',
        shortName: 'Sidebar',
        thesis: 'Dunkler, warmer Split-Screen mit sticky Pixel-Display, das beim Scrollen durch Pixogramme läuft.',
        introEyebrow: 'Split-Screen-Story',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Links ein sticky Pixel-Display, rechts fünf Kapitel zum Scrollen. Die Uhr antwortet auf das Kapitel, das gerade liest.',
        bullets: ['Sticky Live-Display', 'Fünf kurze Kapitel', 'Warm dunkle Töne, Amber-Akzent'],
        note: 'Dicht, modern, cineastisch. Das Produkt ist die Sidebar — kein Sales-Beiwerk.',
        quote: { line1: 'Die Uhr folgt der Geschichte,', line2: 'die du gerade liest.' },
      },
    },
  },
  {
    slug: 'native',
    layout: 'native',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Pixel Native',
        shortName: 'Native',
        thesis: 'Design language derived from the LED matrix itself — adult, technical-elegant, never childish.',
        introEyebrow: 'Native to the matrix',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'A site that takes its grid, rhythm, and weight from the product. Mono labels, column-aligned spacing, framed object.',
        bullets: ['24-column grid throughout', 'Mono labels for tech specs', 'Warm-dark, not cyber-blue'],
        note: 'Built so the page feels like an extension of the clock, not a wrapper around it.',
        quote: { line1: 'The site language', line2: 'comes from the product.' },
      },
      de: {
        name: 'Pixel Native',
        shortName: 'Native',
        thesis: 'Design-Sprache aus der LED-Matrix selbst — erwachsen, technisch-elegant, nie verspielt.',
        introEyebrow: 'Aus der Matrix',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Eine Seite, deren Grid, Rhythmus und Gewicht aus dem Produkt kommen. Mono-Labels, spaltentreues Spacing, gefasstes Objekt.',
        bullets: ['Durchgehendes 24-Spalten-Grid', 'Mono-Labels für Specs', 'Warm-dunkel, nicht Cyber-Blau'],
        note: 'Gebaut, damit sich die Seite wie eine Erweiterung der Uhr anfühlt, nicht wie ein Wrapper drumherum.',
        quote: { line1: 'Die Sprache der Seite', line2: 'kommt aus dem Produkt.' },
      },
    },
  },
  {
    slug: 'editorial',
    layout: 'editorial',
    theme: 'mist',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Editorial Object',
        shortName: 'Editorial',
        thesis: 'Wallpaper*-style editorial spreads, asymmetric layout, sans-serif display type, three-layer parallax.',
        introEyebrow: 'Editorial spread',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'Treats the clock like a feature in a design magazine. Travertine palette, oversized headlines, three place studies, a colophon close.',
        bullets: ['Asymmetric editorial grid', 'Three-layer subtle parallax', 'Travertine + rust accent'],
        note: 'For people who buy objects after they read a feature about them, not after they read a spec sheet.',
        quote: { line1: 'A feature in a magazine,', line2: 'not a product page.' },
      },
      de: {
        name: 'Editorial Object',
        shortName: 'Editorial',
        thesis: 'Wallpaper*-Editorial mit asymmetrischem Layout, Sans-Serif-Display und dreifacher subtiler Parallax.',
        introEyebrow: 'Editorial-Spread',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Behandelt die Uhr wie ein Feature in einem Designmagazin. Travertin-Palette, überdimensionale Headlines, drei Raumstudien, Kolophon-Abschluss.',
        bullets: ['Asymmetrisches Editorial-Grid', 'Drei-Lagen subtile Parallax', 'Travertin mit Rost-Akzent'],
        note: 'Für Menschen, die Objekte nach einem Feature kaufen, nicht nach einem Datenblatt.',
        quote: { line1: 'Ein Magazin-Feature,', line2: 'keine Produktseite.' },
      },
    },
  },
  {
    slug: 'drop',
    layout: 'drop',
    theme: 'mist',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Quiet Drop',
        shortName: 'Drop',
        thesis: 'Limited-object drop page: monolithic, very reduced, black-on-cream, one strong product moment.',
        introEyebrow: 'Limited drop',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'One quiet, monolithic page. Hero, marquee strip, oversized title, picker + spec panel side by side, place strip, sandbox, workshop trail, final buy.',
        bullets: ['Black-on-cream monolith', 'No section noise', 'Single buy moment'],
        note: 'Closest to a small-batch furniture / fashion drop landing: confident, quiet, complete.',
        quote: { line1: 'A drop page,', line2: 'not a long sales letter.' },
      },
      de: {
        name: 'Quiet Drop',
        shortName: 'Drop',
        thesis: 'Limitierte Drop-Seite: monolithisch, stark reduziert, Schwarz auf Creme, ein starker Produktmoment.',
        introEyebrow: 'Limitierter Drop',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Eine ruhige, monolithische Seite. Hero, Marquee-Streifen, übergroßer Titel, Picker und Spec-Panel nebeneinander, Plätze-Streifen, Sandbox, Werkstatt-Trail, finaler Kauf.',
        bullets: ['Schwarz-auf-Creme Monolith', 'Kein Sektions-Lärm', 'Ein Kauf-Moment'],
        note: 'Am nächsten an einer Small-Batch-Möbel- oder Fashion-Drop-Seite: souverän, ruhig, vollständig.',
        quote: { line1: 'Eine Drop-Seite,', line2: 'kein langer Verkaufsbrief.' },
      },
    },
  },
  {
    slug: 'plus',
    layout: 'plus',
    theme: 'graphite',
    headerVariant: 'dark',
    copy: {
      en: {
        name: 'Original Plus',
        shortName: 'Plus',
        thesis: 'The default homepage with the live pixogram picker and the AI sandbox folded in at natural spots.',
        introEyebrow: 'Original layout, two new sections',
        introTitle: ['Time.', 'Design.', 'Expression.'],
        introLead: 'Identical to the production homepage in structure and tone, but adds the live pixogram preview after the "started" statement and the AI sandbox after the DIY chapter.',
        bullets: ['Original section order kept', 'Live picker after the "started" statement', 'AI sandbox after CreateItYourself'],
        note: 'Lets us test whether the two new interactive sections lift the existing default flow without rewriting it.',
        quote: { line1: 'Same story.', line2: 'Two more moments to play.' },
      },
      de: {
        name: 'Original Plus',
        shortName: 'Plus',
        thesis: 'Die Original-Startseite, ergänzt um den Live-Pixogramm-Picker und die KI-Sandbox an passenden Stellen.',
        introEyebrow: 'Original-Layout, zwei neue Sektionen',
        introTitle: ['Zeit.', 'Design.', 'Ausdruck.'],
        introLead: 'Aufbau und Tonalität wie die Produktions-Startseite. Neu: der Live-Picker direkt nach dem "Started"-Statement und die KI-Sandbox nach dem DIY-Kapitel.',
        bullets: ['Original-Sektionsreihenfolge bleibt', 'Live-Picker nach dem "Started"-Statement', 'KI-Sandbox nach CreateItYourself'],
        note: 'Testet, ob die beiden neuen interaktiven Sektionen den bestehenden Default-Flow heben, ohne ihn umzuschreiben.',
        quote: { line1: 'Gleiche Geschichte.', line2: 'Zwei Momente mehr zum Spielen.' },
      },
    },
  },
];

export function getPageVariant(slug: string): PageVariant | undefined {
  return pageVariants.find((variant) => variant.slug === slug);
}

export function getVariantHref(locale: Locale, slug: PageVariantSlug): string {
  return locale === 'de' ? `/de/v/${slug}` : `/v/${slug}`;
}

export function getCompareHref(locale: Locale, left: PageVariantSlug, right: PageVariantSlug): string {
  const base = locale === 'de' ? '/de/compare' : '/compare';
  return `${base}?left=${left}&right=${right}`;
}