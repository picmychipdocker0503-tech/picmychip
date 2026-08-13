import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_invoice_sync_status" AS ENUM('pending', 'processing', 'completed', 'failed');
  CREATE TYPE "public"."enum_orders_shipment_sync_status" AS ENUM('pending', 'processing', 'completed', 'failed');
  CREATE TYPE "public"."enum_site_settings_tax_settings_business_state" AS ENUM('Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal');
  ALTER TABLE "site_settings" ALTER COLUMN "tax_settings_business_state" SET DATA TYPE "public"."enum_site_settings_tax_settings_business_state" USING "tax_settings_business_state"::"public"."enum_site_settings_tax_settings_business_state";
  ALTER TABLE "users" ADD COLUMN "zoho_customer_id" varchar;
  ALTER TABLE "products" ADD COLUMN "sku" varchar;
  ALTER TABLE "products" ADD COLUMN "hsn_code" varchar;
  ALTER TABLE "products" ADD COLUMN "gst_percent" numeric DEFAULT 18;
  ALTER TABLE "_products_v" ADD COLUMN "version_sku" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_hsn_code" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_gst_percent" numeric DEFAULT 18;
  ALTER TABLE "orders" ADD COLUMN "billing_address_title" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_first_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_last_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_company" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_address_line1" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_address_line2" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_city" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_state" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_postal_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_country" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_phone" varchar;
  ALTER TABLE "orders" ADD COLUMN "business_details_company_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "business_details_gstin" varchar;
  ALTER TABLE "orders" ADD COLUMN "business_details_pan_number" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_customer_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_invoice_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_invoice_number" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_invoice_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_invoice_url" varchar;
  ALTER TABLE "orders" ADD COLUMN "zoho_invoice_created_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_tracking_url" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_pickup_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_delivery_status" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_estimated_delivery_date" varchar;
  ALTER TABLE "orders" ADD COLUMN "shiprocket_created_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "invoice_sync_status" "enum_orders_invoice_sync_status" DEFAULT 'pending';
  ALTER TABLE "orders" ADD COLUMN "shipment_sync_status" "enum_orders_shipment_sync_status" DEFAULT 'pending';
  ALTER TABLE "orders" ADD COLUMN "integration_error_invoice" varchar;
  ALTER TABLE "orders" ADD COLUMN "integration_error_shipment" varchar;
  ALTER TABLE "orders" ADD COLUMN "last_sync_at" timestamp(3) with time zone;
  ALTER TABLE "transactions" ADD COLUMN "business_details_company_name" varchar;
  ALTER TABLE "transactions" ADD COLUMN "business_details_gstin" varchar;
  ALTER TABLE "transactions" ADD COLUMN "business_details_pan_number" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tax_settings_business_pan" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "tax_settings_business_state" SET DATA TYPE varchar;
  ALTER TABLE "users" DROP COLUMN "zoho_customer_id";
  ALTER TABLE "products" DROP COLUMN "sku";
  ALTER TABLE "products" DROP COLUMN "hsn_code";
  ALTER TABLE "products" DROP COLUMN "gst_percent";
  ALTER TABLE "_products_v" DROP COLUMN "version_sku";
  ALTER TABLE "_products_v" DROP COLUMN "version_hsn_code";
  ALTER TABLE "_products_v" DROP COLUMN "version_gst_percent";
  ALTER TABLE "orders" DROP COLUMN "billing_address_title";
  ALTER TABLE "orders" DROP COLUMN "billing_address_first_name";
  ALTER TABLE "orders" DROP COLUMN "billing_address_last_name";
  ALTER TABLE "orders" DROP COLUMN "billing_address_company";
  ALTER TABLE "orders" DROP COLUMN "billing_address_address_line1";
  ALTER TABLE "orders" DROP COLUMN "billing_address_address_line2";
  ALTER TABLE "orders" DROP COLUMN "billing_address_city";
  ALTER TABLE "orders" DROP COLUMN "billing_address_state";
  ALTER TABLE "orders" DROP COLUMN "billing_address_postal_code";
  ALTER TABLE "orders" DROP COLUMN "billing_address_country";
  ALTER TABLE "orders" DROP COLUMN "billing_address_phone";
  ALTER TABLE "orders" DROP COLUMN "business_details_company_name";
  ALTER TABLE "orders" DROP COLUMN "business_details_gstin";
  ALTER TABLE "orders" DROP COLUMN "business_details_pan_number";
  ALTER TABLE "orders" DROP COLUMN "zoho_customer_id";
  ALTER TABLE "orders" DROP COLUMN "zoho_invoice_id";
  ALTER TABLE "orders" DROP COLUMN "zoho_invoice_number";
  ALTER TABLE "orders" DROP COLUMN "zoho_invoice_status";
  ALTER TABLE "orders" DROP COLUMN "zoho_invoice_url";
  ALTER TABLE "orders" DROP COLUMN "zoho_invoice_created_at";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_tracking_url";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_pickup_status";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_delivery_status";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_estimated_delivery_date";
  ALTER TABLE "orders" DROP COLUMN "shiprocket_created_at";
  ALTER TABLE "orders" DROP COLUMN "invoice_sync_status";
  ALTER TABLE "orders" DROP COLUMN "shipment_sync_status";
  ALTER TABLE "orders" DROP COLUMN "integration_error_invoice";
  ALTER TABLE "orders" DROP COLUMN "integration_error_shipment";
  ALTER TABLE "orders" DROP COLUMN "last_sync_at";
  ALTER TABLE "transactions" DROP COLUMN "business_details_company_name";
  ALTER TABLE "transactions" DROP COLUMN "business_details_gstin";
  ALTER TABLE "transactions" DROP COLUMN "business_details_pan_number";
  ALTER TABLE "site_settings" DROP COLUMN "tax_settings_business_pan";
  DROP TYPE "public"."enum_orders_invoice_sync_status";
  DROP TYPE "public"."enum_orders_shipment_sync_status";
  DROP TYPE "public"."enum_site_settings_tax_settings_business_state";`)
}
