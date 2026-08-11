import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "compare_at_price_in_i_n_r" numeric;
  ALTER TABLE "products" ADD COLUMN "compare_at_price_in_u_s_d" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_compare_at_price_in_i_n_r" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_compare_at_price_in_u_s_d" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "compare_at_price_in_i_n_r";
  ALTER TABLE "products" DROP COLUMN "compare_at_price_in_u_s_d";
  ALTER TABLE "_products_v" DROP COLUMN "version_compare_at_price_in_i_n_r";
  ALTER TABLE "_products_v" DROP COLUMN "version_compare_at_price_in_u_s_d";`)
}
