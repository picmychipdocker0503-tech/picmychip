import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the technician-requests collection (src/collections/TechnicianRequests.ts),
 * populated by the /request-technician form.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_technician_requests_status" AS ENUM('new', 'contacted', 'matched', 'deployed', 'closed');
  CREATE TYPE "public"."enum_technician_requests_engagement" AS ENUM('onsite', 'facility', 'either');
  CREATE TYPE "public"."enum_technician_requests_duration" AS ENUM('day', 'week', 'month', 'long-term', 'not-sure');
  CREATE TABLE "technician_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ticket_id" varchar NOT NULL,
  	"customer_id" integer,
  	"status" "enum_technician_requests_status" DEFAULT 'new',
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"company" varchar,
  	"skills" varchar,
  	"technicians" numeric,
  	"engagement" "enum_technician_requests_engagement",
  	"duration" "enum_technician_requests_duration",
  	"location" varchar,
  	"start_date" timestamp(3) with time zone,
  	"message" varchar,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "technician_requests_id" integer;
  ALTER TABLE "technician_requests" ADD CONSTRAINT "technician_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "technician_requests_ticket_id_idx" ON "technician_requests" USING btree ("ticket_id");
  CREATE INDEX "technician_requests_customer_idx" ON "technician_requests" USING btree ("customer_id");
  CREATE INDEX "technician_requests_status_idx" ON "technician_requests" USING btree ("status");
  CREATE INDEX "technician_requests_email_idx" ON "technician_requests" USING btree ("email");
  CREATE INDEX "technician_requests_updated_at_idx" ON "technician_requests" USING btree ("updated_at");
  CREATE INDEX "technician_requests_created_at_idx" ON "technician_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_technician_requests_fk" FOREIGN KEY ("technician_requests_id") REFERENCES "public"."technician_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_technician_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("technician_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_technician_requests_fk";
  DROP INDEX "payload_locked_documents_rels_technician_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "technician_requests_id";
  DROP TABLE "technician_requests" CASCADE;
  DROP TYPE "public"."enum_technician_requests_status";
  DROP TYPE "public"."enum_technician_requests_engagement";
  DROP TYPE "public"."enum_technician_requests_duration";`)
}
