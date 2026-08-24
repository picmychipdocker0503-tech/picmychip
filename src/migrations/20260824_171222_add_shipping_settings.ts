import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "shipping_settings_standard_shipping_rate" numeric DEFAULT 200;
  ALTER TABLE "site_settings" ADD COLUMN "shipping_settings_express_shipping_rate" numeric DEFAULT 300;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "shipping_settings_standard_shipping_rate";
  ALTER TABLE "site_settings" DROP COLUMN "shipping_settings_express_shipping_rate";`)
}
