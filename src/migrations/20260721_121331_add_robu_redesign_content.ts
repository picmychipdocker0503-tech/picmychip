import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_featured_collection_panels_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_content_feed_filter_by" AS ENUM('all', 'article', 'video');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_collection_panels_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_content_feed_filter_by" AS ENUM('all', 'article', 'video');
  CREATE TYPE "public"."enum_footer_columns_links_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "pages_blocks_featured_collection_panels" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"heading" varchar,
  	"copy" varchar,
  	"link_type" "enum_pages_blocks_featured_collection_panels_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_collection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Tutorials',
  	"filter_by" "enum_pages_blocks_content_feed_filter_by" DEFAULT 'all',
  	"limit" numeric DEFAULT 4,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_collection_panels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"heading" varchar,
  	"copy" varchar,
  	"link_type" "enum__pages_v_blocks_featured_collection_panels_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_collection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Tutorials',
  	"filter_by" "enum__pages_v_blocks_content_feed_filter_by" DEFAULT 'all',
  	"limit" numeric DEFAULT 4,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_columns_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  ALTER TABLE "footer" ADD COLUMN "newsletter_heading" varchar DEFAULT 'Subscribe to our Newsletter';
  ALTER TABLE "footer" ADD COLUMN "newsletter_copy" varchar DEFAULT 'Get 10% off your first order';
  ALTER TABLE "site_settings" ADD COLUMN "support_phone" varchar;
  ALTER TABLE "pages_blocks_featured_collection_panels" ADD CONSTRAINT "pages_blocks_featured_collection_panels_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_collection_panels" ADD CONSTRAINT "pages_blocks_featured_collection_panels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_collection"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_collection" ADD CONSTRAINT "pages_blocks_featured_collection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_feed" ADD CONSTRAINT "pages_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_collection_panels" ADD CONSTRAINT "_pages_v_blocks_featured_collection_panels_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_collection_panels" ADD CONSTRAINT "_pages_v_blocks_featured_collection_panels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_collection"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_collection" ADD CONSTRAINT "_pages_v_blocks_featured_collection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_feed" ADD CONSTRAINT "_pages_v_blocks_content_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links" ADD CONSTRAINT "footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_featured_collection_panels_order_idx" ON "pages_blocks_featured_collection_panels" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_collection_panels_parent_id_idx" ON "pages_blocks_featured_collection_panels" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_collection_panels_image_idx" ON "pages_blocks_featured_collection_panels" USING btree ("image_id");
  CREATE INDEX "pages_blocks_featured_collection_order_idx" ON "pages_blocks_featured_collection" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_collection_parent_id_idx" ON "pages_blocks_featured_collection" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_collection_path_idx" ON "pages_blocks_featured_collection" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_feed_order_idx" ON "pages_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_feed_parent_id_idx" ON "pages_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_feed_path_idx" ON "pages_blocks_content_feed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_featured_collection_panels_order_idx" ON "_pages_v_blocks_featured_collection_panels" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_collection_panels_parent_id_idx" ON "_pages_v_blocks_featured_collection_panels" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_collection_panels_image_idx" ON "_pages_v_blocks_featured_collection_panels" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_featured_collection_order_idx" ON "_pages_v_blocks_featured_collection" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_collection_parent_id_idx" ON "_pages_v_blocks_featured_collection" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_collection_path_idx" ON "_pages_v_blocks_featured_collection" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_feed_order_idx" ON "_pages_v_blocks_content_feed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_feed_parent_id_idx" ON "_pages_v_blocks_content_feed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_feed_path_idx" ON "_pages_v_blocks_content_feed" USING btree ("_path");
  CREATE INDEX "footer_columns_links_order_idx" ON "footer_columns_links" USING btree ("_order");
  CREATE INDEX "footer_columns_links_parent_id_idx" ON "footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "footer_columns" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_featured_collection_panels" CASCADE;
  DROP TABLE "pages_blocks_featured_collection" CASCADE;
  DROP TABLE "pages_blocks_content_feed" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_collection_panels" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_collection" CASCADE;
  DROP TABLE "_pages_v_blocks_content_feed" CASCADE;
  DROP TABLE "footer_columns_links" CASCADE;
  DROP TABLE "footer_columns" CASCADE;
  ALTER TABLE "footer" DROP COLUMN "newsletter_heading";
  ALTER TABLE "footer" DROP COLUMN "newsletter_copy";
  ALTER TABLE "site_settings" DROP COLUMN "support_phone";
  DROP TYPE "public"."enum_pages_blocks_featured_collection_panels_link_type";
  DROP TYPE "public"."enum_pages_blocks_content_feed_filter_by";
  DROP TYPE "public"."enum__pages_v_blocks_featured_collection_panels_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_content_feed_filter_by";
  DROP TYPE "public"."enum_footer_columns_links_link_type";`)
}
