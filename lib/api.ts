import { os } from "@orpc/server";
import { z } from "zod";
import { db } from "./db";
import { users } from "./schema";
import bcrypt from "bcryptjs";

// Health endpoint
export const healthProcedure = os
  .output(
    z.object({
      test: z.string(),
    })
  )
  .handler(async () => {
    return { test: "hello world" };
  });

// Register endpoint
export const registerProcedure = os
  .input(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    })
  )
  .output(
    z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const { name, email, password } = input;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return user;
  });

export const router = {
  health: healthProcedure,
  register: registerProcedure,
};
