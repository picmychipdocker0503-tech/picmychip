import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "zoho_item_id" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_zoho_item_id" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "zoho_item_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_zoho_item_id";`)
}
