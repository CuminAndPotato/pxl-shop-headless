# Agent-Anweisungen — pxl-shop-headless

Anweisungen für KI-Assistenten (Claude Code, Copilot, Cursor) die an diesem Projekt arbeiten.

## Kontext

Dies ist das Astro-Frontend für den Wix-Shop **Pxl-Clock** der Cumin & Potato GmbH (Ronald + Partner).
Produkt: **PXL Clock** — ein 24x24 RGB-LED Pixel-Display, programmierbar in C# / .NET, handgefertigt mit echtem Glas.

Es ist ein **Self-Managed Headless**-Setup:
- Frontend (dieses Repo) lebt unabhängig, kann auf Vercel/Netlify/eigenem Server gehostet werden
- Daten (Produkte, Bilder, Coupons, Bestellungen, Versand, Zahlungen) bleiben in der bestehenden Wix-Site
- Checkout läuft über Wix-Managed-Redirect

**Wix Site:** Pxl-Clock (Site-ID `bb58c0bc-4167-405f-9049-0b3da245532f`)
**Bestehende Live-Site:** https://www.pxlclock.com (Wix-Editor-basiert, läuft parallel)
**Eines Produkt im Shop:** "PXL Clock", 275€ / 229€ (im Sale), 2 kg, Versand aus DE mit DHL
**Promo-Code:** `RONALD` (-25 €)

## Strategisches Ziel

**Hauptproblem:** ~3 Visitors/Tag auf der bestehenden Wix-Seite. Reichweiten-Problem, kein Conversion-Problem.
Dieses Repo dient dazu:
1. SEO-optimierte, schnelle Seiten zu bauen (Astro = SSR, schlanke Bundles)
2. Spezielle Landing Pages für Marketing-Kanäle (Hacker News, Reddit r/csharp, Reddit r/dotnet, Product Hunt, dev.to, GitHub README)
3. Eine bessere Tech-Zielgruppen-Ansprache (Devs, Maker)
4. Code-/Embed-orientierte Inhalte (Live-Simulator, Code-Beispiele)

Die Wix-Editor-Seite bleibt vorerst Hauptseite. Diese Astro-Site läuft parallel — z. B. auf Subdomain `try.pxlclock.com` o. ä.

## Tech-Stack

- **Astro 6** mit Node-SSR-Adapter (`output: 'server'`, mode `standalone`)
- **TypeScript** strict
- **Wix SDK**: `@wix/sdk`, `@wix/stores`, `@wix/ecom`, `@wix/redirects`
- **Auth:** OAuth Visitor Strategy (Client-ID via `WIX_CLIENT_ID` Env-Var)
- **Node:** ≥22.12.0 (entwickelt mit Node 25)

## Projektstruktur

```
src/
  lib/wix.ts             — SDK-Client-Factory (Visitor OAuth)
  pages/
    index.astro          — Produktseite (live aus Wix Shop)
    thank-you.astro      — Post-Checkout
    api/buy.ts           — POST: Cart anlegen → Wix-Checkout-Redirect
```

## Konventionen

- **Sprache:** UI-Texte in Deutsch (Hauptzielgruppe DE/EU). Code-Kommentare und commits auf Englisch.
- **Commits:** keine "Co-Authored-By: Claude"-Zeile.
- **Keine Emojis** in Files schreiben, außer der User fragt explizit danach.
- **Stil:** klar, knapp, kein Boilerplate. Default: keine Kommentare im Code, außer das *Warum* ist nicht offensichtlich.
- **Editor-Site nicht anfassen:** Diese Repo macht NICHT Änderungen am Wix-Editor-Layout der Live-Site. Für Daten-Änderungen (Produkte, Coupons, Versand) im Shop bitte die Wix REST APIs nutzen, nicht hier eintragen.

## Wix Catalog: V1 vs. V3

Die bestehende Pxl-Clock-Site nutzt **Catalog V1** (Stores, products, currentCart). Wir nutzen daher
`client.products.queryProducts()` aus `@wix/stores` (V1-Modul). Nicht `productsV3` verwenden, sonst kommen leere Results zurück.

`appId` für Cart-LineItem-CatalogReference (Wix Stores): `1380b703-ce81-ff05-f115-39571d94dfcd`.

## Setup für lokale Entwicklung

1. OAuth-App in Wix anlegen (Wix Dashboard → Headless Settings → OAuth Apps).
2. `http://localhost:4321` als Allowed Redirect Domain eintragen.
3. `cp .env.example .env`, Client-ID einsetzen.
4. `npm install && npm run dev` → http://localhost:4321

## Roadmap-Ideen (nicht verbindlich)

- Echte Designsprache (an pxlclock.com angelehnt, aber moderner/schneller)
- Blog-Sektion in Astro (`src/pages/blog/`) — perfekt für SEO. Themen: "Programming RGB matrices in C#", "Why we built a hardware product", "Hackathon recap PXL-JAM"
- Spezielle Landing Pages: `/dev` (Tech-Pitch), `/jam` (PXL-JAM-Hackathon), `/buy` (kurze Conversion-Page)
- Embed des PXL-Browser-Simulators (existiert bereits unter localhost:5001 in einem anderen Repo)
- `?ref=`-Tracking je Kanal, ggf. einfach via URL-Param + Cookie
- Sitemap + robots.txt + strukturierte Daten (JSON-LD Product)
- Performance-Budget: ≤50 KB JS, ≤100 KB CSS auf der Hauptseite

## Was NICHT zu tun ist

- **Nicht** Catalog V3 nutzen, solange Wix-Site V1 fährt
- **Nicht** Bestelldaten/Kundendaten lokal speichern — alles bleibt in Wix
- **Keine** Kreditkartenformulare hier bauen — Checkout läuft IMMER via Wix-Redirect
- **Nicht** mit Admin-API-Keys arbeiten (Visitor OAuth reicht für Frontend)
- **Keine** Domain-/DNS-/Wix-Site-Änderungen ohne explizite Freigabe
