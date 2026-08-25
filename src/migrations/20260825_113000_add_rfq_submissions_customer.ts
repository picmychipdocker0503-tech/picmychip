import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rfq_submissions" ADD COLUMN "customer_id" integer;
  ALTER TABLE "rfq_submissions" ADD CONSTRAINT "rfq_submissions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "rfq_submissions_customer_idx" ON "rfq_submissions" USING btree ("customer_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rfq_submissions" DROP CONSTRAINT "rfq_submissions_customer_id_users_id_fk";
  DROP INDEX "rfq_submissions_customer_idx";
  ALTER TABLE "rfq_submissions" DROP COLUMN "customer_id";`)
}
