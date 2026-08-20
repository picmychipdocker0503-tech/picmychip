import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_grid_populate_by" AS ENUM('collection', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_team_grid_populate_by" AS ENUM('collection', 'manual');
  CREATE TABLE "pages_blocks_team_grid_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"designation" varchar,
  	"department" varchar,
  	"years_at_company" numeric,
  	"story" jsonb
  );
  
  CREATE TABLE "pages_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Meet the Team',
  	"intro" varchar,
  	"populate_by" "enum_pages_blocks_team_grid_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 12,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_grid_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"designation" varchar,
  	"department" varchar,
  	"years_at_company" numeric,
  	"story" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Meet the Team',
  	"intro" varchar,
  	"populate_by" "enum__pages_v_blocks_team_grid_populate_by" DEFAULT 'collection',
  	"limit" numeric DEFAULT 12,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "team_testimonials" ADD COLUMN "story" jsonb;
  ALTER TABLE "pages_blocks_team_grid_members" ADD CONSTRAINT "pages_blocks_team_grid_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_grid_members" ADD CONSTRAINT "pages_blocks_team_grid_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_grid" ADD CONSTRAINT "pages_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_grid_members" ADD CONSTRAINT "_pages_v_blocks_team_grid_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_grid_members" ADD CONSTRAINT "_pages_v_blocks_team_grid_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_grid" ADD CONSTRAINT "_pages_v_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_grid_members_order_idx" ON "pages_blocks_team_grid_members" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_grid_members_parent_id_idx" ON "pages_blocks_team_grid_members" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_grid_members_photo_idx" ON "pages_blocks_team_grid_members" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_team_grid_order_idx" ON "pages_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_grid_parent_id_idx" ON "pages_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_grid_path_idx" ON "pages_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_grid_members_order_idx" ON "_pages_v_blocks_team_grid_members" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_grid_members_parent_id_idx" ON "_pages_v_blocks_team_grid_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_grid_members_photo_idx" ON "_pages_v_blocks_team_grid_members" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_team_grid_order_idx" ON "_pages_v_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_grid_parent_id_idx" ON "_pages_v_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_grid_path_idx" ON "_pages_v_blocks_team_grid" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_team_grid_members" CASCADE;
  DROP TABLE "pages_blocks_team_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_team_grid_members" CASCADE;
  DROP TABLE "_pages_v_blocks_team_grid" CASCADE;
  ALTER TABLE "team_testimonials" DROP COLUMN "story";
  DROP TYPE "public"."enum_pages_blocks_team_grid_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_team_grid_populate_by";`)
}
