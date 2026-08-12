import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_forms_blocks_upload_upload_collection" ADD VALUE 'datasheets';
  ALTER TABLE "form_submissions_rels" ADD COLUMN "datasheets_id" integer;
  ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_datasheets_fk" FOREIGN KEY ("datasheets_id") REFERENCES "public"."datasheets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "form_submissions_rels_datasheets_id_idx" ON "form_submissions_rels" USING btree ("datasheets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions_rels" DROP CONSTRAINT "form_submissions_rels_datasheets_fk";
  
  ALTER TABLE "forms_blocks_upload" ALTER COLUMN "upload_collection" SET DATA TYPE text;
  DROP TYPE "public"."enum_forms_blocks_upload_upload_collection";
  CREATE TYPE "public"."enum_forms_blocks_upload_upload_collection" AS ENUM('media');
  ALTER TABLE "forms_blocks_upload" ALTER COLUMN "upload_collection" SET DATA TYPE "public"."enum_forms_blocks_upload_upload_collection" USING "upload_collection"::"public"."enum_forms_blocks_upload_upload_collection";
  DROP INDEX "form_submissions_rels_datasheets_id_idx";
  ALTER TABLE "form_submissions_rels" DROP COLUMN "datasheets_id";`)
}
