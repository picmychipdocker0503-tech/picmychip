import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fixes 20260811_180000_add_users_verify, which shipped with two bugs that blocked every
 * existing user (including admins) from logging in once `auth.verify` was enabled on `users`:
 *
 * 1. It created `_verificationtoken` but Payload's Postgres adapter generates SQL against
 *    `_verification_token` (matching this schema's established camelCase -> snake_case
 *    convention elsewhere, e.g. `resetPasswordToken` -> `reset_password_token`) — any query
 *    touching that field threw "column does not exist".
 * 2. It left `_verified` NULL on all pre-existing rows with no default/backfill. Payload
 *    treats NULL as unverified and rejects login, and since SMTP isn't configured yet,
 *    verification emails are only logged, never sent — leaving no self-serve way to unblock.
 *
 * Hand-written (not `migrate:create`-generated): this repo is missing the drizzle snapshots
 * for both 20260811_180000_add_users_verify and 20260811_190000_add_jobs_collection (only
 * their .ts files exist), so the auto-generated diff used a stale baseline and tried to
 * recreate the already-applied `jobs` tables and re-add the same broken column name.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" RENAME COLUMN "_verificationtoken" TO "_verification_token";
  UPDATE "users" SET "_verified" = true WHERE "_verified" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" RENAME COLUMN "_verification_token" TO "_verificationtoken";`)
}
