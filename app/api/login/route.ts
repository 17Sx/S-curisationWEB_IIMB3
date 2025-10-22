import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles, users } from "@/lib/schema";
import { generateToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginAttempts = new Map<string, number>();

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

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

    // rate limiting
    const now = Date.now();
    const minTimeBetweenAttempts = 5000; // 5s
    const userKey = `user_${user.id}`;

    // check locks
    if (loginAttempts.has(userKey)) {
      const lastAttempt = loginAttempts.get(userKey)!;
      const timeSinceLastAttempt = now - lastAttempt;

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

    // MAJ locks 
    loginAttempts.set(userKey, now);

    // clean locks
    for (const [key, timestamp] of loginAttempts.entries()) {
      if (now - timestamp > 60000) {
        loginAttempts.delete(key);
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe invalide" },
        { status: 401 }
      );
    }

    // checck permission
    const [role] = await db
      .select({
        canPostLogin: roles.canPostLogin,
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    if (!role || !role.canPostLogin) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
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
