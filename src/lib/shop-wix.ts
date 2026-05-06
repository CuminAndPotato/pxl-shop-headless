/**
 * Wix Headless implementation of the Shop interface.
 *
 * Uses Visitor OAuth (anonymous) — sufficient for browse + cart + checkout.
 * The authenticated `WixClient` is built per-request in `middleware.ts` and
 * threaded through `Astro.locals.shop`.
 */

import type {
  Shop,
  Product,
  Cart,
  CartLineItem,
  AddItem,
  Money,
  CheckoutRedirect,
  Variant,
  ProductOption,
} from './shop';
import { EMPTY_CART } from './shop';

// We keep the Wix Stores app id as a module-level constant; this never changes.
const WIX_STORES_APP_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';

/** A Wix client is the object returned by createClient({ modules: { products, currentCart, redirects } }). */
type WixClient = any;

const fmtMoney = (formatted: string | undefined, amount?: number, currency = 'EUR'): Money => ({
  formatted: formatted ?? '',
  amount: amount ?? 0,
  currency,
});

function mapProduct(p: any): Product {
  const stock = p.stock ?? {};
  const options: ProductOption[] = (p.productOptions ?? []).map((o: any) => ({
    name: o.name,
    choices: (o.choices ?? []).map((c: any) => c.value).filter(Boolean),
  }));
  const variants: Variant[] = (p.variants ?? []).map((v: any) => ({
    id: v._id,
    label: Object.values(v.choices ?? {}).join(' / ') || 'Default',
    choices: v.choices ?? {},
    inStock: v.stock?.inStock !== false,
    stockQuantity: typeof v.stock?.quantity === 'number' ? v.stock.quantity : undefined,
    price: fmtMoney(
      v.variant?.priceData?.formatted?.price,
      v.variant?.priceData?.price,
      v.variant?.priceData?.currency,
    ),
    discountedPrice: v.variant?.priceData?.discountedPrice
      ? fmtMoney(
          v.variant?.priceData?.formatted?.discountedPrice,
          v.variant?.priceData?.discountedPrice,
          v.variant?.priceData?.currency,
        )
      : undefined,
  }));
  return {
    id: p._id,
    name: p.name ?? '',
    description: p.description ?? undefined,
    brand: p.brand ?? undefined,
    price: fmtMoney(p.priceData?.formatted?.price, p.priceData?.price, p.priceData?.currency),
    discountedPrice: p.priceData?.discountedPrice
      ? fmtMoney(p.priceData?.formatted?.discountedPrice, p.priceData?.discountedPrice, p.priceData?.currency)
      : undefined,
    inStock: stock.inStock !== false,
    stockQuantity: typeof stock.quantity === 'number' ? stock.quantity : undefined,
    trackInventory: !!stock.trackInventory,
    mainImage: p.media?.mainMedia?.image?.url ?? undefined,
    gallery: (p.media?.items ?? [])
      .filter((it: any) => it.mediaType === 'image' && it.image?.url)
      .map((it: any) => it.image.url as string),
    hasVariants: !!p.manageVariants && variants.length > 0,
    variants,
    options,
  };
}

/**
 * Wix line items deliver images in one of three shapes:
 *   - "wix:image://v1/<media-id>/<filename>#originWidth=...&originHeight=..."
 *   - "https://static.wixstatic.com/media/<media-id>/v1/fill/..."
 *   - { url: "https://..." } (rare, but observed)
 * We normalize to a CDN URL with a sensible fill size for the cart thumbnail.
 */
