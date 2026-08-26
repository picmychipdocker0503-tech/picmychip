import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "order_number_settings_prefix" varchar DEFAULT 'ECOM';
  ALTER TABLE "site_settings" ADD COLUMN "order_number_settings_padding" numeric DEFAULT 4;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "order_number_settings_prefix";
  ALTER TABLE "site_settings" DROP COLUMN "order_number_settings_padding";`)
}
