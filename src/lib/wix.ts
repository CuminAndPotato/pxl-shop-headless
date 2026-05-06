import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { currentCart } from '@wix/ecom';
import { redirects } from '@wix/redirects';

const clientId = import.meta.env.WIX_CLIENT_ID;

export function makeWixClient(sessionTokens?: any) {
  if (!clientId) {
    throw new Error('Missing WIX_CLIENT_ID. Copy .env.example to .env and set it.');
  }
  return createClient({
    modules: { products, currentCart, redirects },
    auth: OAuthStrategy({ clientId, tokens: sessionTokens }),
  });
}

export const WIX_STORES_APP_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';

export type ProductSummary = {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  price: string;
  discountedPrice: string;
  hasDiscount: boolean;
  inStock: boolean;
  stockQuantity?: number;
  trackInventory: boolean;
  mainImage?: string;
  gallery: string[];
  manageVariants: boolean;
};

export async function loadFirstProduct(): Promise<ProductSummary | null> {
  if (!clientId) return null;
  try {
    const client = makeWixClient();
    const result = await client.products.queryProducts().find();
    const p = result.items[0];
    if (!p) return null;

    const stock = (p as any).stock ?? {};
    return {
      id: p._id!,
      name: p.name ?? '',
      brand: (p as any).brand ?? undefined,
      description: p.description ?? undefined,
      price: p.priceData?.formatted?.price ?? '',
      discountedPrice: p.priceData?.formatted?.discountedPrice ?? '',
      hasDiscount: !!p.priceData?.discountedPrice && p.priceData.discountedPrice !== p.priceData.price,
      inStock: stock.inStock !== false,
      stockQuantity: typeof stock.quantity === 'number' ? stock.quantity : undefined,
      trackInventory: !!stock.trackInventory,
      mainImage: p.media?.mainMedia?.image?.url ?? undefined,
      gallery: (p.media?.items ?? [])
        .filter((it: any) => it.mediaType === 'image' && it.image?.url)
        .map((it: any) => it.image.url as string),
      manageVariants: !!(p as any).manageVariants,
    };
  } catch (err) {
    console.error('[wix] loadFirstProduct failed:', err);
    return null;
  }
}
