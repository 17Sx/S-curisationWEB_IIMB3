import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

interface JWTPayload {
  userId: number;
  email: string;
  passwordChangeDate: number;
  iat?: number;
  exp?: number;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Token manquant ou invalide", 401);
  }

  const token = authHeader.substring(7);

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new AuthError("Configuration JWT manquante", 500);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        lastPasswordChange: users.lastPasswordChange,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new AuthError("Utilisateur introuvable", 401);
    }

    // Vérifier si le mot de passe a été changé après l'émission du token
    const passwordChangeTimestamp = new Date(user.lastPasswordChange).getTime();
    if (decoded.passwordChangeDate < passwordChangeTimestamp) {
      throw new AuthError(
        "Token expiré suite à un changement de mot de passe",
        401
      );
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError("Token invalide", 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Token expiré", 401);
    }
    throw new AuthError("Erreur d'authentification", 401);
  }
}

export function generateToken(
  userId: number,
  email: string,
  passwordChangeDate: Date
): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("Configuration JWT manquante");
  }

  return jwt.sign(
    {
      userId,
      email,
      passwordChangeDate: passwordChangeDate.getTime(),
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}
