import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds schema for the form-builder plugin's `upload` field type (enabled via
 * `fields.upload: true` + `uploadCollections: ['media']` in src/plugins/index.ts), used by the
 * new "Start a Request" form's BOM-file field.
 *
 * Hand-pruned from the `payload migrate:create` output: this repo is missing the drizzle
 * snapshot for `20260810_163500_add_customer_interaction_block` (only its .ts exists, no
 * .json), so the auto-generated diff used a stale baseline and also tried to recreate
 * `pages_blocks_customer_interaction*` tables and re-touch currency/transactions columns that
 * already exist in the live DB — all removed here, keeping only the actual new tables.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_forms_blocks_upload_upload_collection" AS ENUM('media');

  CREATE TABLE "forms_blocks_upload_mime_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mime_type" varchar NOT NULL
  );

  CREATE TABLE "forms_blocks_upload" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"upload_collection" "enum_forms_blocks_upload_upload_collection" NOT NULL,
  	"width" numeric,
  	"max_file_size" numeric,
  	"required" boolean,
  	"multiple" boolean,
  	"block_name" varchar
  );

  CREATE TABLE "form_submissions_submission_uploads" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL
  );

  CREATE TABLE "form_submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );

  ALTER TABLE "forms_blocks_upload_mime_types" ADD CONSTRAINT "forms_blocks_upload_mime_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_upload"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_upload" ADD CONSTRAINT "forms_blocks_upload_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_submission_uploads" ADD CONSTRAINT "form_submissions_submission_uploads_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "forms_blocks_upload_mime_types_order_idx" ON "forms_blocks_upload_mime_types" USING btree ("_order");
  CREATE INDEX "forms_blocks_upload_mime_types_parent_id_idx" ON "forms_blocks_upload_mime_types" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_upload_order_idx" ON "forms_blocks_upload" USING btree ("_order");
  CREATE INDEX "forms_blocks_upload_parent_id_idx" ON "forms_blocks_upload" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_upload_path_idx" ON "forms_blocks_upload" USING btree ("_path");
  CREATE INDEX "form_submissions_submission_uploads_order_idx" ON "form_submissions_submission_uploads" USING btree ("_order");
  CREATE INDEX "form_submissions_submission_uploads_parent_id_idx" ON "form_submissions_submission_uploads" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_rels_order_idx" ON "form_submissions_rels" USING btree ("order");
  CREATE INDEX "form_submissions_rels_parent_idx" ON "form_submissions_rels" USING btree ("parent_id");
  CREATE INDEX "form_submissions_rels_path_idx" ON "form_submissions_rels" USING btree ("path");
  CREATE INDEX "form_submissions_rels_media_id_idx" ON "form_submissions_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms_blocks_upload_mime_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_upload" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions_submission_uploads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "forms_blocks_upload_mime_types" CASCADE;
  DROP TABLE "forms_blocks_upload" CASCADE;
  DROP TABLE "form_submissions_submission_uploads" CASCADE;
  DROP TABLE "form_submissions_rels" CASCADE;
  DROP TYPE "public"."enum_forms_blocks_upload_upload_collection";`)
}
