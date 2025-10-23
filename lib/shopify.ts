import "@shopify/shopify-api/adapters/node";
import { shopifyApi } from "@shopify/shopify-api";

if (!process.env.SHOPIFY_SHOP_URL) {
  throw new Error("SHOPIFY_SHOP_URL manquant dans .env");
}

if (!process.env.SHOPIFY_ACCESS_TOKEN) {
  throw new Error("SHOPIFY_ACCESS_TOKEN manquant dans .env");
}

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: ["write_products", "read_products"],
  hostName: process.env.SHOPIFY_SHOP_URL.replace("https://", "").replace(
    "http://",
    ""
  ),
  apiVersion: "2024-01",
  isEmbeddedApp: false,
});

const shopDomain = process.env.SHOPIFY_SHOP_URL.replace("https://", "").replace(
  "http://",
  ""
);
const session = shopify.session.customAppSession(shopDomain);

session.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

interface CreateProductInput {
  title: string;
  price: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    price: string;
  }>;
}

export async function createShopifyProduct(
  input: CreateProductInput
): Promise<{ shopifyId: string; title: string; price: string }> {
  const client = new shopify.clients.Rest({ session });

  const response = await client.post({
    path: "products",
    data: {
      product: {
        title: input.title,
        variants: [
          {
            price: input.price,
            inventory_management: null,
          },
        ],
      },
    },
  });

  const product = response.body as { product: ShopifyProduct };

  return {
    shopifyId: product.product.id,
    title: product.product.title,
    price: product.product.variants[0].price,
  };
}
