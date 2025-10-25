import { NextRequest, NextResponse } from "next/server";
import {
  assertPermission,
  authenticateRequest,
  AuthError,
  PermissionError,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { products, users } from "@/lib/schema";
import { createShopifyProduct } from "@/lib/shopify";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const auth = await assertPermission(request, "canPostProducts");

    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Le titre du produit est requis" },
        { status: 400 }
      );
    }

    if (!body.price || typeof body.price !== "string") {
      return NextResponse.json(
        { error: "Le prix du produit est requis" },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(body.price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Vérifier les permissions PREMIUM pour image_url
    let imageUrl: string | null = null;
    if (body.image_url) {
      if (!auth.role?.canUploadImages) {
        return NextResponse.json(
          { error: "Vous devez avoir un rôle PREMIUM pour ajouter des images" },
          { status: 403 }
        );
      }

      if (typeof body.image_url !== "string") {
        return NextResponse.json(
          { error: "L'URL de l'image doit être une chaîne de caractères" },
          { status: 400 }
        );
      }

      // Validation basique de l'URL
      try {
        new URL(body.image_url);
        imageUrl = body.image_url;
      } catch {
        return NextResponse.json(
          { error: "L'URL de l'image n'est pas valide" },
          { status: 400 }
        );
      }
    }

    const shopifyProduct = await createShopifyProduct({
      title: body.title,
      price: body.price,
      imageUrl: imageUrl || undefined,
    });

    const [product] = await db
      .insert(products)
      .values({
        shopifyId: BigInt(shopifyProduct.shopifyId),
        createdBy: auth.userId,
        salesCount: 0,
        imageUrl: imageUrl,
      })
      .returning();

    return NextResponse.json(
      {
        id: product.id,
        shopifyId: product.shopifyId.toString(),
        title: shopifyProduct.title,
        price: shopifyProduct.price,
        imageUrl: product.imageUrl,
        createdBy: product.createdBy,
        salesCount: product.salesCount,
        createdAt: product.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError || error instanceof PermissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du produit" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await authenticateRequest(request);

    const allProducts = await db
      .select({
        id: products.id,
        shopifyId: products.shopifyId,
        createdBy: products.createdBy,
        salesCount: products.salesCount,
        createdAt: products.createdAt,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(products)
      .leftJoin(users, eq(products.createdBy, users.id))
      .orderBy(products.createdAt);

    return NextResponse.json({
      products: allProducts.map((p) => ({
        ...p,
        shopifyId: p.shopifyId.toString(),
      })),
      total: allProducts.length,
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof PermissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}
