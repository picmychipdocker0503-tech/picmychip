import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_sale_type" AS ENUM('percentage', 'fixed');
  CREATE TYPE "public"."enum__products_v_version_sale_type" AS ENUM('percentage', 'fixed');
  ALTER TABLE "products" ADD COLUMN "on_sale" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "sale_type" "enum_products_sale_type";
  ALTER TABLE "products" ADD COLUMN "discount_value" numeric;
  ALTER TABLE "products" ADD COLUMN "sale_price_in_i_n_r" numeric;
  ALTER TABLE "products" ADD COLUMN "sale_end_date" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "is_clearance" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "clearance_reason" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_on_sale" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_sale_type" "enum__products_v_version_sale_type";
  ALTER TABLE "_products_v" ADD COLUMN "version_discount_value" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_sale_price_in_i_n_r" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_sale_end_date" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_is_clearance" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_clearance_reason" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "on_sale";
  ALTER TABLE "products" DROP COLUMN "sale_type";
  ALTER TABLE "products" DROP COLUMN "discount_value";
  ALTER TABLE "products" DROP COLUMN "sale_price_in_i_n_r";
  ALTER TABLE "products" DROP COLUMN "sale_end_date";
  ALTER TABLE "products" DROP COLUMN "is_clearance";
  ALTER TABLE "products" DROP COLUMN "clearance_reason";
  ALTER TABLE "_products_v" DROP COLUMN "version_on_sale";
  ALTER TABLE "_products_v" DROP COLUMN "version_sale_type";
  ALTER TABLE "_products_v" DROP COLUMN "version_discount_value";
  ALTER TABLE "_products_v" DROP COLUMN "version_sale_price_in_i_n_r";
  ALTER TABLE "_products_v" DROP COLUMN "version_sale_end_date";
  ALTER TABLE "_products_v" DROP COLUMN "version_is_clearance";
  ALTER TABLE "_products_v" DROP COLUMN "version_clearance_reason";
  DROP TYPE "public"."enum_products_sale_type";
  DROP TYPE "public"."enum__products_v_version_sale_type";`)
}
