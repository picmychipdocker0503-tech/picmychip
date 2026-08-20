import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * A migration named "remove_customer_interaction_block" ran against this
 * database (recorded in payload_migrations, batch 45) dropping every
 * customer-interaction table and both enum types — but its .ts file isn't
 * present in this checkout, and the `CustomerInteraction` block is still
 * actively registered on the Pages collection. Payload's flattened
 * block-query architecture LEFT JOINs every registered block's table for
 * every single Pages query, so the missing table broke every page site-wide,
 * not just ones using the block. This restores the exact schema from the
 * original 20260810_163500_add_customer_interaction_block migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_customer_interaction_channels_type" AS ENUM('quote', 'technical', 'tracking', 'service');
  CREATE TYPE "public"."enum__pages_v_blocks_customer_interaction_channels_type" AS ENUM('quote', 'technical', 'tracking', 'service');
  CREATE TABLE "pages_blocks_customer_interaction_channels" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_pages_blocks_customer_interaction_channels_type" DEFAULT 'quote',
  	"title" varchar,
  	"description" varchar,
  	"response_time" varchar DEFAULT 'Within 2 hours'
  );

  CREATE TABLE "pages_blocks_customer_interaction_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );

  CREATE TABLE "pages_blocks_customer_interaction_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );

  CREATE TABLE "pages_blocks_customer_interaction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Customer interaction',
  	"heading" varchar DEFAULT 'Tell us what you are building. We will help you source it.',
  	"intro" varchar DEFAULT 'Get part suggestions, availability checks, bulk pricing, and build-to-order service help from one place.',
  	"primary_link_type" varchar DEFAULT 'reference',
  	"primary_link_new_tab" boolean,
  	"primary_link_url" varchar,
  	"primary_link_label" varchar,
  	"secondary_link_type" varchar DEFAULT 'reference',
  	"secondary_link_new_tab" boolean,
  	"secondary_link_url" varchar,
  	"secondary_link_label" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_customer_interaction_channels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__pages_v_blocks_customer_interaction_channels_type" DEFAULT 'quote',
  	"title" varchar,
  	"description" varchar,
  	"response_time" varchar DEFAULT 'Within 2 hours',
  	"_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_customer_interaction_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_customer_interaction_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_customer_interaction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Customer interaction',
  	"heading" varchar DEFAULT 'Tell us what you are building. We will help you source it.',
  	"intro" varchar DEFAULT 'Get part suggestions, availability checks, bulk pricing, and build-to-order service help from one place.',
  	"primary_link_type" varchar DEFAULT 'reference',
  	"primary_link_new_tab" boolean,
  	"primary_link_url" varchar,
  	"primary_link_label" varchar,
  	"secondary_link_type" varchar DEFAULT 'reference',
  	"secondary_link_new_tab" boolean,
  	"secondary_link_url" varchar,
  	"secondary_link_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "pages_blocks_customer_interaction_channels" ADD CONSTRAINT "pages_blocks_customer_interaction_channels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_customer_interaction_steps" ADD CONSTRAINT "pages_blocks_customer_interaction_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_customer_interaction_metrics" ADD CONSTRAINT "pages_blocks_customer_interaction_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_customer_interaction" ADD CONSTRAINT "pages_blocks_customer_interaction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_customer_interaction_channels" ADD CONSTRAINT "_pages_v_blocks_customer_interaction_channels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_customer_interaction_steps" ADD CONSTRAINT "_pages_v_blocks_customer_interaction_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_customer_interaction_metrics" ADD CONSTRAINT "_pages_v_blocks_customer_interaction_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_customer_interaction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_customer_interaction" ADD CONSTRAINT "_pages_v_blocks_customer_interaction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_customer_interaction_channels_order_idx" ON "pages_blocks_customer_interaction_channels" USING btree ("_order");
  CREATE INDEX "pages_blocks_customer_interaction_channels_parent_id_idx" ON "pages_blocks_customer_interaction_channels" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_customer_interaction_steps_order_idx" ON "pages_blocks_customer_interaction_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_customer_interaction_steps_parent_id_idx" ON "pages_blocks_customer_interaction_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_customer_interaction_metrics_order_idx" ON "pages_blocks_customer_interaction_metrics" USING btree ("_order");
  CREATE INDEX "pages_blocks_customer_interaction_metrics_parent_id_idx" ON "pages_blocks_customer_interaction_metrics" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_customer_interaction_order_idx" ON "pages_blocks_customer_interaction" USING btree ("_order");
  CREATE INDEX "pages_blocks_customer_interaction_parent_id_idx" ON "pages_blocks_customer_interaction" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_customer_interaction_path_idx" ON "pages_blocks_customer_interaction" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_customer_interaction_channels_order_idx" ON "_pages_v_blocks_customer_interaction_channels" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_customer_interaction_channels_parent_id_idx" ON "_pages_v_blocks_customer_interaction_channels" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_customer_interaction_steps_order_idx" ON "_pages_v_blocks_customer_interaction_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_customer_interaction_steps_parent_id_idx" ON "_pages_v_blocks_customer_interaction_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_customer_interaction_metrics_order_idx" ON "_pages_v_blocks_customer_interaction_metrics" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_customer_interaction_metrics_parent_id_idx" ON "_pages_v_blocks_customer_interaction_metrics" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_customer_interaction_order_idx" ON "_pages_v_blocks_customer_interaction" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_customer_interaction_parent_id_idx" ON "_pages_v_blocks_customer_interaction" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_customer_interaction_path_idx" ON "_pages_v_blocks_customer_interaction" USING btree ("_path");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_customer_interaction_channels" CASCADE;
  DROP TABLE "pages_blocks_customer_interaction_steps" CASCADE;
  DROP TABLE "pages_blocks_customer_interaction_metrics" CASCADE;
  DROP TABLE "pages_blocks_customer_interaction" CASCADE;
  DROP TABLE "_pages_v_blocks_customer_interaction_channels" CASCADE;
  DROP TABLE "_pages_v_blocks_customer_interaction_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_customer_interaction_metrics" CASCADE;
  DROP TABLE "_pages_v_blocks_customer_interaction" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_customer_interaction_channels_type";
  DROP TYPE "public"."enum__pages_v_blocks_customer_interaction_channels_type";`)
}
