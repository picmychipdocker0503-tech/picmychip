import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds Zoho Payments as a second `transactions.paymentMethod` option alongside PayU (see
 * src/payments/zoho/), following the same shape as the payu columns added in
 * 20260810_150000_replace_razorpay_with_payu.ts — 'zoho' stays in the payment_method enum
 * permanently (Postgres can't cheaply drop an enum value) even if this gateway is ever removed.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_transactions_payment_method" ADD VALUE IF NOT EXISTS 'zoho';
  ALTER TABLE "transactions" ADD COLUMN "zoho_payments_session_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zoho_payment_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zoho_status" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zoho_shipping_address_snapshot" jsonb;
  CREATE INDEX "transactions_zoho_payments_session_i_d_idx" ON "transactions" USING btree ("zoho_payments_session_i_d");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "transactions_zoho_payments_session_i_d_idx";
  ALTER TABLE "transactions" DROP COLUMN "zoho_payments_session_i_d";
  ALTER TABLE "transactions" DROP COLUMN "zoho_payment_i_d";
  ALTER TABLE "transactions" DROP COLUMN "zoho_status";
  ALTER TABLE "transactions" DROP COLUMN "zoho_shipping_address_snapshot";`)
  // Postgres has no ALTER TYPE ... DROP VALUE — 'zoho' intentionally stays in
  // enum_transactions_payment_method after rollback (harmless, unused).
}
