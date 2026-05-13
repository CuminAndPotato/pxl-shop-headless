// Shared content fixtures used by the Plus²/Plus³ family of pages. These
// fixtures duplicated across both files when Plus³ was branched from Plus²;
// pulling them here keeps copy edits in one place and removes ~250 LOC of
// drift-prone duplication.

import type { Locale } from '../i18n/strings';
import { workshopGallery } from './assets';
import type { StickyChapter } from '../components/StickyPixelStory.astro';

// Real code snippet from the PXL Clock NuGet README — used by the sticky
// story's "code" chapter.
export const STICKY_CODE = `Color GetColor(int minute, int second, int x, int y, int step)
{
    var hue = (x + y + step) * 5.0 / 360.0;
    return Color.FromHsv(hue, 1, 1);
}`;

export function stickyChapters(locale: Locale): StickyChapter[] {
  return locale === 'de'
    ? [
        {
          shape: 'lede',
          title: 'Eine Uhr, die zeigt, was du ihr sagst.',
          body: 'PXL Clock ist eine 24 × 24 Pixel-Matrix hinter echtem Glas. Tags zeigt sie die Zeit, abends eine Animation, wenn du willst auch deinen Build-Status oder das Wetter. 576 LEDs sind nicht viel — und genau das ist die Idee.',
          inlineSpecs: '576 LEDs · 24 × 24 RGB · WLAN · OTA · iOS und Android · 27 × 27 × 6 cm · 2 kg',
        },
        {
          shape: 'quote',
          quote: 'Sie hängt da und atmet. Das ist eigentlich alles, was ein Objekt im Raum tun muss.',
          byline: 'Aus einem ersten Test mit einer Beta-Uhr.',
        },
        {
          shape: 'code',
          title: 'In C# programmierbar.',
          body: 'Ein Pixogramm ist eine C#-Funktion: für jeden Pixel an Position (x, y) und für jeden Animationsschritt step gibst du eine Farbe zurück. Mehr braucht es nicht — die NuGet-Library Pxl erledigt den Rest.',
          code: STICKY_CODE,
        },
        {
          shape: 'still',
          img: workshopGallery[2],
          caption: 'Aus einer Werkstatt in Köln. Software, Rahmen, Glas und Versand alles aus Deutschland — Cumin & Potato GmbH, Kleinserie, hundert Stück.',
        },
        {
          shape: 'lede',
          title: 'Eine Community, die mitprogrammiert.',
          body: 'PXL JAM 2024 war Teil des F# Advent Calendar — die Community hat geforkt, Pixogramme gebaut, Pull Requests submitted. Drei Gewinner haben jeweils eine PXL Clock Mk1 bekommen. Die Werkzeuge bleiben: Browser-Simulator, VS Code Extension, alle Beispiele auf GitHub.',
          inlineSpecs: 'github.com/SchlenkR/pxl-clock · discord.gg/KDbVdKQh5j · marketplace.visualstudio.com',
        },
      ]
    : [
        {
          shape: 'lede',
          title: 'A clock that shows what you tell it.',
          body: 'PXL Clock is a 24 × 24 pixel matrix behind real glass. By day it shows time, in the evening an animation, and a build status or the weather if that is what you want. 576 LEDs is not much — that is the point.',
          inlineSpecs: '576 LEDs · 24 × 24 RGB · WiFi · OTA · iOS and Android · 27 × 27 × 6 cm · 2 kg',
        },
        {
          shape: 'quote',
          quote: 'It hangs there and breathes. That is really all an object in a room has to do.',
          byline: 'From an early test with a beta unit.',
        },
        {
          shape: 'code',
          title: 'Programmable in C#.',
          body: 'A pixogram is a C# function: for every pixel at (x, y) and every animation step, return a colour. That is the whole API — the Pxl NuGet library takes it from there.',
          code: STICKY_CODE,
        },
        {
          shape: 'still',
          img: workshopGallery[2],
          caption: 'From a workshop in Cologne. Software, frame, glass, and shipping — all from Germany. Cumin & Potato GmbH, small run, one hundred pieces.',
        },
        {
          shape: 'lede',
          title: 'A community that codes along.',
          body: 'PXL JAM 2024 was part of the F# Advent Calendar — the community forked, built pixograms, submitted pull requests. Three winners each got a PXL Clock Mk1. The tooling stays: browser simulator, VS Code extension, every example open on GitHub.',
          inlineSpecs: 'github.com/SchlenkR/pxl-clock · discord.gg/KDbVdKQh5j · marketplace.visualstudio.com',
        },
      ];
}

export interface MakerStep { tag: string; title: string; body: string }

