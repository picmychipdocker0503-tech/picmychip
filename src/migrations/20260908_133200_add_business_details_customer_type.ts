import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Checkout's Individual/Company toggle — drives Zoho's GST treatment
 * (consumer vs business_gst/business_none) so an individual customer's
 * invoice shows "Individual" via Zoho's own consumer classification rather
 * than the previous always-business_none default. See
 * src/fields/businessDetails.ts and src/lib/zoho/customers.ts.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_business_details_customer_type" AS ENUM('individual', 'company');
  ALTER TABLE "orders" ADD COLUMN "business_details_customer_type" "enum_orders_business_details_customer_type" DEFAULT 'individual';
  CREATE TYPE "public"."enum_transactions_business_details_customer_type" AS ENUM('individual', 'company');
  ALTER TABLE "transactions" ADD COLUMN "business_details_customer_type" "enum_transactions_business_details_customer_type" DEFAULT 'individual';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "business_details_customer_type";
  DROP TYPE "public"."enum_orders_business_details_customer_type";
  ALTER TABLE "transactions" DROP COLUMN "business_details_customer_type";
  DROP TYPE "public"."enum_transactions_business_details_customer_type";`)
}
