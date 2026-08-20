import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "team_testimonials" ADD COLUMN "linked_user_id" integer;
  ALTER TABLE "team_testimonials" ADD CONSTRAINT "team_testimonials_linked_user_id_users_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "team_testimonials_linked_user_idx" ON "team_testimonials" USING btree ("linked_user_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "team_testimonials" DROP CONSTRAINT "team_testimonials_linked_user_id_users_id_fk";
  DROP INDEX "team_testimonials_linked_user_idx";
  ALTER TABLE "team_testimonials" DROP COLUMN "linked_user_id";`)
}
