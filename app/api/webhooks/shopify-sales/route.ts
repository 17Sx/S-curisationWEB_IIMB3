import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

interface ShopifyLineItem {
  product_id: number;
  quantity: number;
}

interface ShopifyOrderWebhook {
  id: number;
  line_items: ShopifyLineItem[];
}

function verifyShopifyWebhook(
  body: string,
  hmacHeader: string | null
): boolean {
  if (!hmacHeader) {
    return false;
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error("SHOPIFY_API_SECRET non configuré");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  console.log("🔐 Vérification HMAC:");
  console.log("   Secret:", secret);
  console.log("   Body length:", body.length);
  console.log("   HMAC calculé:", hash);
  console.log("   HMAC reçu:", hmacHeader);
  console.log("   Match:", hash === hmacHeader);

  return hash === hmacHeader;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");

    if (!hmacHeader) {
      return NextResponse.json(
        { message: "Missing HMAC signature" },
        { status: 401 }
      );
    }

    const isValid = verifyShopifyWebhook(rawBody, hmacHeader);

    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      console.error("Expected HMAC to match but verification failed");
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const orderData: ShopifyOrderWebhook = JSON.parse(rawBody);

    if (!orderData.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { error: "Aucun produit dans la commande" },
        { status: 400 }
      );
    }

    const updates = await Promise.allSettled(
      orderData.line_items.map(async (item) => {
        const shopifyId = BigInt(item.product_id);
        const quantity = item.quantity;

        const result = await db
          .update(products)
          .set({
            salesCount: sql`${products.salesCount} + ${quantity}`,
            updatedAt: sql`NOW()`,
          })
          .where(eq(products.shopifyId, shopifyId))
          .returning();

        if (result.length === 0) {
          console.warn(
            `Produit Shopify ID ${item.product_id} non trouvé dans la base de données`
          );
          return null;
        }

        return result[0];
      })
    );

    const successful = updates.filter((r) => r.status === "fulfilled").length;
    const failed = updates.filter((r) => r.status === "rejected").length;

    return NextResponse.json(
      {
        message: "Webhook traité avec succès",
        orderId: orderData.id,
        productsUpdated: successful,
        productsFailed: failed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du traitement du webhook:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
