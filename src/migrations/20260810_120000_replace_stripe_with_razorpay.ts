import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_transactions_payment_method" ADD VALUE IF NOT EXISTS 'razorpay';
  ALTER TABLE "transactions" ADD COLUMN "razorpay_order_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "razorpay_payment_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "razorpay_signature" varchar;
  ALTER TABLE "transactions" ADD COLUMN "shipping_address_snapshot" jsonb;
  ALTER TABLE "transactions" DROP COLUMN "stripe_customer_i_d";
  ALTER TABLE "transactions" DROP COLUMN "stripe_payment_intent_i_d";
  CREATE INDEX "transactions_razorpay_order_i_d_idx" ON "transactions" USING btree ("razorpay_order_i_d");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "transactions_razorpay_order_i_d_idx";
  ALTER TABLE "transactions" ADD COLUMN "stripe_customer_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "stripe_payment_intent_i_d" varchar;
  ALTER TABLE "transactions" DROP COLUMN "razorpay_order_i_d";
  ALTER TABLE "transactions" DROP COLUMN "razorpay_payment_i_d";
  ALTER TABLE "transactions" DROP COLUMN "razorpay_signature";
  ALTER TABLE "transactions" DROP COLUMN "shipping_address_snapshot";`)
  // Postgres has no ALTER TYPE ... DROP VALUE — 'razorpay' intentionally stays in
  // enum_transactions_payment_method after rollback (harmless, unused).
}
