import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "office_address_street_address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "office_address_address_locality" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "office_address_address_region" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "office_address_postal_code" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "office_address_address_country" varchar DEFAULT 'IN';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "office_address_street_address";
  ALTER TABLE "site_settings" DROP COLUMN "office_address_address_locality";
  ALTER TABLE "site_settings" DROP COLUMN "office_address_address_region";
  ALTER TABLE "site_settings" DROP COLUMN "office_address_postal_code";
  ALTER TABLE "site_settings" DROP COLUMN "office_address_address_country";`)
}
