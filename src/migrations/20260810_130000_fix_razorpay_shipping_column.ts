import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Corrective migration — the previous migration (20260810_120000) created this column
 * without the `razorpay_` group prefix that Payload's Postgres adapter actually expects
 * for a sub-field of the `razorpay` group field (see `razorpay_order_i_d`, matching the
 * `stripe_customer_i_d` prefixing convention it replaced). Any query touching the full
 * `transactions` row was erroring with "column transactions.razorpay_shipping_address_snapshot
 * does not exist".
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "transactions" RENAME COLUMN "shipping_address_snapshot" TO "razorpay_shipping_address_snapshot";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "transactions" RENAME COLUMN "razorpay_shipping_address_snapshot" TO "shipping_address_snapshot";`)
}
