import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, url, locals }) => {
  const formData = await request.formData();
  const locale = formData.get('locale')?.toString() === 'de' ? 'de' : 'en';
  const origin = url.origin;
  const homePath = locale === 'de' ? '/de/' : '/';
  const thankYouPath = locale === 'de' ? '/de/thank-you' : '/thank-you';

  try {
    const { url: redirectUrl } = await locals.shop.createCheckoutRedirect({
      successUrl: `${origin}${thankYouPath}`,
      cancelUrl: `${origin}${homePath}`,
      locale,
    });
    return Response.redirect(redirectUrl, 303);
  } catch (err) {
    console.error('[api/cart/checkout] failed:', err);
    return new Response('Failed to start checkout', { status: 500 });
  }
};
