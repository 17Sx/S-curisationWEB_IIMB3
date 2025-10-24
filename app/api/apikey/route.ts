import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { assertPermission } from "@/lib/auth";
import crypto from "crypto";

function generateApiKey(): string {
  return "apikey_" + crypto.randomBytes(32).toString("hex");
}

export async function GET(req: NextRequest) {
  try {
    const auth = await assertPermission(req, "canManageApiKeys");

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, auth.userId))
      .orderBy(apiKeys.createdAt);

    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await assertPermission(req, "canManageApiKeys");

    const body = await req.json();
    const { name } = body as { name?: string };

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const existingKey = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.userId, auth.userId) && eq(apiKeys.name, name))
      .limit(1);

    if (existingKey.length > 0) {
      return NextResponse.json(
        { message: "API key name must be unique" },
        { status: 400 }
      );
    }

    const key = generateApiKey();
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: auth.userId,
        name,
        key,
      })
      .returning();

    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      key: newKey.key,
    });
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await assertPermission(req, "canManageApiKeys");

    const body = await req.json();
    const { id } = body as { id?: string };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "API key id required" },
        { status: 400 }
      );
    }

    const [keyToDelete] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.id, id) && eq(apiKeys.userId, auth.userId))
      .limit(1);

    if (!keyToDelete) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 }
      );
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
