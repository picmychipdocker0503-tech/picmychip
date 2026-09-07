import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Lets Tawk chat business hours (guest add-to-cart popup + Slack alert gate)
 * be edited from the admin instead of hardcoded — see
 * src/globals/SiteSettings.ts's tawkBusinessHours group.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "tawk_business_hours_start_time" varchar DEFAULT '09:00';
  ALTER TABLE "site_settings" ADD COLUMN "tawk_business_hours_end_time" varchar DEFAULT '18:30';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "tawk_business_hours_start_time";
  ALTER TABLE "site_settings" DROP COLUMN "tawk_business_hours_end_time";`)
}
