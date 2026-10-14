import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-product delivery time (min/max business days) with a store-wide
 * default in Site Settings → Shipping Charges, shown by
 * src/components/product/DeliveryEstimate.tsx in place of the previously
 * hardcoded "3–5 business days".
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "shipping_settings_delivery_min_days" numeric DEFAULT 3;
  ALTER TABLE "site_settings" ADD COLUMN "shipping_settings_delivery_max_days" numeric DEFAULT 5;
  ALTER TABLE "products" ADD COLUMN "delivery_min_days" numeric;
  ALTER TABLE "products" ADD COLUMN "delivery_max_days" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_delivery_min_days" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_delivery_max_days" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "shipping_settings_delivery_min_days";
  ALTER TABLE "site_settings" DROP COLUMN "shipping_settings_delivery_max_days";
  ALTER TABLE "products" DROP COLUMN "delivery_min_days";
  ALTER TABLE "products" DROP COLUMN "delivery_max_days";
  ALTER TABLE "_products_v" DROP COLUMN "version_delivery_min_days";
  ALTER TABLE "_products_v" DROP COLUMN "version_delivery_max_days";`)
}
