import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_contact_info" ADD COLUMN "map_query" varchar;
  ALTER TABLE "_pages_v_blocks_contact_info" ADD COLUMN "map_query" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_contact_info" DROP COLUMN "map_query";
  ALTER TABLE "_pages_v_blocks_contact_info" DROP COLUMN "map_query";`)
}
