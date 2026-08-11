import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_tax_breakdown_tax_type" AS ENUM('intra-state', 'inter-state');
  ALTER TABLE "products" ADD COLUMN "weight_in_grams" numeric DEFAULT 50;
  ALTER TABLE "_products_v" ADD COLUMN "version_weight_in_grams" numeric DEFAULT 50;
  ALTER TABLE "orders" ADD COLUMN "courier_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipment_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_order_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_shipment_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_tax_type" "enum_orders_tax_breakdown_tax_type";
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_gst_rate_percent" numeric;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_taxable_value" numeric;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_cgst_amount" numeric;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_sgst_amount" numeric;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_igst_amount" numeric;
  ALTER TABLE "orders" ADD COLUMN "tax_breakdown_total_tax" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "weight_in_grams";
  ALTER TABLE "_products_v" DROP COLUMN "version_weight_in_grams";
  ALTER TABLE "orders" DROP COLUMN "courier_name";
  ALTER TABLE "orders" DROP COLUMN "shipment_status";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_order_id";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_shipment_id";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_tax_type";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_gst_rate_percent";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_taxable_value";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_cgst_amount";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_sgst_amount";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_igst_amount";
  ALTER TABLE "orders" DROP COLUMN "tax_breakdown_total_tax";
  DROP TYPE "public"."enum_orders_tax_breakdown_tax_type";`)
}
