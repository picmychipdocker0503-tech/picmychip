import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_theme_preference" AS ENUM('light', 'dark', 'high-contrast', 'midnight', 'warm', 'ocean', 'circuit', 'sunset', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'caramellatte', 'abyss', 'silk');
  ALTER TABLE "users" ADD COLUMN "theme_preference" "enum_users_theme_preference";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "theme_preference";
  DROP TYPE "public"."enum_users_theme_preference";`)
}
