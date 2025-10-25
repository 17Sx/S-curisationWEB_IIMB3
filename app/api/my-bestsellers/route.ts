import { NextRequest, NextResponse } from "next/server";
import { assertPermission, AuthError, PermissionError } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const auth = await assertPermission(request, "canGetBestsellers");

    const userProducts = await db
      .select({
        id: products.id,
        shopifyId: products.shopifyId,
        salesCount: products.salesCount,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.createdBy, auth.userId))
      .orderBy(desc(products.salesCount));

    return NextResponse.json({
      bestsellers: userProducts.map((p) => ({
        ...p,
        shopifyId: p.shopifyId.toString(),
      })),
      total: userProducts.length,
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof PermissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Get bestsellers error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des bestsellers" },
      { status: 500 }
    );
  }
}
