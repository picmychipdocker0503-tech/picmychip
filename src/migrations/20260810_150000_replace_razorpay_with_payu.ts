import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Replaces the `transactions.razorpay` group (added when Stripe was swapped for Razorpay) with a
 * `transactions.payu` group, now that Razorpay is being replaced by PayU. Keeps 'stripe' and
 * 'razorpay' as legacy `payment_method` enum values (same safe precedent used in every payment
 * adapter swap this project has made — Postgres can't cheaply drop an enum value, and historical
 * orders paid via either provider should keep an accurate label rather than being renamed).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_transactions_payment_method" ADD VALUE IF NOT EXISTS 'payu';
  ALTER TABLE "transactions" ADD COLUMN "payu_txnid" varchar;
  ALTER TABLE "transactions" ADD COLUMN "payu_mihpayid" varchar;
  ALTER TABLE "transactions" ADD COLUMN "payu_status" varchar;
  ALTER TABLE "transactions" ADD COLUMN "payu_shipping_address_snapshot" jsonb;
  ALTER TABLE "transactions" DROP COLUMN "razorpay_order_i_d";
  ALTER TABLE "transactions" DROP COLUMN "razorpay_payment_i_d";
  ALTER TABLE "transactions" DROP COLUMN "razorpay_signature";
  ALTER TABLE "transactions" DROP COLUMN "razorpay_shipping_address_snapshot";
  CREATE INDEX "transactions_payu_txnid_idx" ON "transactions" USING btree ("payu_txnid");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "transactions_payu_txnid_idx";
  ALTER TABLE "transactions" ADD COLUMN "razorpay_order_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "razorpay_payment_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "razorpay_signature" varchar;
  ALTER TABLE "transactions" ADD COLUMN "razorpay_shipping_address_snapshot" jsonb;
  ALTER TABLE "transactions" DROP COLUMN "payu_txnid";
  ALTER TABLE "transactions" DROP COLUMN "payu_mihpayid";
  ALTER TABLE "transactions" DROP COLUMN "payu_status";
  ALTER TABLE "transactions" DROP COLUMN "payu_shipping_address_snapshot";`)
  // Postgres has no ALTER TYPE ... DROP VALUE — 'payu' intentionally stays in
  // enum_transactions_payment_method after rollback (harmless, unused).
}
