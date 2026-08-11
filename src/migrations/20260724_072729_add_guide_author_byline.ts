import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" ADD COLUMN "author_name" varchar;
  ALTER TABLE "guides" ADD COLUMN "author_title" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN "version_author_name" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN "version_author_title" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" DROP COLUMN "author_name";
  ALTER TABLE "guides" DROP COLUMN "author_title";
  ALTER TABLE "_guides_v" DROP COLUMN "version_author_name";
  ALTER TABLE "_guides_v" DROP COLUMN "version_author_title";`)
}
