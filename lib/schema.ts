import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").notNull().default(2),
  lastPasswordChange: timestamp("last_password_change", { mode: "string" })
    .defaultNow()
    .notNull(),
  lastLoginAttempt: timestamp("last_login_attempt", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  canPostLogin: boolean("can_post_login").notNull().default(true),
  canGetMyUser: boolean("can_get_my_user").notNull().default(true),
  canGetUsers: boolean("can_get_users").notNull().default(false),
  canPostProducts: boolean("can_post_products").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  shopifyId: bigint("shopify_id", { mode: "bigint" }).notNull().unique(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));
