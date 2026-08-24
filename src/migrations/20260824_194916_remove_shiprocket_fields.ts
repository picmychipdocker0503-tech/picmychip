import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" RENAME COLUMN "shiprocket_tracking_url" TO "courier_tracking_url";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_order_id";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_shipment_id";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_pickup_status";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_delivery_status";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_estimated_delivery_date";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_created_at";
  ALTER TABLE "orders" DROP COLUMN "shipment_sync_status";
  ALTER TABLE "orders" DROP COLUMN "integration_error_shipment";
  DROP TYPE IF EXISTS "public"."enum_orders_shipment_sync_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_shipment_sync_status" AS ENUM('pending', 'processing', 'completed', 'failed');
  ALTER TABLE "orders" RENAME COLUMN "courier_tracking_url" TO "shiprocket_tracking_url";
  ALTER TABLE "orders" ADD COLUMN "shiprocket_order_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_shipment_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_pickup_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_delivery_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_estimated_delivery_date" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_created_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "shipment_sync_status" "enum_orders_shipment_sync_status" DEFAULT 'pending';
  ALTER TABLE "orders" ADD COLUMN "integration_error_shipment" varchar;`)
}
