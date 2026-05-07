/**
 * Backend-agnostic shop types.
 *
 * Build-time product data flows through `build-shop.ts`; cart operations
 * happen client-side via `shop-browser.ts`. Both consume these types.
 */

export type Money = {
  /** Pre-formatted with currency symbol, e.g. "229,00 €" */
  formatted: string;
  /** Numeric value in major units (e.g. 229.00) */
  amount: number;
  /** ISO currency code, e.g. "EUR" */
  currency: string;
};

export type Variant = {
  id: string;
  /** Human-readable label, e.g. "Black Edition" */
  label: string;
  /** Choice map, e.g. { Color: "Black" } */
  choices: Record<string, string>;
  inStock: boolean;
  stockQuantity?: number;
  price: Money;
  discountedPrice?: Money;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  price: Money;
  discountedPrice?: Money;
  inStock: boolean;
  stockQuantity?: number;
  trackInventory: boolean;
  mainImage?: string;
  gallery: string[];
  /** True when variants exist and the customer must pick one */
  hasVariants: boolean;
  variants: Variant[];
  options: ProductOption[];
};

export type ProductOption = {
  /** e.g. "Color" */
  name: string;
  /** e.g. ["Black", "White"] */
  choices: string[];
};

export type CartLineItem = {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  image?: string;
};

export type AppliedDiscount = {
  code: string;
  name?: string;
  amount: Money;
};

export type Cart = {
  id: string;
  lineItems: CartLineItem[];
  subtotal: Money;
  total: Money;
  itemCount: number;
  appliedDiscount?: AppliedDiscount;
};

export type AddItem = {
  productId: string;
  variantId?: string;
  /** Option choices, used when product is not pre-resolved to a variantId */
  choices?: Record<string, string>;
  quantity?: number;
};

export type CheckoutRedirect = {
  url: string;
};

/** Empty cart constant for fallback when no backend is configured. */
export const EMPTY_CART: Cart = {
  id: '',
  lineItems: [],
  subtotal: { formatted: '0,00 €', amount: 0, currency: 'EUR' },
  total: { formatted: '0,00 €', amount: 0, currency: 'EUR' },
  itemCount: 0,
};
