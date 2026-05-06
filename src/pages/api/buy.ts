import type { APIRoute } from 'astro';
import { makeWixClient, WIX_STORES_APP_ID } from '../../lib/wix';

export const POST: APIRoute = async ({ request, url }) => {
  const formData = await request.formData();
  const productId = formData.get('productId')?.toString();
  const locale = formData.get('locale')?.toString() === 'de' ? 'de' : 'en';

  if (!productId) {
    return new Response('Missing productId', { status: 400 });
  }

  const client = makeWixClient();

  await client.currentCart.addToCurrentCart({
    lineItems: [
      {
        catalogReference: {
          appId: WIX_STORES_APP_ID,
          catalogItemId: productId,
        },
        quantity: 1,
      },
    ],
  });

  const checkout = await client.currentCart.createCheckoutFromCurrentCart({
    channelType: 'WEB',
  });

  const origin = url.origin;
  const homePath = locale === 'de' ? '/de/' : '/';
  const thankYouPath = locale === 'de' ? '/de/thank-you' : '/thank-you';

  const redirect = await client.redirects.createRedirectSession({
    ecomCheckout: { checkoutId: checkout.checkoutId! },
    callbacks: {
      postFlowUrl: `${origin}${homePath}`,
      thankYouPageUrl: `${origin}${thankYouPath}`,
    },
  });

  const fullUrl = redirect.redirectSession?.fullUrl;
  if (!fullUrl) {
    return new Response('Failed to create checkout redirect', { status: 500 });
  }

  return Response.redirect(fullUrl, 303);
};
