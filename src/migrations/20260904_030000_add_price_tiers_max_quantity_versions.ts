import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Follow-up to 20260904_020000_add_price_tiers_max_quantity.ts — that migration added
 * max_quantity to products_price_tiers/variants_price_tiers but missed the parallel
 * versions/drafts tables Payload maintains for collections with drafts enabled
 * (_products_v_version_price_tiers, _variants_v_version_price_tiers). Their schema drifting
 * from the live tables broke every query against a product's version state — including just
 * opening the product edit page in admin.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_products_v_version_price_tiers" ADD COLUMN "max_quantity" numeric;
  ALTER TABLE "_variants_v_version_price_tiers" ADD COLUMN "max_quantity" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_products_v_version_price_tiers" DROP COLUMN "max_quantity";
  ALTER TABLE "_variants_v_version_price_tiers" DROP COLUMN "max_quantity";`)
}
