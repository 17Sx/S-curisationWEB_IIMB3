import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, AuthError, generateToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
});

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request);
    const body = await request.json();

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        lastPasswordChange: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(users.id, user.id));

    // Générer un nouveau token avec la nouvelle date de changement de mot de passe
    const newToken = generateToken(user.id, user.email, now);

    return NextResponse.json({
      message: "Mot de passe changé avec succès",
      token: newToken,
      expiresIn: "1h",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
