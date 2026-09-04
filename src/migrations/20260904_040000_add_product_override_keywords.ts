import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds Product.overrideKeywords (src/collections/Products/index.ts) — a plain boolean opting a
 * product out of the auto-synced SEO Keywords (populateKeywords.ts). Products has drafts
 * enabled, so both the live table and its parallel versions table (_products_v, prefixed
 * "version_" — same pattern as every other versioned field) need the column. Product.keywords
 * itself needs no migration: it's a hasMany text field, stored in Payload's already-existing
 * generic products_texts / _products_v_texts tables (keyed by `path`), not a dedicated column.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "override_keywords" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_override_keywords" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "override_keywords";
  ALTER TABLE "_products_v" DROP COLUMN "version_override_keywords";`)
}
