import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, roles } from "./schema";
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

export class PermissionError extends AuthError {
  constructor(message: string) {
    super(message, 403);
    this.name = "PermissionError";
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
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new AuthError("Utilisateur introuvable", 401);
    }

    // checck password change
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
      roleId: user.roleId,
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

export async function assertPermission(
  request: NextRequest,
  permission:
    | "canPostLogin"
    | "canGetMyUser"
    | "canGetUsers"
    | "canPostProducts"
    | "canManageApiKeys"
) {
  const auth = await authenticateRequest(request);

  const [role] = await db
    .select({
      id: roles.id,
      name: roles.name,
      canPostLogin: roles.canPostLogin,
      canGetMyUser: roles.canGetMyUser,
      canGetUsers: roles.canGetUsers,
      canPostProducts: roles.canPostProducts,
      canManageApiKeys: roles.canManageApiKeys,
    })
    .from(roles)
    .where(eq(roles.id, auth.roleId!))
    .limit(1);

  if (!role) {
    throw new PermissionError("Rôle introuvable");
  }

  if (!role[permission]) {
    throw new PermissionError("Permission refusée");
  }

  return auth;
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
