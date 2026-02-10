/**
 * Lemon Squeezy SDK initialization.
 *
 * Call `configureLemonSqueezy()` once before using any SDK function.
 * Server-side only — requires LEMONSQUEEZY_API_KEY.
 */

import {
  lemonSqueezySetup,
  listProducts,
  listVariants,
  type ListProducts,
  type ListVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

let configured = false;

export function configureLemonSqueezy() {
  if (configured) return;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");

  lemonSqueezySetup({ apiKey, onError: (err) => console.error("[LS]", err) });
  configured = true;
}

export function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  return id;
}

/* ── Helper: list all products for our store ── */
export async function getProducts() {
  configureLemonSqueezy();
  const res = await listProducts({ filter: { storeId: getStoreId() } });
  if (res.error) throw new Error(`LS listProducts: ${res.error.message}`);
  return res.data as ListProducts;
}

/* ── Helper: list variants for a product ── */
export async function getProductVariants(productId: string) {
  configureLemonSqueezy();
  const res = await listVariants({ filter: { productId } });
  if (res.error) throw new Error(`LS listVariants: ${res.error.message}`);
  return res.data as ListVariants;
}
