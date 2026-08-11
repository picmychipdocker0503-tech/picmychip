import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Postgres won't let a new enum value be used (e.g. in a DEFAULT clause) in
// the same transaction it was added in — this migration only adds the 'INR'
// enum values; the follow-up migration sets defaults and adds columns.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_carts_currency" ADD VALUE 'INR' BEFORE 'USD';
  ALTER TYPE "public"."enum_orders_currency" ADD VALUE 'INR' BEFORE 'USD';
  ALTER TYPE "public"."enum_transactions_currency" ADD VALUE 'INR' BEFORE 'USD';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_carts_currency";
  CREATE TYPE "public"."enum_carts_currency" AS ENUM('USD');
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_carts_currency";
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_carts_currency" USING "currency"::"public"."enum_carts_currency";
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_orders_currency";
  CREATE TYPE "public"."enum_orders_currency" AS ENUM('USD');
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_orders_currency";
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_orders_currency" USING "currency"::"public"."enum_orders_currency";
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_transactions_currency";
  CREATE TYPE "public"."enum_transactions_currency" AS ENUM('USD');
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_transactions_currency";
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_transactions_currency" USING "currency"::"public"."enum_transactions_currency";`)
}
