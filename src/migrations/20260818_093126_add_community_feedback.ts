import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_testimonials_populate_by" ADD VALUE 'communityFeedback';
  ALTER TYPE "public"."enum__pages_v_blocks_testimonials_populate_by" ADD VALUE 'communityFeedback';
  CREATE TABLE "community_feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"designation" varchar,
  	"company_name" varchar,
  	"image_id" integer,
  	"feedback" varchar NOT NULL,
  	"featured" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_feedback_id" integer;
  ALTER TABLE "community_feedback" ADD CONSTRAINT "community_feedback_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "community_feedback_image_idx" ON "community_feedback" USING btree ("image_id");
  CREATE INDEX "community_feedback_updated_at_idx" ON "community_feedback" USING btree ("updated_at");
  CREATE INDEX "community_feedback_created_at_idx" ON "community_feedback" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_community_feedback_fk" FOREIGN KEY ("community_feedback_id") REFERENCES "public"."community_feedback"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_community_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("community_feedback_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "community_feedback" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "community_feedback" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_community_feedback_fk";
  
  ALTER TABLE "pages_blocks_testimonials" ALTER COLUMN "populate_by" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_testimonials" ALTER COLUMN "populate_by" SET DEFAULT 'manual'::text;
  DROP TYPE "public"."enum_pages_blocks_testimonials_populate_by";
  CREATE TYPE "public"."enum_pages_blocks_testimonials_populate_by" AS ENUM('manual', 'reviews');
  ALTER TABLE "pages_blocks_testimonials" ALTER COLUMN "populate_by" SET DEFAULT 'manual'::"public"."enum_pages_blocks_testimonials_populate_by";
  ALTER TABLE "pages_blocks_testimonials" ALTER COLUMN "populate_by" SET DATA TYPE "public"."enum_pages_blocks_testimonials_populate_by" USING "populate_by"::"public"."enum_pages_blocks_testimonials_populate_by";
  ALTER TABLE "_pages_v_blocks_testimonials" ALTER COLUMN "populate_by" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_testimonials" ALTER COLUMN "populate_by" SET DEFAULT 'manual'::text;
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_populate_by";
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_populate_by" AS ENUM('manual', 'reviews');
  ALTER TABLE "_pages_v_blocks_testimonials" ALTER COLUMN "populate_by" SET DEFAULT 'manual'::"public"."enum__pages_v_blocks_testimonials_populate_by";
  ALTER TABLE "_pages_v_blocks_testimonials" ALTER COLUMN "populate_by" SET DATA TYPE "public"."enum__pages_v_blocks_testimonials_populate_by" USING "populate_by"::"public"."enum__pages_v_blocks_testimonials_populate_by";
  DROP INDEX "payload_locked_documents_rels_community_feedback_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "community_feedback_id";`)
}
