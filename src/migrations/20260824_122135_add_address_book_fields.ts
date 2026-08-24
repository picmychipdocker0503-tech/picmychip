import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_addresses_label" AS ENUM('Home', 'Office', 'Warehouse', 'Other');
  CREATE TYPE "public"."enum_addresses_gst_registration_type" AS ENUM('NORMAL', 'COMPOSITION');
  ALTER TABLE "addresses" ADD COLUMN "label" "public"."enum_addresses_label" DEFAULT 'Home';
  ALTER TABLE "addresses" ADD COLUMN "is_default_billing" boolean DEFAULT false;
  ALTER TABLE "addresses" ADD COLUMN "is_default_shipping" boolean DEFAULT false;
  ALTER TABLE "addresses" ADD COLUMN "is_active" boolean DEFAULT true;
  ALTER TABLE "addresses" ADD COLUMN "gst_registered" boolean DEFAULT false;
  ALTER TABLE "addresses" ADD COLUMN "gst_legal_name" varchar;
  ALTER TABLE "addresses" ADD COLUMN "gst_trade_name" varchar;
  ALTER TABLE "addresses" ADD COLUMN "gst_registration_type" "public"."enum_addresses_gst_registration_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addresses" DROP COLUMN "label";
  ALTER TABLE "addresses" DROP COLUMN "is_default_billing";
  ALTER TABLE "addresses" DROP COLUMN "is_default_shipping";
  ALTER TABLE "addresses" DROP COLUMN "is_active";
  ALTER TABLE "addresses" DROP COLUMN "gst_registered";
  ALTER TABLE "addresses" DROP COLUMN "gst_legal_name";
  ALTER TABLE "addresses" DROP COLUMN "gst_trade_name";
  ALTER TABLE "addresses" DROP COLUMN "gst_registration_type";
  DROP TYPE "public"."enum_addresses_label";
  DROP TYPE "public"."enum_addresses_gst_registration_type";`)
}
