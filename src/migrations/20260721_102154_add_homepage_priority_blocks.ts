import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_carousel_slides_layout" AS ENUM('fullBleed', 'split');
  CREATE TYPE "public"."enum_pages_blocks_hero_carousel_slides_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_flash_deal_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_carousel_slides_layout" AS ENUM('fullBleed', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_carousel_slides_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_flash_deal_populate_by" AS ENUM('collection', 'selection');
  CREATE TABLE "pages_blocks_hero_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_pages_blocks_hero_carousel_slides_layout" DEFAULT 'fullBleed',
  	"image_id" integer,
  	"mobile_image_id" integer,
  	"badge" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"link_type" "enum_pages_blocks_hero_carousel_slides_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "pages_blocks_hero_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_flash_deal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Flash Deal',
  	"discount_badge" varchar,
  	"end_date" timestamp(3) with time zone,
  	"populate_by" "enum_pages_blocks_flash_deal_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_trending_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Trending Now',
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__pages_v_blocks_hero_carousel_slides_layout" DEFAULT 'fullBleed',
  	"image_id" integer,
  	"mobile_image_id" integer,
  	"badge" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"link_type" "enum__pages_v_blocks_hero_carousel_slides_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_flash_deal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Flash Deal',
  	"discount_badge" varchar,
  	"end_date" timestamp(3) with time zone,
  	"populate_by" "enum__pages_v_blocks_flash_deal_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 8,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_trending_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Trending Now',
  	"limit" numeric DEFAULT 8,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_hero_carousel_slides" ADD CONSTRAINT "pages_blocks_hero_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_carousel_slides" ADD CONSTRAINT "pages_blocks_hero_carousel_slides_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_carousel_slides" ADD CONSTRAINT "pages_blocks_hero_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_carousel" ADD CONSTRAINT "pages_blocks_hero_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flash_deal" ADD CONSTRAINT "pages_blocks_flash_deal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_trending_products" ADD CONSTRAINT "pages_blocks_trending_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_hero_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_hero_carousel_slides_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_hero_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_carousel" ADD CONSTRAINT "_pages_v_blocks_hero_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_flash_deal" ADD CONSTRAINT "_pages_v_blocks_flash_deal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_trending_products" ADD CONSTRAINT "_pages_v_blocks_trending_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_carousel_slides_order_idx" ON "pages_blocks_hero_carousel_slides" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_carousel_slides_parent_id_idx" ON "pages_blocks_hero_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_carousel_slides_image_idx" ON "pages_blocks_hero_carousel_slides" USING btree ("image_id");
  CREATE INDEX "pages_blocks_hero_carousel_slides_mobile_image_idx" ON "pages_blocks_hero_carousel_slides" USING btree ("mobile_image_id");
  CREATE INDEX "pages_blocks_hero_carousel_order_idx" ON "pages_blocks_hero_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_carousel_parent_id_idx" ON "pages_blocks_hero_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_carousel_path_idx" ON "pages_blocks_hero_carousel" USING btree ("_path");
  CREATE INDEX "pages_blocks_flash_deal_order_idx" ON "pages_blocks_flash_deal" USING btree ("_order");
  CREATE INDEX "pages_blocks_flash_deal_parent_id_idx" ON "pages_blocks_flash_deal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flash_deal_path_idx" ON "pages_blocks_flash_deal" USING btree ("_path");
  CREATE INDEX "pages_blocks_trending_products_order_idx" ON "pages_blocks_trending_products" USING btree ("_order");
  CREATE INDEX "pages_blocks_trending_products_parent_id_idx" ON "pages_blocks_trending_products" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trending_products_path_idx" ON "pages_blocks_trending_products" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_carousel_slides_order_idx" ON "_pages_v_blocks_hero_carousel_slides" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_carousel_slides_parent_id_idx" ON "_pages_v_blocks_hero_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_carousel_slides_image_idx" ON "_pages_v_blocks_hero_carousel_slides" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_hero_carousel_slides_mobile_image_idx" ON "_pages_v_blocks_hero_carousel_slides" USING btree ("mobile_image_id");
  CREATE INDEX "_pages_v_blocks_hero_carousel_order_idx" ON "_pages_v_blocks_hero_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_carousel_parent_id_idx" ON "_pages_v_blocks_hero_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_carousel_path_idx" ON "_pages_v_blocks_hero_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_flash_deal_order_idx" ON "_pages_v_blocks_flash_deal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_flash_deal_parent_id_idx" ON "_pages_v_blocks_flash_deal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_flash_deal_path_idx" ON "_pages_v_blocks_flash_deal" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_trending_products_order_idx" ON "_pages_v_blocks_trending_products" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_trending_products_parent_id_idx" ON "_pages_v_blocks_trending_products" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_trending_products_path_idx" ON "_pages_v_blocks_trending_products" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero_carousel_slides" CASCADE;
  DROP TABLE "pages_blocks_hero_carousel" CASCADE;
  DROP TABLE "pages_blocks_flash_deal" CASCADE;
  DROP TABLE "pages_blocks_trending_products" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_carousel_slides" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_flash_deal" CASCADE;
  DROP TABLE "_pages_v_blocks_trending_products" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_hero_carousel_slides_layout";
  DROP TYPE "public"."enum_pages_blocks_hero_carousel_slides_link_type";
  DROP TYPE "public"."enum_pages_blocks_flash_deal_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_hero_carousel_slides_layout";
  DROP TYPE "public"."enum__pages_v_blocks_hero_carousel_slides_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_flash_deal_populate_by";`)
}
