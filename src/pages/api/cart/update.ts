import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const formData = await request.formData();
  const lineItemId = formData.get('lineItemId')?.toString();
  const quantity = Number(formData.get('quantity') ?? 1);
  const back = formData.get('back')?.toString() || '/cart';
  if (!lineItemId) return new Response('Missing lineItemId', { status: 400 });
  if (quantity <= 0) {
    await locals.shop.removeFromCart(lineItemId);
  } else {
    await locals.shop.updateQuantity(lineItemId, quantity);
  }
  return redirect(back, 303);
};
