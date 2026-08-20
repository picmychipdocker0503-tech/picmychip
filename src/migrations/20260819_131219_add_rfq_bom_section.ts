import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_rfq_bom_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar DEFAULT 'Instant Sourcing Hub',
  	"heading" varchar DEFAULT 'Upload Your BOM. Sit Back. Get the Best Deal!',
  	"subtitle" varchar DEFAULT 'Upload a BOM or enter parts manually — we auto-match each line against live inventory, check stock in real time, and roll up target pricing across your full list.',
  	"bom_card_badge" varchar DEFAULT 'Instant Match',
  	"bom_card_title" varchar DEFAULT 'Bulk BOM Upload',
  	"bom_card_description" varchar DEFAULT 'Upload a spreadsheet (.xlsx, .xls, or .csv) with up to 200+ lines — MPN, quantity, and target price are auto-mapped.',
  	"rfq_card_badge" varchar DEFAULT 'Direct Entry',
  	"rfq_card_title" varchar DEFAULT 'Quick Multi-Line RFQ',
  	"rfq_card_description" varchar DEFAULT 'No file handy? Enter part number, manufacturer, quantity, and target lead time directly in a multi-row grid.',
  	"primary_link_url" varchar DEFAULT '/rfq?upload=1',
  	"primary_link_label" varchar DEFAULT 'Upload BOM (.xlsx / .csv)',
  	"secondary_link_url" varchar DEFAULT '/rfq#rfq-form',
  	"secondary_link_label" varchar DEFAULT 'Enter Manual RFQ Grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rfq_bom_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"badge" varchar DEFAULT 'Instant Sourcing Hub',
  	"heading" varchar DEFAULT 'Upload Your BOM. Sit Back. Get the Best Deal!',
  	"subtitle" varchar DEFAULT 'Upload a BOM or enter parts manually — we auto-match each line against live inventory, check stock in real time, and roll up target pricing across your full list.',
  	"bom_card_badge" varchar DEFAULT 'Instant Match',
  	"bom_card_title" varchar DEFAULT 'Bulk BOM Upload',
  	"bom_card_description" varchar DEFAULT 'Upload a spreadsheet (.xlsx, .xls, or .csv) with up to 200+ lines — MPN, quantity, and target price are auto-mapped.',
  	"rfq_card_badge" varchar DEFAULT 'Direct Entry',
  	"rfq_card_title" varchar DEFAULT 'Quick Multi-Line RFQ',
  	"rfq_card_description" varchar DEFAULT 'No file handy? Enter part number, manufacturer, quantity, and target lead time directly in a multi-row grid.',
  	"primary_link_url" varchar DEFAULT '/rfq?upload=1',
  	"primary_link_label" varchar DEFAULT 'Upload BOM (.xlsx / .csv)',
  	"secondary_link_url" varchar DEFAULT '/rfq#rfq-form',
  	"secondary_link_label" varchar DEFAULT 'Enter Manual RFQ Grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_rfq_bom_section" ADD CONSTRAINT "pages_blocks_rfq_bom_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rfq_bom_section" ADD CONSTRAINT "_pages_v_blocks_rfq_bom_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_rfq_bom_section_order_idx" ON "pages_blocks_rfq_bom_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_rfq_bom_section_parent_id_idx" ON "pages_blocks_rfq_bom_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rfq_bom_section_path_idx" ON "pages_blocks_rfq_bom_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rfq_bom_section_order_idx" ON "_pages_v_blocks_rfq_bom_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rfq_bom_section_parent_id_idx" ON "_pages_v_blocks_rfq_bom_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rfq_bom_section_path_idx" ON "_pages_v_blocks_rfq_bom_section" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_rfq_bom_section" CASCADE;
  DROP TABLE "_pages_v_blocks_rfq_bom_section" CASCADE;`)
}
