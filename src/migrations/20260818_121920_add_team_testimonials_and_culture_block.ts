import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_culture_populate_by" AS ENUM('collection', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_team_culture_populate_by" AS ENUM('collection', 'manual');
  CREATE TABLE "pages_blocks_team_culture_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"designation" varchar,
  	"department" varchar,
  	"quote" varchar
  );
  
  CREATE TABLE "pages_blocks_team_culture" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Life at Picmychip',
  	"intro" varchar,
  	"populate_by" "enum_pages_blocks_team_culture_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_culture_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"designation" varchar,
  	"department" varchar,
  	"quote" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_culture" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Life at Picmychip',
  	"intro" varchar,
  	"populate_by" "enum__pages_v_blocks_team_culture_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "team_testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"designation" varchar,
  	"department" varchar,
  	"photo_id" integer,
  	"quote" varchar NOT NULL,
  	"years_at_company" numeric,
  	"featured" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_testimonials_id" integer;
  ALTER TABLE "pages_blocks_team_culture_testimonials" ADD CONSTRAINT "pages_blocks_team_culture_testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_culture_testimonials" ADD CONSTRAINT "pages_blocks_team_culture_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team_culture"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_culture" ADD CONSTRAINT "pages_blocks_team_culture_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_culture_testimonials" ADD CONSTRAINT "_pages_v_blocks_team_culture_testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_culture_testimonials" ADD CONSTRAINT "_pages_v_blocks_team_culture_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team_culture"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_culture" ADD CONSTRAINT "_pages_v_blocks_team_culture_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_testimonials" ADD CONSTRAINT "team_testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_culture_testimonials_order_idx" ON "pages_blocks_team_culture_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_culture_testimonials_parent_id_idx" ON "pages_blocks_team_culture_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_culture_testimonials_photo_idx" ON "pages_blocks_team_culture_testimonials" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_team_culture_order_idx" ON "pages_blocks_team_culture" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_culture_parent_id_idx" ON "pages_blocks_team_culture" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_culture_path_idx" ON "pages_blocks_team_culture" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_culture_testimonials_order_idx" ON "_pages_v_blocks_team_culture_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_culture_testimonials_parent_id_idx" ON "_pages_v_blocks_team_culture_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_culture_testimonials_photo_idx" ON "_pages_v_blocks_team_culture_testimonials" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_team_culture_order_idx" ON "_pages_v_blocks_team_culture" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_culture_parent_id_idx" ON "_pages_v_blocks_team_culture" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_culture_path_idx" ON "_pages_v_blocks_team_culture" USING btree ("_path");
  CREATE INDEX "team_testimonials_photo_idx" ON "team_testimonials" USING btree ("photo_id");
  CREATE INDEX "team_testimonials_updated_at_idx" ON "team_testimonials" USING btree ("updated_at");
  CREATE INDEX "team_testimonials_created_at_idx" ON "team_testimonials" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_testimonials_fk" FOREIGN KEY ("team_testimonials_id") REFERENCES "public"."team_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_team_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("team_testimonials_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_team_culture_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_culture" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_culture_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_culture" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_testimonials" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_team_culture_testimonials" CASCADE;
  DROP TABLE "pages_blocks_team_culture" CASCADE;
  DROP TABLE "_pages_v_blocks_team_culture_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_team_culture" CASCADE;
  DROP TABLE "team_testimonials" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_testimonials_fk";
  
  DROP INDEX "payload_locked_documents_rels_team_testimonials_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_testimonials_id";
  DROP TYPE "public"."enum_pages_blocks_team_culture_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_team_culture_populate_by";`)
}
