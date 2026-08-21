import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_exclude_from_feed" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_google_product_category" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_gtin" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_mpn" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_condition" varchar DEFAULT 'new';
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_custom_label0" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_custom_label1" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_custom_label2" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_custom_label3" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "google_merchant_custom_label4" varchar;

    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_exclude_from_feed" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_google_product_category" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_gtin" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_mpn" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_condition" varchar DEFAULT 'new';
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_custom_label0" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_custom_label1" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_custom_label2" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_custom_label3" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_google_merchant_custom_label4" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_exclude_from_feed";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_google_product_category";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_gtin";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_mpn";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_condition";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_custom_label0";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_custom_label1";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_custom_label2";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_custom_label3";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "google_merchant_custom_label4";

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_exclude_from_feed";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_google_product_category";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_gtin";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_mpn";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_condition";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_custom_label0";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_custom_label1";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_custom_label2";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_custom_label3";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_google_merchant_custom_label4";
  `)
}
