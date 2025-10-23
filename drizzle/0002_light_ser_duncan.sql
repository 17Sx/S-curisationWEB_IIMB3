CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopify_id" bigint NOT NULL,
	"created_by" integer NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_shopify_id_unique" UNIQUE("shopify_id")
);
--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "can_post_products" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;