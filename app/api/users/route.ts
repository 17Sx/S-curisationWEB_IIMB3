import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    await authenticateRequest(request);

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json({
      users: allUsers,
      total: allUsers.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Users list error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
