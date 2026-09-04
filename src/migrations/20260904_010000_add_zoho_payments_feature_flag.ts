import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gates the Zoho Payments checkout option behind the `feature-flags` global
 * (see src/globals/FeatureFlags.ts), same as cashOnDelivery — defaults off
 * until ZOHO_PAYMENTS_ACCOUNT_ID/API_KEY/CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN
 * are actually set, so customers never see a payment option that can't work yet.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" ADD COLUMN "zoho_payments" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" DROP COLUMN "zoho_payments";`)
}
