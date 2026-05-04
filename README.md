# pxl-shop-headless

Astro-Frontend für den Wix-Shop **Pxl-Clock**, angebunden via Wix Self-Managed Headless SDK.
Daten (Produkte, Bilder, Preise, Coupons, Checkout) bleiben in Wix; nur das Frontend ist hier.

## Setup

### 1. OAuth-App in Wix anlegen

1. Wix-Dashboard → Pxl-Clock-Site auswählen → **Settings → Headless Settings → OAuth Apps**
2. **Create OAuth App**, Name z. B. `pxl-shop-headless-dev`
3. Permissions: mindestens **Wix Stores: Read Products** und **Wix eCommerce: Manage Cart + Checkout**
4. Client-ID kopieren

### 2. Allowed Redirect Domain setzen

Wix-Dashboard → **Headless Settings → Allowed Redirect Domains** → `http://localhost:4321` hinzufügen.

### 3. .env

```bash
cp .env.example .env
# WIX_CLIENT_ID eintragen
```

### 4. Dev-Server starten

```bash
npm run dev
# http://localhost:4321
```

## Struktur

```
src/
  lib/wix.ts          — Wix-SDK-Client (Visitor OAuth)
  pages/
    index.astro       — Produktseite, Daten live aus dem Wix-Shop
    thank-you.astro   — Post-Checkout-Landing
    api/buy.ts        — Cart anlegen + Wix-Checkout-Redirect
```

## Deployment

`npm run build` erzeugt einen Standalone-Node-Server in `dist/server/`.
Hosting-Optionen: Vercel/Netlify (Adapter wechseln), Wix-Hosting (später migrierbar zu Wix-Managed Headless), eigener Server.
