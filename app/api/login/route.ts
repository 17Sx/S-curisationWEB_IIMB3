import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { generateToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe invalide" },
        { status: 401 }
      );
    }

    // Rate limiting: vérifier la dernière tentative de connexion
    if (user.lastLoginAttempt) {
      const timeSinceLastAttempt =
        Date.now() - new Date(user.lastLoginAttempt).getTime();
      const minTimeBetweenAttempts = 5000; // 5 secondes

      if (timeSinceLastAttempt < minTimeBetweenAttempts) {
        const remainingTime = Math.ceil(
          (minTimeBetweenAttempts - timeSinceLastAttempt) / 1000
        );
        return NextResponse.json(
          {
            error: `Trop de tentatives. Réessayez dans ${remainingTime} secondes`,
          },
          { status: 429 }
        );
      }
    }

    // Mettre à jour la dernière tentative de connexion
    await db
      .update(users)
      .set({ lastLoginAttempt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe invalide" },
        { status: 401 }
      );
    }

    const token = generateToken(
      user.id,
      user.email,
      new Date(user.lastPasswordChange)
    );

    return NextResponse.json({
      token,
      expiresIn: "1h",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