export function makerSteps(locale: Locale): MakerStep[] {
  return locale === 'de'
    ? [
        { tag: 'Schritt 01', title: 'Schreibe Code.', body: 'Ein Pixogramm ist eine C#-Datei. Die Pxl-NuGet-Library liefert das Pixel-API — du brauchst keine Build-Pipeline und kein Framework drumherum.' },
        { tag: 'Schritt 02', title: 'Sieh es im Simulator.', body: 'Der eingebaute Simulator startet automatisch — Live-Preview in VS Code, Hot Reload bei jedem Speichern, keine Hardware nötig.' },
        { tag: 'Schritt 03', title: 'Push auf die Uhr.', body: 'Über das lokale Netzwerk findet die Extension deine PXL Clock und überträgt das Pixogramm direkt — ein Klick reicht.' },
      ]
    : [
        { tag: 'Step 01', title: 'Write code.', body: 'A pixogram is a C# file. The Pxl NuGet library brings the pixel API — no build pipeline, no framework around it.' },
        { tag: 'Step 02', title: 'See it in the simulator.', body: 'The built-in simulator starts automatically — live preview in VS Code, hot reload on every save, no hardware needed.' },
        { tag: 'Step 03', title: 'Push to the clock.', body: 'The extension finds your PXL Clock on the local network and pushes the pixogram with one click.' },
      ];
}

export interface VSCodeCopy {
  kicker: string;
  title: string;
  lede: string;
  bullets: string[];
  cta: string;
  meta: string;
}

export function vscodeCopy(locale: Locale): VSCodeCopy {
  return locale === 'de'
    ? {
        kicker: 'Werkzeug',
        title: 'Develop, preview, publish — alles im VS Code.',
        lede: 'Die offizielle PXL Clock Extension für VS Code bringt den ganzen Workflow in den Editor. Erschienen als v1 im Februar 2026, kostenlos im Marketplace.',
        bullets: [
          'Eingebauter Simulator — startet automatisch, keine Konfiguration nötig.',
          'Live-Preview in der Sidebar oder als eigenes Panel, Hot Reload bei jedem Speichern.',
          'Datei-Explorer für alle Pixogramme als Sidebar-Tree.',
          'Run, Stop, Restart per Click direkt in der Editor-Toolbar.',
          'Publish-to-Device über das lokale Netzwerk — ein Klick auf das Wolken-Symbol.',
          'C#-IntelliSense, Diagnostics und Signature-Help via Roslyn.',
        ],
        cta: 'Im Marketplace öffnen',
        meta: 'pxlclock.pxl-clock · v1 · Februar 2026',
      }
    : {
        kicker: 'Tooling',
        title: 'Develop, preview, publish — all inside VS Code.',
        lede: 'The official PXL Clock extension for VS Code brings the whole workflow into the editor. Shipped as v1 in February 2026, free on the Marketplace.',
        bullets: [
          'Built-in simulator — starts automatically, zero config.',
          'Live preview in the sidebar or a full panel, hot reload on every save.',
          'File explorer for all pixograms as a sidebar tree.',
          'Run, Stop, Restart from the editor toolbar with one click.',
          'Publish to device over the local network — one click on the cloud icon.',
          'C# IntelliSense, diagnostics, and signature help via Roslyn.',
        ],
        cta: 'Open in Marketplace',
        meta: 'pxlclock.pxl-clock · v1 · February 2026',
      };
}

export interface JamCopy {
  kicker: string;
  title: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
}

export function jamCopy(locale: Locale): JamCopy {
  return locale === 'de'
    ? {
        kicker: 'Community',
        title: 'PXL JAM 2024 — die Community programmierte mit.',
        paragraphs: [
          'Dezember 2024. Teil des F# Advent Calendars, hosted von Sergey Tihon. Repository forken, eigene Pixogramme bauen, per Pull Request einreichen — drei Gewinner bekamen jeweils eine PXL Clock Mk1.',
          'Der Hackathon war für Anfänger und erfahrene Devs offen. Die Werkzeuge — Browser-Simulator, NuGet-Library, GitHub-Workflow — sind bis heute Open Source.',
        ],
        links: [
          { label: 'Repository ansehen', href: 'https://github.com/SchlenkR/PXL-JAM' },
          { label: 'YouTube-Ankündigung', href: 'https://youtu.be/q5-QTpEMGdU' },
        ],
      }
    : {
        kicker: 'Community',
        title: 'PXL JAM 2024 — the community coded along.',
        paragraphs: [
          'December 2024. Part of the F# Advent Calendar hosted by Sergey Tihon. Fork the repo, build your own pixograms, submit a pull request — three winners each got a PXL Clock Mk1.',
          'The jam was open to beginners and experienced devs alike. The tooling — browser simulator, NuGet library, GitHub workflow — is still open source today.',
        ],
        links: [
          { label: 'See the repository', href: 'https://github.com/SchlenkR/PXL-JAM' },
          { label: 'YouTube announcement', href: 'https://youtu.be/q5-QTpEMGdU' },
        ],
      };
}
