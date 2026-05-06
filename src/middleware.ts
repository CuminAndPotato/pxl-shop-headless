import { defineMiddleware } from 'astro:middleware';
import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { currentCart } from '@wix/ecom';
import { redirects } from '@wix/redirects';
import { createWixShop } from './lib/shop-wix';
import type { Shop } from './lib/shop';
import { EMPTY_CART } from './lib/shop';

const COOKIE = 'wix_session';
// `Secure` must be off in dev (HTTP localhost) — otherwise the browser silently
// drops the cookie and every request looks like a brand-new visitor (= empty cart).
const IS_PROD = import.meta.env.PROD;
const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days; refresh token typically outlives this
};
const clientId = import.meta.env.WIX_CLIENT_ID;

/** Fallback shop used when WIX_CLIENT_ID is missing — keeps the site renderable. */
const FALLBACK_SHOP: Shop = {
  getFirstProduct: async () => null,
  getCart: async () => EMPTY_CART,
  addToCart: async () => EMPTY_CART,
  updateQuantity: async () => EMPTY_CART,
  removeFromCart: async () => EMPTY_CART,
  applyCoupon: async () => EMPTY_CART,
  removeCoupon: async () => EMPTY_CART,
  createCheckoutRedirect: async () => { throw new Error('Wix not configured'); },
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!clientId) {
    ctx.locals.shop = FALLBACK_SHOP;
    return next();
  }

  // Read existing visitor session, if any.
  const raw = ctx.cookies.get(COOKIE)?.value;
  let tokens: any = undefined;
  if (raw) {
    try { tokens = JSON.parse(raw); } catch { /* malformed cookie — drop */ }
  }

  // Build the per-request authenticated Wix client.
  let client = createClient({
    modules: { products, currentCart, redirects },
    auth: OAuthStrategy({ clientId, tokens }),
  });

  // First-visit: mint visitor tokens and pin them to the cookie.
  if (!tokens) {
    try {
      const fresh = await client.auth.generateVisitorTokens();
      ctx.cookies.set(COOKIE, JSON.stringify(fresh), COOKIE_OPTS);
      client = createClient({
        modules: { products, currentCart, redirects },
        auth: OAuthStrategy({ clientId, tokens: fresh }),
      });
      tokens = fresh;
    } catch (err) {
      console.error('[wix-middleware] generateVisitorTokens failed:', err);
      ctx.locals.shop = FALLBACK_SHOP;
      return next();
    }
  }

  ctx.locals.shop = createWixShop(client);
  const tokenSnapshot = tokens?.accessToken?.value;

  const response = await next();

  // After the response, if the SDK refreshed the access token, persist the new pair.
  try {
    const after = (client as any).auth?.getTokens?.();
    if (after?.accessToken?.value && after.accessToken.value !== tokenSnapshot) {
      ctx.cookies.set(COOKIE, JSON.stringify(after), COOKIE_OPTS);
      ctx.locals.sessionRefreshed = true;
    }
  } catch { /* getTokens not available — ignore */ }

  return response;
});
