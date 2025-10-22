import { pgTable, unique, serial, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lastPasswordChange: timestamp("last_password_change", { mode: 'string' }).defaultNow().notNull(),
	lastLoginAttempt: timestamp("last_login_attempt", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
