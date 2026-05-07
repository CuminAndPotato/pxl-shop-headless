/**
 * Pure mappers from Wix API shapes → our internal Shop types.
 *
 * No Wix SDK imports, no I/O — just data transformations. Used by both the
 * build-time product loader and the browser-side cart client.
 */

import type {
  Product,
  Cart,
  CartLineItem,
  Money,
  Variant,
  ProductOption,
} from './shop';
import { EMPTY_CART } from './shop';

const fmtMoney = (formatted: string | undefined, amount?: number, currency = 'EUR'): Money => ({
  formatted: formatted ?? '',
  amount: amount ?? 0,
  currency,
});

export function mapProduct(p: any): Product {
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
 * Normalize to a CDN URL with a sensible fill size for the cart thumbnail.
 */
function normalizeWixImage(raw: any, w = 200, h = 200): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return normalizeWixImage(raw.url ?? raw.src, w, h);
  if (typeof raw !== 'string') return undefined;
  if (raw.startsWith('https://')) return raw;
  const m = raw.match(/^wix:image:\/\/v1\/([^/]+)\/([^#]*)/);
  if (!m) return undefined;
  const mediaId = m[1];
  const filename = m[2] || mediaId;
  return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${w},h_${h},al_c,q_85,enc_avif,quality_auto/${filename}`;
}

export function mapCart(c: any): Cart {
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
export function isCartNotFound(err: any): boolean {
  const code = err?.details?.applicationError?.code ?? err?.code ?? '';
  return NOT_FOUND_CODES.has(code);
}

export const WIX_STORES_APP_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';
