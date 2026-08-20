import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" ADD COLUMN "rewards_program" boolean DEFAULT false;
  ALTER TABLE "feature_flags" ADD COLUMN "free_shipping_banner" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" DROP COLUMN "rewards_program";
  ALTER TABLE "feature_flags" DROP COLUMN "free_shipping_banner";`)
}
