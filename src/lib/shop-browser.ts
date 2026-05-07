/**
 * Browser-side shop client.
 *
 * All cart/checkout calls happen here, in the user's browser, with
 * visitor OAuth tokens persisted to localStorage. The site itself is
 * static — there is no server component.
 */

import { createClient, OAuthStrategy } from '@wix/sdk';
import { currentCart } from '@wix/ecom';
import { redirects } from '@wix/redirects';
import type {
  Cart,
  AddItem,
  CheckoutRedirect,
} from './shop';
import { EMPTY_CART } from './shop';
import { mapCart, isCartNotFound, WIX_STORES_APP_ID } from './shop-mapping';

const TOKENS_KEY = 'wix_visitor_tokens_v1';
const CART_CHANGED_EVENT = 'pxl:cart-changed';

type WixClient = ReturnType<typeof createClient<{
  currentCart: typeof currentCart;
  redirects: typeof redirects;
}>>;

let clientPromise: Promise<WixClient> | null = null;

function readTokens(): any | undefined {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeTokens(tokens: any): void {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch { /* quota / private mode — best-effort only */ }
}

async function getClient(): Promise<WixClient> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const clientId = import.meta.env.PUBLIC_WIX_CLIENT_ID;
    if (!clientId) {
      throw new Error('PUBLIC_WIX_CLIENT_ID is not set — shop disabled');
    }

    const stored = readTokens();
    let client = createClient({
      modules: { currentCart, redirects },
      auth: OAuthStrategy({ clientId, tokens: stored }),
    });

    if (!stored) {
      const fresh = await client.auth.generateVisitorTokens();
      writeTokens(fresh);
      client = createClient({
        modules: { currentCart, redirects },
        auth: OAuthStrategy({ clientId, tokens: fresh }),
      });
    }

    return client;
  })();
  return clientPromise;
}

/** Persist any refreshed token pair the SDK rotated under the hood. */
function persistRefreshedTokens(client: WixClient) {
  try {
    const after = (client as any).auth?.getTokens?.();
    if (after?.accessToken?.value) writeTokens(after);
  } catch { /* getTokens not available — ignore */ }
}

function emitCartChanged(cart: Cart) {
  document.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: cart }));
}

export async function getCart(): Promise<Cart> {
  try {
    const client = await getClient();
    const c = await client.currentCart.getCurrentCart();
    persistRefreshedTokens(client);
    return mapCart(c);
  } catch (err: any) {
    if (isCartNotFound(err)) return EMPTY_CART;
    console.error('[shop-browser] getCart failed:', err);
    return EMPTY_CART;
  }
}

export async function addToCart({ productId, variantId, choices, quantity = 1 }: AddItem): Promise<Cart> {
  const client = await getClient();
  const options: any = variantId ? { variantId } : choices ? { options: choices } : undefined;
  const result = await client.currentCart.addToCurrentCart({
    lineItems: [
      {
        catalogReference: {
          appId: WIX_STORES_APP_ID,
          catalogItemId: productId,
          ...(options ? { options } : {}),
        },
        quantity,
      },
    ],
  });
  persistRefreshedTokens(client);
  const cart = mapCart(result.cart);
  emitCartChanged(cart);
  return cart;
}

export async function updateQuantity(lineItemId: string, quantity: number): Promise<Cart> {
  const client = await getClient();
  const result = await client.currentCart.updateCurrentCartLineItemQuantity([
    { _id: lineItemId, quantity },
  ]);
  persistRefreshedTokens(client);
  const cart = mapCart(result.cart);
  emitCartChanged(cart);
  return cart;
}

export async function removeFromCart(lineItemId: string): Promise<Cart> {
  const client = await getClient();
  const result = await client.currentCart.removeLineItemsFromCurrentCart([lineItemId]);
  persistRefreshedTokens(client);
  const cart = mapCart(result.cart);
  emitCartChanged(cart);
  return cart;
}

export async function applyCoupon(code: string): Promise<Cart> {
  const client = await getClient();
  const result = await client.currentCart.updateCurrentCart({
    cartInfo: { couponCode: code },
  });
  persistRefreshedTokens(client);
  const cart = mapCart(result.cart);
  emitCartChanged(cart);
  return cart;
}

export async function removeCoupon(): Promise<Cart> {
  const client = await getClient();
  const result = await client.currentCart.removeCouponFromCurrentCart();
  persistRefreshedTokens(client);
  const cart = mapCart(result.cart);
  emitCartChanged(cart);
  return cart;
}

export async function createCheckoutRedirect(opts: {
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutRedirect> {
  const client = await getClient();
  const checkout = await client.currentCart.createCheckoutFromCurrentCart({ channelType: 'WEB' });
  const redirect = await client.redirects.createRedirectSession({
    ecomCheckout: { checkoutId: checkout.checkoutId! },
    callbacks: { postFlowUrl: opts.cancelUrl, thankYouPageUrl: opts.successUrl },
  });
  const url = redirect.redirectSession?.fullUrl;
  if (!url) throw new Error('Wix did not return a checkout URL');
  return { url };
}

export const CART_CHANGED = CART_CHANGED_EVENT;
