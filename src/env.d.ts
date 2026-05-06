/// <reference path="../.astro/types.d.ts" />

import type { Shop } from './lib/shop';

declare namespace App {
  interface Locals {
    /** Backend-agnostic shop adapter (currently backed by Wix Headless). */
    shop: Shop;
    /** Whether the visitor's session token was refreshed during this request. */
    sessionRefreshed?: boolean;
  }
}
