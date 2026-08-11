import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_return_requests_refund_status" AS ENUM('not-applicable', 'processed', 'failed', 'manual-required');
  ALTER TABLE "return_requests" ADD COLUMN "refund_amount" numeric;
  ALTER TABLE "return_requests" ADD COLUMN "refund_status" "enum_return_requests_refund_status" DEFAULT 'not-applicable';
  ALTER TABLE "return_requests" ADD COLUMN "refund_note" varchar;
  ALTER TABLE "carts" ADD COLUMN "abandoned_recovery_email_sent_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "return_requests" DROP COLUMN "refund_amount";
  ALTER TABLE "return_requests" DROP COLUMN "refund_status";
  ALTER TABLE "return_requests" DROP COLUMN "refund_note";
  ALTER TABLE "carts" DROP COLUMN "abandoned_recovery_email_sent_at";
  DROP TYPE "public"."enum_return_requests_refund_status";`)
}
