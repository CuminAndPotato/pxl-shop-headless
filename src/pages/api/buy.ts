import type { APIRoute } from 'astro';
import { makeWixClient } from '../../lib/wix';

export const POST: APIRoute = async ({ request, url }) => {
  const formData = await request.formData();
  const productId = formData.get('productId')?.toString();

  if (!productId) {
    return new Response('Missing productId', { status: 400 });
  }

  const client = makeWixClient();

  const cart = await client.currentCart.addToCurrentCart({
    lineItems: [
      {
        catalogReference: {
          appId: '1380b703-ce81-ff05-f115-39571d94dfcd',
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
  const redirect = await client.redirects.createRedirectSession({
    ecomCheckout: { checkoutId: checkout.checkoutId! },
    callbacks: {
      postFlowUrl: origin,
      thankYouPageUrl: `${origin}/thank-you`,
    },
  });

  const fullUrl = redirect.redirectSession?.fullUrl;
  if (!fullUrl) {
    return new Response('Failed to create checkout redirect', { status: 500 });
  }

  return Response.redirect(fullUrl, 303);
};
