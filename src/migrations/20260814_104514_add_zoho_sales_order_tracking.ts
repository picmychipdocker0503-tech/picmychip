import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_sales_order_sync_status" AS ENUM('pending', 'processing', 'completed', 'failed');
  ALTER TABLE "orders" ADD COLUMN "zoho_sales_order_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_sales_order_number" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_sales_order_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "sales_order_sync_status" "enum_orders_sales_order_sync_status" DEFAULT 'pending';
  ALTER TABLE "orders" ADD COLUMN "integration_error_sales_order" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "zoho_sales_order_id";
  ALTER TABLE "orders" DROP COLUMN "zoho_sales_order_number";
  ALTER TABLE "orders" DROP COLUMN "zoho_sales_order_status";
  ALTER TABLE "orders" DROP COLUMN "sales_order_sync_status";
  ALTER TABLE "orders" DROP COLUMN "integration_error_sales_order";
  DROP TYPE "public"."enum_orders_sales_order_sync_status";`)
}
