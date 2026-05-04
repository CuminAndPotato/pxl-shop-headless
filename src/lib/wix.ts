import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { currentCart } from '@wix/ecom';
import { redirects } from '@wix/redirects';

const clientId = import.meta.env.WIX_CLIENT_ID;

if (!clientId) {
  throw new Error('Missing WIX_CLIENT_ID — copy .env.example to .env and set it.');
}

export function makeWixClient(sessionTokens?: any) {
  return createClient({
    modules: { products, currentCart, redirects },
    auth: OAuthStrategy({
      clientId,
      tokens: sessionTokens,
    }),
  });
}
