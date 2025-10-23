import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthError, PermissionError } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    const myProducts = await db
      .select({
        id: products.id,
        shopifyId: products.shopifyId,
        salesCount: products.salesCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.createdBy, auth.userId))
      .orderBy(products.createdAt);

    return NextResponse.json({
      products: myProducts.map((p) => ({
        ...p,
        shopifyId: p.shopifyId.toString(),
      })),
      total: myProducts.length,
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof PermissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Get my products error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de vos produits" },
      { status: 500 }
    );
  }
}

