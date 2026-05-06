import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const formData = await request.formData();
  const productId = formData.get('productId')?.toString();
  const variantId = formData.get('variantId')?.toString() || undefined;
  const quantity = Number(formData.get('quantity') ?? 1);
  const back = formData.get('back')?.toString() || '/';
  if (!productId) return new Response('Missing productId', { status: 400 });
  await locals.shop.addToCart({ productId, variantId, quantity });
  return redirect(back, 303);
};
