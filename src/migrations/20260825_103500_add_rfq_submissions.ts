import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rfq_submissions_status" AS ENUM('new', 'reviewing', 'quoted', 'won', 'lost', 'closed');
  CREATE TABLE "rfq_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ticket_id" varchar NOT NULL,
  	"status" "enum_rfq_submissions_status" DEFAULT 'new',
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"company" varchar,
  	"gst" varchar,
  	"phone" varchar,
  	"message" varchar,
  	"bom_file_id" integer,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "rfq_submissions_line_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mpn" varchar,
  	"manufacturer" varchar,
  	"quantity" varchar,
  	"target_price" varchar,
  	"lead_time" varchar
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rfq_submissions_id" integer;
  ALTER TABLE "rfq_submissions" ADD CONSTRAINT "rfq_submissions_bom_file_id_datasheets_id_fk" FOREIGN KEY ("bom_file_id") REFERENCES "public"."datasheets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rfq_submissions_line_items" ADD CONSTRAINT "rfq_submissions_line_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfq_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rfq_submissions_ticket_id_idx" ON "rfq_submissions" USING btree ("ticket_id");
  CREATE INDEX "rfq_submissions_status_idx" ON "rfq_submissions" USING btree ("status");
  CREATE INDEX "rfq_submissions_email_idx" ON "rfq_submissions" USING btree ("email");
  CREATE INDEX "rfq_submissions_bom_file_idx" ON "rfq_submissions" USING btree ("bom_file_id");
  CREATE INDEX "rfq_submissions_updated_at_idx" ON "rfq_submissions" USING btree ("updated_at");
  CREATE INDEX "rfq_submissions_created_at_idx" ON "rfq_submissions" USING btree ("created_at");
  CREATE INDEX "rfq_submissions_line_items_order_idx" ON "rfq_submissions_line_items" USING btree ("_order");
  CREATE INDEX "rfq_submissions_line_items_parent_id_idx" ON "rfq_submissions_line_items" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rfq_submissions_fk" FOREIGN KEY ("rfq_submissions_id") REFERENCES "public"."rfq_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rfq_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("rfq_submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rfq_submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rfq_submissions_line_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rfq_submissions" CASCADE;
  DROP TABLE "rfq_submissions_line_items" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rfq_submissions_fk";

  DROP INDEX "payload_locked_documents_rels_rfq_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rfq_submissions_id";
  DROP TYPE "public"."enum_rfq_submissions_status";`)
}
