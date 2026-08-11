import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_category_grid_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_blocks_category_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_brand_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Build-to-Order Services',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_category_grid_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_category_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_brand_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_services_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Build-to-Order Services',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "pages_blocks_category_grid_categories" ADD CONSTRAINT "pages_blocks_category_grid_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_category_grid_categories" ADD CONSTRAINT "pages_blocks_category_grid_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_category_grid_categories" ADD CONSTRAINT "pages_blocks_category_grid_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_category_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_category_grid" ADD CONSTRAINT "pages_blocks_category_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_brand_strip" ADD CONSTRAINT "pages_blocks_brand_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_showcase" ADD CONSTRAINT "pages_blocks_services_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_category_grid_categories" ADD CONSTRAINT "_pages_v_blocks_category_grid_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_category_grid_categories" ADD CONSTRAINT "_pages_v_blocks_category_grid_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_category_grid_categories" ADD CONSTRAINT "_pages_v_blocks_category_grid_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_category_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_category_grid" ADD CONSTRAINT "_pages_v_blocks_category_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_brand_strip" ADD CONSTRAINT "_pages_v_blocks_brand_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_services_showcase" ADD CONSTRAINT "_pages_v_blocks_services_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_category_grid_categories_order_idx" ON "pages_blocks_category_grid_categories" USING btree ("_order");
  CREATE INDEX "pages_blocks_category_grid_categories_parent_id_idx" ON "pages_blocks_category_grid_categories" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_category_grid_categories_category_idx" ON "pages_blocks_category_grid_categories" USING btree ("category_id");
  CREATE INDEX "pages_blocks_category_grid_categories_image_idx" ON "pages_blocks_category_grid_categories" USING btree ("image_id");
  CREATE INDEX "pages_blocks_category_grid_order_idx" ON "pages_blocks_category_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_category_grid_parent_id_idx" ON "pages_blocks_category_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_category_grid_path_idx" ON "pages_blocks_category_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_brand_strip_order_idx" ON "pages_blocks_brand_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_brand_strip_parent_id_idx" ON "pages_blocks_brand_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_brand_strip_path_idx" ON "pages_blocks_brand_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_showcase_order_idx" ON "pages_blocks_services_showcase" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_showcase_parent_id_idx" ON "pages_blocks_services_showcase" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_showcase_path_idx" ON "pages_blocks_services_showcase" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_category_grid_categories_order_idx" ON "_pages_v_blocks_category_grid_categories" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_category_grid_categories_parent_id_idx" ON "_pages_v_blocks_category_grid_categories" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_category_grid_categories_category_idx" ON "_pages_v_blocks_category_grid_categories" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_category_grid_categories_image_idx" ON "_pages_v_blocks_category_grid_categories" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_category_grid_order_idx" ON "_pages_v_blocks_category_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_category_grid_parent_id_idx" ON "_pages_v_blocks_category_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_category_grid_path_idx" ON "_pages_v_blocks_category_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_brand_strip_order_idx" ON "_pages_v_blocks_brand_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_brand_strip_parent_id_idx" ON "_pages_v_blocks_brand_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_brand_strip_path_idx" ON "_pages_v_blocks_brand_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_services_showcase_order_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_showcase_parent_id_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_showcase_path_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_path");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_brands_id_idx" ON "pages_rels" USING btree ("brands_id");
  CREATE INDEX "pages_rels_services_id_idx" ON "pages_rels" USING btree ("services_id");
  CREATE INDEX "_pages_v_rels_brands_id_idx" ON "_pages_v_rels" USING btree ("brands_id");
  CREATE INDEX "_pages_v_rels_services_id_idx" ON "_pages_v_rels" USING btree ("services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_category_grid_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_category_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_brand_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_category_grid_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_category_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_brand_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_services_showcase" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_category_grid_categories" CASCADE;
  DROP TABLE "pages_blocks_category_grid" CASCADE;
  DROP TABLE "pages_blocks_brand_strip" CASCADE;
  DROP TABLE "pages_blocks_services_showcase" CASCADE;
  DROP TABLE "_pages_v_blocks_category_grid_categories" CASCADE;
  DROP TABLE "_pages_v_blocks_category_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_brand_strip" CASCADE;
  DROP TABLE "_pages_v_blocks_services_showcase" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_brands_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_services_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_brands_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_services_fk";
  
  DROP INDEX "pages_rels_brands_id_idx";
  DROP INDEX "pages_rels_services_id_idx";
  DROP INDEX "_pages_v_rels_brands_id_idx";
  DROP INDEX "_pages_v_rels_services_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "brands_id";
  ALTER TABLE "pages_rels" DROP COLUMN "services_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "brands_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "services_id";`)
}
