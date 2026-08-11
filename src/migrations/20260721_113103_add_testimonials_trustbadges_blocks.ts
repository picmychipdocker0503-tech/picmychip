import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_trust_badges_strip_badges_icon" AS ENUM('shipping', 'support', 'secure', 'returns', 'verified');
  CREATE TYPE "public"."enum_pages_blocks_testimonials_populate_by" AS ENUM('manual', 'reviews');
  CREATE TYPE "public"."enum__pages_v_blocks_trust_badges_strip_badges_icon" AS ENUM('shipping', 'support', 'secure', 'returns', 'verified');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_populate_by" AS ENUM('manual', 'reviews');
  CREATE TABLE "pages_blocks_trust_badges_strip_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_trust_badges_strip_badges_icon" DEFAULT 'shipping',
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_trust_badges_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonials_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"role" varchar,
  	"rating" numeric DEFAULT 5,
  	"quote" varchar,
  	"product_id" integer
  );
  
  CREATE TABLE "pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'What Makers Are Saying',
  	"populate_by" "enum_pages_blocks_testimonials_populate_by" DEFAULT 'manual',
  	"min_rating" numeric DEFAULT 4,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_trust_badges_strip_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_trust_badges_strip_badges_icon" DEFAULT 'shipping',
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_trust_badges_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"role" varchar,
  	"rating" numeric DEFAULT 5,
  	"quote" varchar,
  	"product_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'What Makers Are Saying',
  	"populate_by" "enum__pages_v_blocks_testimonials_populate_by" DEFAULT 'manual',
  	"min_rating" numeric DEFAULT 4,
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_trust_badges_strip_badges" ADD CONSTRAINT "pages_blocks_trust_badges_strip_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_trust_badges_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_trust_badges_strip" ADD CONSTRAINT "pages_blocks_trust_badges_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_trust_badges_strip_badges" ADD CONSTRAINT "_pages_v_blocks_trust_badges_strip_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_trust_badges_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_trust_badges_strip" ADD CONSTRAINT "_pages_v_blocks_trust_badges_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_trust_badges_strip_badges_order_idx" ON "pages_blocks_trust_badges_strip_badges" USING btree ("_order");
  CREATE INDEX "pages_blocks_trust_badges_strip_badges_parent_id_idx" ON "pages_blocks_trust_badges_strip_badges" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trust_badges_strip_order_idx" ON "pages_blocks_trust_badges_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_trust_badges_strip_parent_id_idx" ON "pages_blocks_trust_badges_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trust_badges_strip_path_idx" ON "pages_blocks_trust_badges_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_testimonials_order_idx" ON "pages_blocks_testimonials_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_testimonials_parent_id_idx" ON "pages_blocks_testimonials_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_testimonials_photo_idx" ON "pages_blocks_testimonials_testimonials" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_testimonials_testimonials_product_idx" ON "pages_blocks_testimonials_testimonials" USING btree ("product_id");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_trust_badges_strip_badges_order_idx" ON "_pages_v_blocks_trust_badges_strip_badges" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_trust_badges_strip_badges_parent_id_idx" ON "_pages_v_blocks_trust_badges_strip_badges" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_trust_badges_strip_order_idx" ON "_pages_v_blocks_trust_badges_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_trust_badges_strip_parent_id_idx" ON "_pages_v_blocks_trust_badges_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_trust_badges_strip_path_idx" ON "_pages_v_blocks_trust_badges_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonials_testimonials_order_idx" ON "_pages_v_blocks_testimonials_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_testimonials_photo_idx" ON "_pages_v_blocks_testimonials_testimonials" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_testimonials_testimonials_product_idx" ON "_pages_v_blocks_testimonials_testimonials" USING btree ("product_id");
  CREATE INDEX "_pages_v_blocks_testimonials_order_idx" ON "_pages_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_path_idx" ON "_pages_v_blocks_testimonials" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_trust_badges_strip_badges" CASCADE;
  DROP TABLE "pages_blocks_trust_badges_strip" CASCADE;
  DROP TABLE "pages_blocks_testimonials_testimonials" CASCADE;
  DROP TABLE "pages_blocks_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_trust_badges_strip_badges" CASCADE;
  DROP TABLE "_pages_v_blocks_trust_badges_strip" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_trust_badges_strip_badges_icon";
  DROP TYPE "public"."enum_pages_blocks_testimonials_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_trust_badges_strip_badges_icon";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_populate_by";`)
}
