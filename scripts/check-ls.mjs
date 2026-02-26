import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const headers = { Authorization: `Bearer ${API_KEY}`, Accept: "application/vnd.api+json" };

async function main() {
  // 1. Store
  const storeRes = await fetch("https://api.lemonsqueezy.com/v1/stores/289835", { headers });
  const store = await storeRes.json();
  const sa = store.data?.attributes;
  console.log("=== STORE ===");
  console.log("Name:", sa?.name);
  console.log("Slug:", sa?.slug);
  console.log("URL:", sa?.url);
  console.log("Currency:", sa?.currency);

  // 2. Products
  const prodRes = await fetch("https://api.lemonsqueezy.com/v1/products?filter[store_id]=289835", { headers });
  const prods = await prodRes.json();
  console.log("\n=== PRODUCTS ===");
  for (const p of prods.data || []) {
    const a = p.attributes;
    console.log(`  ID: ${p.id} | Name: ${a?.name} | Status: ${a?.status} | Test mode: ${a?.test_mode}`);
  }

  // 3. Webhooks
  const whRes = await fetch("https://api.lemonsqueezy.com/v1/webhooks?filter[store_id]=289835", { headers });
  const wh = await whRes.json();
  console.log("\n=== WEBHOOKS ===");
  for (const w of wh.data || []) {
    const a = w.attributes;
    console.log(`  ID: ${w.id}`);
    console.log(`  URL: ${a?.url}`);
    console.log(`  Events: ${JSON.stringify(a?.events)}`);
    console.log(`  Test mode: ${a?.test_mode}`);
    console.log(`  Created: ${a?.created_at}`);
  }
  if ((wh.data || []).length === 0) console.log("  (none)");
}

main().catch(e => console.error(e));
