import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * New Couriers reference collection + converts Orders' courierName from a
 * free-typed text field to a relationship (admin dropdown), and
 * shipmentStatus from free text to a select — see src/collections/Couriers.ts
 * and src/plugins/index.ts. Drops the old free-text courier_name/
 * shipment_status columns rather than attempting to cast existing values
 * (some may not match the new enum, and a courier name has no id to map to
 * yet) — any orders with those fields already set will need them re-picked
 * from the new dropdowns.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_shipment_status" AS ENUM('picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'delayed', 'failed-delivery-attempt', 'returned-to-origin');
  CREATE TABLE "couriers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tracking_url_template" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "orders" DROP COLUMN "courier_name";
  ALTER TABLE "orders" DROP COLUMN "shipment_status";
  ALTER TABLE "orders" ADD COLUMN "courier_name_id" integer;
  ALTER TABLE "orders" ADD COLUMN "shipment_status" "enum_orders_shipment_status";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "couriers_id" integer;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_courier_name_id_couriers_id_fk" FOREIGN KEY ("courier_name_id") REFERENCES "public"."couriers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_couriers_fk" FOREIGN KEY ("couriers_id") REFERENCES "public"."couriers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "couriers_name_idx" ON "couriers" USING btree ("name");
  CREATE INDEX "couriers_updated_at_idx" ON "couriers" USING btree ("updated_at");
  CREATE INDEX "couriers_created_at_idx" ON "couriers" USING btree ("created_at");
  CREATE INDEX "orders_courier_name_idx" ON "orders" USING btree ("courier_name_id");
  CREATE INDEX "payload_locked_documents_rels_couriers_id_idx" ON "payload_locked_documents_rels" USING btree ("couriers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "couriers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "couriers" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_courier_name_id_couriers_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_couriers_fk";

  DROP INDEX "orders_courier_name_idx";
  DROP INDEX "payload_locked_documents_rels_couriers_id_idx";
  ALTER TABLE "orders" DROP COLUMN "courier_name_id";
  ALTER TABLE "orders" DROP COLUMN "shipment_status";
  ALTER TABLE "orders" ADD COLUMN "courier_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipment_status" varchar;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "couriers_id";
  DROP TYPE "public"."enum_orders_shipment_status";`)
}
