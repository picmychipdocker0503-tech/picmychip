import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");
  CREATE INDEX "products_stock_status_idx" ON "products" USING btree ("stock_status");
  CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");
  CREATE INDEX "products_on_sale_idx" ON "products" USING btree ("on_sale");
  CREATE INDEX "products_is_clearance_idx" ON "products" USING btree ("is_clearance");
  CREATE INDEX "products_is_gift_card_idx" ON "products" USING btree ("is_gift_card");
  CREATE INDEX "products_price_in_i_n_r_idx" ON "products" USING btree ("price_in_i_n_r");
  CREATE INDEX "_products_v_version_version_featured_idx" ON "_products_v" USING btree ("version_featured");
  CREATE INDEX "_products_v_version_version_stock_status_idx" ON "_products_v" USING btree ("version_stock_status");
  CREATE INDEX "_products_v_version_version_sku_idx" ON "_products_v" USING btree ("version_sku");
  CREATE INDEX "_products_v_version_version_on_sale_idx" ON "_products_v" USING btree ("version_on_sale");
  CREATE INDEX "_products_v_version_version_is_clearance_idx" ON "_products_v" USING btree ("version_is_clearance");
  CREATE INDEX "_products_v_version_version_is_gift_card_idx" ON "_products_v" USING btree ("version_is_gift_card");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_featured_idx";
  DROP INDEX "products_stock_status_idx";
  DROP INDEX "products_sku_idx";
  DROP INDEX "products_on_sale_idx";
  DROP INDEX "products_is_clearance_idx";
  DROP INDEX "products_is_gift_card_idx";
  DROP INDEX "products_price_in_i_n_r_idx";
  DROP INDEX "_products_v_version_version_featured_idx";
  DROP INDEX "_products_v_version_version_stock_status_idx";
  DROP INDEX "_products_v_version_version_sku_idx";
  DROP INDEX "_products_v_version_version_on_sale_idx";
  DROP INDEX "_products_v_version_version_is_clearance_idx";
  DROP INDEX "_products_v_version_version_is_gift_card_idx";`)
}
