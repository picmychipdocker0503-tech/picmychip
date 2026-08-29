import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "highlight_style_background_color" varchar DEFAULT '#fef9c3';
  ALTER TABLE "site_settings" ADD COLUMN "highlight_style_text_color" varchar DEFAULT '#713f12';
  ALTER TABLE "site_settings" ADD COLUMN "highlight_style_bold" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "highlight_style_background_color";
  ALTER TABLE "site_settings" DROP COLUMN "highlight_style_text_color";
  ALTER TABLE "site_settings" DROP COLUMN "highlight_style_bold";`)
}
