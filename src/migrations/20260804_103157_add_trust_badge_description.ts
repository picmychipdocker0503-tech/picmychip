import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// media.prefix and datasheets.prefix were dropped from this migration — pre-existing
// drift meant those columns already exist in the DB (not related to this change).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_trust_badges_strip_badges" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v_blocks_trust_badges_strip_badges" ADD COLUMN "description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_trust_badges_strip_badges" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_trust_badges_strip_badges" DROP COLUMN "description";`)
}
