import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_id" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_number" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_status" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_amount" numeric;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_url" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "zoho_credit_note_created_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_number";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_status";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_amount";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_url";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "zoho_credit_note_created_at";
  `)
}
