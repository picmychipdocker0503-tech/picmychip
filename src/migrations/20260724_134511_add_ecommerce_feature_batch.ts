import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_coupons_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum_coupons_currency" AS ENUM('INR', 'USD');
  CREATE TYPE "public"."enum_gift_cards_currency" AS ENUM('INR', 'USD');
  CREATE TYPE "public"."enum_gift_cards_status" AS ENUM('active', 'redeemed', 'expired', 'disabled');
  CREATE TYPE "public"."enum_return_requests_reason" AS ENUM('damaged', 'wrong-item', 'not-as-described', 'no-longer-needed', 'other');
  CREATE TYPE "public"."enum_return_requests_status" AS ENUM('requested', 'approved', 'rejected', 'completed');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('card', 'cod', 'gift-card');
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_coupons_type" DEFAULT 'percentage' NOT NULL,
  	"value" numeric NOT NULL,
  	"currency" "enum_coupons_currency",
  	"min_order_amount" numeric,
  	"max_redemptions" numeric,
  	"redemption_count" numeric DEFAULT 0,
  	"expires_at" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gift_cards_redemptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"order_ref_id" integer,
  	"amount" numeric NOT NULL,
  	"redeemed_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "gift_cards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"initial_amount" numeric NOT NULL,
  	"balance" numeric NOT NULL,
  	"currency" "enum_gift_cards_currency" DEFAULT 'INR' NOT NULL,
  	"recipient_email" varchar,
  	"purchased_by_id" integer,
  	"source_order_id" integer,
  	"status" "enum_gift_cards_status" DEFAULT 'active',
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stock_alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"variant_id" integer,
  	"email" varchar NOT NULL,
  	"notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "return_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"product_id" integer,
  	"reason" "enum_return_requests_reason" NOT NULL,
  	"description" varchar,
  	"status" "enum_return_requests_status" DEFAULT 'requested',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feature_flags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cash_on_delivery" boolean DEFAULT true,
  	"gift_cards" boolean DEFAULT true,
  	"coupons" boolean DEFAULT true,
  	"back_in_stock_alerts" boolean DEFAULT true,
  	"recently_viewed" boolean DEFAULT true,
  	"search_autocomplete" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ADD COLUMN "is_gift_card" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_is_gift_card" boolean DEFAULT false;
  ALTER TABLE "carts" ADD COLUMN "applied_coupon_code" varchar;
  ALTER TABLE "carts" ADD COLUMN "applied_gift_card_code" varchar;
  ALTER TABLE "carts" ADD COLUMN "coupon_discount_amount" numeric DEFAULT 0;
  ALTER TABLE "carts" ADD COLUMN "gift_card_amount_applied" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "payment_method" "enum_orders_payment_method" DEFAULT 'card';
  ALTER TABLE "orders" ADD COLUMN "discounts_applied" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "coupon_applied_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "coupon_applied_discount_amount" numeric;
  ALTER TABLE "orders" ADD COLUMN "gift_card_applied_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "gift_card_applied_amount_applied" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "coupons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gift_cards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stock_alerts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "return_requests_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_gstin" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_business_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_business_address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_business_state" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_gst_rate_percent" numeric DEFAULT 18;
  ALTER TABLE "gift_cards_redemptions" ADD CONSTRAINT "gift_cards_redemptions_order_ref_id_orders_id_fk" FOREIGN KEY ("order_ref_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gift_cards_redemptions" ADD CONSTRAINT "gift_cards_redemptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchased_by_id_users_id_fk" FOREIGN KEY ("purchased_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_source_order_id_orders_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "gift_cards_redemptions_order_idx" ON "gift_cards_redemptions" USING btree ("_order");
  CREATE INDEX "gift_cards_redemptions_parent_id_idx" ON "gift_cards_redemptions" USING btree ("_parent_id");
  CREATE INDEX "gift_cards_redemptions_order_ref_idx" ON "gift_cards_redemptions" USING btree ("order_ref_id");
  CREATE UNIQUE INDEX "gift_cards_code_idx" ON "gift_cards" USING btree ("code");
  CREATE INDEX "gift_cards_purchased_by_idx" ON "gift_cards" USING btree ("purchased_by_id");
  CREATE INDEX "gift_cards_source_order_idx" ON "gift_cards" USING btree ("source_order_id");
  CREATE INDEX "gift_cards_updated_at_idx" ON "gift_cards" USING btree ("updated_at");
  CREATE INDEX "gift_cards_created_at_idx" ON "gift_cards" USING btree ("created_at");
  CREATE INDEX "stock_alerts_product_idx" ON "stock_alerts" USING btree ("product_id");
  CREATE INDEX "stock_alerts_variant_idx" ON "stock_alerts" USING btree ("variant_id");
  CREATE INDEX "stock_alerts_updated_at_idx" ON "stock_alerts" USING btree ("updated_at");
  CREATE INDEX "stock_alerts_created_at_idx" ON "stock_alerts" USING btree ("created_at");
  CREATE INDEX "return_requests_order_idx" ON "return_requests" USING btree ("order_id");
  CREATE INDEX "return_requests_product_idx" ON "return_requests" USING btree ("product_id");
  CREATE INDEX "return_requests_updated_at_idx" ON "return_requests" USING btree ("updated_at");
  CREATE INDEX "return_requests_created_at_idx" ON "return_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gift_cards_fk" FOREIGN KEY ("gift_cards_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_alerts_fk" FOREIGN KEY ("stock_alerts_id") REFERENCES "public"."stock_alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_return_requests_fk" FOREIGN KEY ("return_requests_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX "payload_locked_documents_rels_gift_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("gift_cards_id");
  CREATE INDEX "payload_locked_documents_rels_stock_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_alerts_id");
  CREATE INDEX "payload_locked_documents_rels_return_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("return_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coupons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gift_cards_redemptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gift_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stock_alerts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "return_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "feature_flags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "gift_cards_redemptions" CASCADE;
  DROP TABLE "gift_cards" CASCADE;
  DROP TABLE "stock_alerts" CASCADE;
  DROP TABLE "return_requests" CASCADE;
  DROP TABLE "feature_flags" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_coupons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gift_cards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stock_alerts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_return_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_coupons_id_idx";
  DROP INDEX "payload_locked_documents_rels_gift_cards_id_idx";
  DROP INDEX "payload_locked_documents_rels_stock_alerts_id_idx";
  DROP INDEX "payload_locked_documents_rels_return_requests_id_idx";
  ALTER TABLE "products" DROP COLUMN "is_gift_card";
  ALTER TABLE "_products_v" DROP COLUMN "version_is_gift_card";
  ALTER TABLE "carts" DROP COLUMN "applied_coupon_code";
  ALTER TABLE "carts" DROP COLUMN "applied_gift_card_code";
  ALTER TABLE "carts" DROP COLUMN "coupon_discount_amount";
  ALTER TABLE "carts" DROP COLUMN "gift_card_amount_applied";
  ALTER TABLE "orders" DROP COLUMN "payment_method";
  ALTER TABLE "orders" DROP COLUMN "discounts_applied";
  ALTER TABLE "orders" DROP COLUMN "coupon_applied_code";
  ALTER TABLE "orders" DROP COLUMN "coupon_applied_discount_amount";
  ALTER TABLE "orders" DROP COLUMN "gift_card_applied_code";
  ALTER TABLE "orders" DROP COLUMN "gift_card_applied_amount_applied";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "coupons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gift_cards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stock_alerts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "return_requests_id";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_gstin";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_business_name";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_business_address";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_business_state";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_gst_rate_percent";
  DROP TYPE "public"."enum_coupons_type";
  DROP TYPE "public"."enum_coupons_currency";
  DROP TYPE "public"."enum_gift_cards_currency";
  DROP TYPE "public"."enum_gift_cards_status";
  DROP TYPE "public"."enum_return_requests_reason";
  DROP TYPE "public"."enum_return_requests_status";
  DROP TYPE "public"."enum_orders_payment_method";`)
}
