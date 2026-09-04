import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds an explicit, admin-entered maxQuantity to price tiers (src/fields/priceTiers.ts) so the
 * range shows explicitly in admin and on the product page, instead of only being inferred from
 * the next tier's minQuantity. Display-only — the price actually charged at checkout still
 * resolves purely from minQuantity (see src/lib/priceTiers.ts), so this can be left blank without
 * creating a pricing gap.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_price_tiers" ADD COLUMN "max_quantity" numeric;
  ALTER TABLE "variants_price_tiers" ADD COLUMN "max_quantity" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_price_tiers" DROP COLUMN "max_quantity";
  ALTER TABLE "variants_price_tiers" DROP COLUMN "max_quantity";`)
}
