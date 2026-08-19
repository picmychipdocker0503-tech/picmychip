import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_email_events_status" AS ENUM('sent', 'failed', 'unknown');
  CREATE TABLE "email_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email_event_id" varchar NOT NULL,
  	"email_type" varchar NOT NULL,
  	"recipient" varchar NOT NULL,
  	"status" "enum_email_events_status" DEFAULT 'unknown' NOT NULL,
  	"primary_provider" varchar,
  	"fallback_provider" varchar,
  	"provider_message_id" varchar,
  	"attempt_count" numeric DEFAULT 0,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_events_id" integer;
  CREATE UNIQUE INDEX "email_events_email_event_id_idx" ON "email_events" USING btree ("email_event_id");
  CREATE INDEX "email_events_updated_at_idx" ON "email_events" USING btree ("updated_at");
  CREATE INDEX "email_events_created_at_idx" ON "email_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_events_fk" FOREIGN KEY ("email_events_id") REFERENCES "public"."email_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_email_events_id_idx" ON "payload_locked_documents_rels" USING btree ("email_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "email_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_email_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_events_id";
  DROP TYPE "public"."enum_email_events_status";`)
}
