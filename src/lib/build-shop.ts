/**
 * Build-time product fetcher.
 *
 * Runs once during `astro build` (and during dev page renders) to pull
 * product data from Wix. The result is embedded into the static HTML that
 * Astro emits, so the live site needs no Wix call to render.
 *
 * Visitor tokens are minted fresh on every build — there's no session to
 * persist server-side. The browser-side shop module (`shop-browser.ts`)
 * mints its own per-user visitor tokens and stores them in localStorage.
 */

import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { mapProduct } from './shop-mapping';
import type { Product } from './shop';

let cached: Product | null | undefined;

export async function getBuildTimeProduct(): Promise<Product | null> {
  if (cached !== undefined) return cached;

  const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
  if (!clientId) {
    cached = null;
    return null;
  }

  try {
    const client = createClient({
      modules: { products },
      auth: OAuthStrategy({ clientId }),
    });
    await client.auth.generateVisitorTokens();
    const result = await client.products.queryProducts().find();
    const p = result.items?.[0];
    cached = p ? mapProduct(p) : null;
  } catch (err) {
    console.error('[build-shop] getBuildTimeProduct failed:', err);
    cached = null;
  }
  return cached;
}
