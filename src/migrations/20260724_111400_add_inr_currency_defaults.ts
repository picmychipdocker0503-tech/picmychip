import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'INR';
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'INR';
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'INR';
  ALTER TABLE "variants" ADD COLUMN "price_in_i_n_r_enabled" boolean;
  ALTER TABLE "variants" ADD COLUMN "price_in_i_n_r" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_i_n_r_enabled" boolean;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_i_n_r" numeric;
  ALTER TABLE "products" ADD COLUMN "price_in_i_n_r_enabled" boolean;
  ALTER TABLE "products" ADD COLUMN "price_in_i_n_r" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_i_n_r_enabled" boolean;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_i_n_r" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "variants" DROP COLUMN "price_in_i_n_r_enabled";
  ALTER TABLE "variants" DROP COLUMN "price_in_i_n_r";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_i_n_r_enabled";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_i_n_r";
  ALTER TABLE "products" DROP COLUMN "price_in_i_n_r_enabled";
  ALTER TABLE "products" DROP COLUMN "price_in_i_n_r";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_i_n_r_enabled";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_i_n_r";`)
}
