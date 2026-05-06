import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const formData = await request.formData();
  const lineItemId = formData.get('lineItemId')?.toString();
  const back = formData.get('back')?.toString() || '/cart';
  if (!lineItemId) return new Response('Missing lineItemId', { status: 400 });
  await locals.shop.removeFromCart(lineItemId);
  return redirect(back, 303);
};
