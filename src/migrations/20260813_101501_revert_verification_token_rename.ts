import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Corrects a mistake in the immediately-preceding migration
 * (20260813_043522_fix_users_verify_column): it renamed `_verificationtoken` to
 * `_verification_token`, assuming Payload's Postgres adapter snake-cases the `_verificationToken`
 * auth field the same way it does ordinary camelCase fields (e.g. `resetPasswordToken` ->
 * `reset_password_token`).
 *
 * That assumption was wrong. Confirmed directly against a live query Payload's ORM generates
 * for the `users` collection (`select ... "users"."_verificationtoken" ...`) — the adapter's
 * name-generation for this specific built-in auth field produces `_verificationtoken`, with no
 * underscore before "token". The rename broke every users query all over again, just via the
 * opposite mismatch. Renaming back to match what the running application actually queries for.
 *
 * The `_verified` backfill from that same migration was correct and is left in place.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" RENAME COLUMN "_verification_token" TO "_verificationtoken";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" RENAME COLUMN "_verificationtoken" TO "_verification_token";`)
}
