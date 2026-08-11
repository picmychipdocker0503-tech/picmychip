import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "compare_at_price" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_compare_at_price" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "compare_at_price";
  ALTER TABLE "_products_v" DROP COLUMN "version_compare_at_price";`)
}
