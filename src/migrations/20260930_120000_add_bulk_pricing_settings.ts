import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * DigiKey-style bulk pricing: a store-wide master switch + default %-off
 * price breaks on the feature-flags global, and a per-product mode
 * (default/custom/off) + manufacturer standard package quantity. See
 * getEffectivePriceTiers in src/lib/priceTiers.ts.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" ADD COLUMN "bulk_pricing" boolean DEFAULT true;
  CREATE TABLE "feature_flags_bulk_pricing_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min_quantity" numeric,
  	"discount_percent" numeric
  );
  ALTER TABLE "feature_flags_bulk_pricing_tiers" ADD CONSTRAINT "feature_flags_bulk_pricing_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "feature_flags_bulk_pricing_tiers_order_idx" ON "feature_flags_bulk_pricing_tiers" USING btree ("_order");
  CREATE INDEX "feature_flags_bulk_pricing_tiers_parent_id_idx" ON "feature_flags_bulk_pricing_tiers" USING btree ("_parent_id");
  CREATE TYPE "public"."enum_products_bulk_pricing_mode" AS ENUM('default', 'custom', 'off');
  CREATE TYPE "public"."enum__products_v_version_bulk_pricing_mode" AS ENUM('default', 'custom', 'off');
  ALTER TABLE "products" ADD COLUMN "bulk_pricing_mode" "enum_products_bulk_pricing_mode" DEFAULT 'default';
  ALTER TABLE "products" ADD COLUMN "standard_pack_quantity" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_bulk_pricing_mode" "enum__products_v_version_bulk_pricing_mode" DEFAULT 'default';
  ALTER TABLE "_products_v" ADD COLUMN "version_standard_pack_quantity" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "feature_flags_bulk_pricing_tiers" CASCADE;
  ALTER TABLE "feature_flags" DROP COLUMN "bulk_pricing";
  ALTER TABLE "products" DROP COLUMN "bulk_pricing_mode";
  ALTER TABLE "products" DROP COLUMN "standard_pack_quantity";
  ALTER TABLE "_products_v" DROP COLUMN "version_bulk_pricing_mode";
  ALTER TABLE "_products_v" DROP COLUMN "version_standard_pack_quantity";
  DROP TYPE "public"."enum_products_bulk_pricing_mode";
  DROP TYPE "public"."enum__products_v_version_bulk_pricing_mode";`)
}
