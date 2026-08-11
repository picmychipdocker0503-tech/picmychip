import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" ALTER COLUMN "newsletter_heading" SET DEFAULT 'Don''t Miss Out Latest Trends & Offers';
  ALTER TABLE "footer" ALTER COLUMN "newsletter_copy" SET DEFAULT 'Register to receive news about the latest offers & discount codes';
  ALTER TABLE "orders" ADD COLUMN "flagged_for_review" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "flag_reason" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" ALTER COLUMN "newsletter_heading" SET DEFAULT 'Subscribe to our Newsletter';
  ALTER TABLE "footer" ALTER COLUMN "newsletter_copy" SET DEFAULT 'Get 10% off your first order';
  ALTER TABLE "orders" DROP COLUMN "flagged_for_review";
  ALTER TABLE "orders" DROP COLUMN "flag_reason";`)
}
