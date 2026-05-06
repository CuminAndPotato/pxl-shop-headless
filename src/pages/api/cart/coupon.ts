import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const formData = await request.formData();
  const code = formData.get('code')?.toString().trim();
  const action = formData.get('action')?.toString();
  const back = formData.get('back')?.toString() || '/cart';
  try {
    if (action === 'remove') {
      await locals.shop.removeCoupon();
    } else if (code) {
      await locals.shop.applyCoupon(code);
    }
  } catch (err) {
    console.error('[api/cart/coupon] failed:', err);
    // Fall through; cart page will show whatever Wix accepted (or didn't).
  }
  return redirect(back, 303);
};
