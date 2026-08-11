import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Drops the USD price columns the ecommerce plugin generated for Products/Variants (and their
 * draft/version tables) now that the store is INR-only, and renames the `priceTiers` sub-field
 * from `priceInUSD` to `priceInINR` (it had no INR counterpart at all before this).
 *
 * The `currency` enums on carts/orders/transactions/coupons/gift-cards intentionally keep 'USD'
 * as a legacy Postgres enum value (same safe precedent as the earlier Stripe→Razorpay migration
 * and this project's own `20260724_111250_add_inr_currency_support` migration) — Postgres can't
 * cheaply drop an enum value, and no live rows use it, so it's simply removed from the Payload
 * field `options` (already done in config) rather than the database type.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "price_in_u_s_d_enabled";
  ALTER TABLE "products" DROP COLUMN "price_in_u_s_d";
  ALTER TABLE "products" DROP COLUMN "compare_at_price_in_u_s_d";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_u_s_d_enabled";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_u_s_d";
  ALTER TABLE "_products_v" DROP COLUMN "version_compare_at_price_in_u_s_d";
  ALTER TABLE "variants" DROP COLUMN "price_in_u_s_d_enabled";
  ALTER TABLE "variants" DROP COLUMN "price_in_u_s_d";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_u_s_d_enabled";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_u_s_d";
  ALTER TABLE "products_price_tiers" RENAME COLUMN "price_in_u_s_d" TO "price_in_i_n_r";
  ALTER TABLE "_products_v_version_price_tiers" RENAME COLUMN "price_in_u_s_d" TO "price_in_i_n_r";
  ALTER TABLE "variants_price_tiers" RENAME COLUMN "price_in_u_s_d" TO "price_in_i_n_r";
  ALTER TABLE "_variants_v_version_price_tiers" RENAME COLUMN "price_in_u_s_d" TO "price_in_i_n_r";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_price_tiers" RENAME COLUMN "price_in_i_n_r" TO "price_in_u_s_d";
  ALTER TABLE "_products_v_version_price_tiers" RENAME COLUMN "price_in_i_n_r" TO "price_in_u_s_d";
  ALTER TABLE "variants_price_tiers" RENAME COLUMN "price_in_i_n_r" TO "price_in_u_s_d";
  ALTER TABLE "_variants_v_version_price_tiers" RENAME COLUMN "price_in_i_n_r" TO "price_in_u_s_d";
  ALTER TABLE "products" ADD COLUMN "price_in_u_s_d_enabled" boolean;
  ALTER TABLE "products" ADD COLUMN "price_in_u_s_d" numeric;
  ALTER TABLE "products" ADD COLUMN "compare_at_price_in_u_s_d" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_u_s_d_enabled" boolean;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_u_s_d" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_compare_at_price_in_u_s_d" numeric;
  ALTER TABLE "variants" ADD COLUMN "price_in_u_s_d_enabled" boolean;
  ALTER TABLE "variants" ADD COLUMN "price_in_u_s_d" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_u_s_d_enabled" boolean;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_u_s_d" numeric;`)
}
