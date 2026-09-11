import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds users.google_id — links a storefront account to a Google account for
 * "Sign in with Google" (src/collections/Users/endpoints/googleOAuthCallback.ts).
 * Nullable + unique: Postgres allows any number of NULLs under a unique
 * index, so password-only accounts (the majority) are unaffected.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "google_id" varchar;
  CREATE UNIQUE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_google_id_idx";
  ALTER TABLE "users" DROP COLUMN "google_id";`)
}