function normalizeWixImage(raw: any, w = 200, h = 200): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return normalizeWixImage(raw.url ?? raw.src, w, h);
  if (typeof raw !== 'string') return undefined;
  if (raw.startsWith('https://')) return raw;
  // wix:image://v1/<id>/<filename>#originWidth=…&originHeight=…
  const m = raw.match(/^wix:image:\/\/v1\/([^/]+)\/([^#]*)/);
  if (!m) return undefined;
  const mediaId = m[1];
  const filename = m[2] || mediaId;
  return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${w},h_${h},al_c,q_85,enc_avif,quality_auto/${filename}`;
}

function mapCart(c: any): Cart {
  if (!c) return EMPTY_CART;
  const lineItems: CartLineItem[] = (c.lineItems ?? []).map((li: any) => ({
    id: li._id,
    productId: li.catalogReference?.catalogItemId ?? '',
    productName: li.productName?.translated ?? li.productName?.original ?? '',
    variantId: li.catalogReference?.options?.variantId,
    variantLabel: li.descriptionLines?.find((d: any) => d.name?.original)?.colorInfo?.translated,
    quantity: li.quantity ?? 1,
    unitPrice: fmtMoney(li.price?.formattedAmount, Number(li.price?.amount ?? 0), c.currency ?? 'EUR'),
    lineTotal: fmtMoney(li.fullPrice?.formattedAmount, Number(li.fullPrice?.amount ?? 0), c.currency ?? 'EUR'),
    image: normalizeWixImage(li.image, 200, 200),
  }));
  const itemCount = lineItems.reduce((n, li) => n + li.quantity, 0);
  const applied = (c.appliedDiscounts ?? []).find((d: any) => d.coupon || d.couponId);
  return {
    id: c._id ?? '',
    lineItems,
    subtotal: fmtMoney(c.subtotal?.formattedAmount, Number(c.subtotal?.amount ?? 0), c.currency ?? 'EUR'),
    total: fmtMoney(c.subtotal?.formattedAmount, Number(c.subtotal?.amount ?? 0), c.currency ?? 'EUR'),
    itemCount,
    appliedDiscount: applied
      ? {
          code: applied.coupon?.code ?? '',
          name: applied.coupon?.name ?? undefined,
          amount: fmtMoney(applied.coupon?.amount?.formattedAmount, Number(applied.coupon?.amount?.amount ?? 0)),
        }
      : undefined,
  };
}

const NOT_FOUND_CODES = new Set(['OWNED_CART_NOT_FOUND', 'CART_NOT_FOUND']);
function isCartNotFound(err: any): boolean {
  const code = err?.details?.applicationError?.code ?? err?.code ?? '';
  return NOT_FOUND_CODES.has(code);
}

export function createWixShop(client: WixClient): Shop {
  return {
    async getFirstProduct() {
      try {
        const result = await client.products.queryProducts().find();
        const p = result.items?.[0];
        return p ? mapProduct(p) : null;
      } catch (err) {
        console.error('[shop-wix] getFirstProduct failed:', err);
        return null;
      }
    },

    async getCart() {
      try {
        const c = await client.currentCart.getCurrentCart();
        return mapCart(c);
      } catch (err: any) {
        if (isCartNotFound(err)) return EMPTY_CART;
        throw err;
      }
    },

    async addToCart({ productId, variantId, choices, quantity = 1 }: AddItem) {
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
      return mapCart(result.cart);
    },

    async updateQuantity(lineItemId, quantity) {
      const result = await client.currentCart.updateCurrentCartLineItemQuantity([
        { _id: lineItemId, quantity },
      ]);
      return mapCart(result.cart);
    },

    async removeFromCart(lineItemId) {
      const result = await client.currentCart.removeLineItemsFromCurrentCart([lineItemId]);
      return mapCart(result.cart);
    },

    async applyCoupon(code) {
      const result = await client.currentCart.updateCurrentCart({
        cartInfo: { couponCode: code },
      });
      return mapCart(result.cart);
    },

    async removeCoupon() {
      const result = await client.currentCart.removeCouponFromCurrentCart();
      return mapCart(result.cart);
    },

    async createCheckoutRedirect({ successUrl, cancelUrl }): Promise<CheckoutRedirect> {
      const checkout = await client.currentCart.createCheckoutFromCurrentCart({ channelType: 'WEB' });
      const redirect = await client.redirects.createRedirectSession({
        ecomCheckout: { checkoutId: checkout.checkoutId! },
        callbacks: { postFlowUrl: cancelUrl, thankYouPageUrl: successUrl },
      });
      const url = redirect.redirectSession?.fullUrl;
      if (!url) throw new Error('Wix did not return a checkout URL');
      return { url };
    },
  };
}
