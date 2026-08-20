import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar;
    ALTER TABLE "orders" ADD COLUMN "shipping_amount" numeric;
    ALTER TABLE "transactions" ADD COLUMN "shipping_method" varchar;
    ALTER TABLE "transactions" ADD COLUMN "shipping_amount" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN "shipping_method";
    ALTER TABLE "orders" DROP COLUMN "shipping_amount";
    ALTER TABLE "transactions" DROP COLUMN "shipping_method";
    ALTER TABLE "transactions" DROP COLUMN "shipping_amount";
  `)
}
