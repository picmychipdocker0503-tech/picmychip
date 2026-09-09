import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Replaces the single users.zoho_customer_id with a per-identity list —
 * a customer who orders once as an Individual and again as a Registered
 * Business now gets two separate Zoho contacts instead of one shared/
 * overwritten record. See src/lib/zoho/customers.ts's getZohoIdentityKey.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_zoho_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"identity_key" varchar NOT NULL,
  	"contact_id" varchar NOT NULL
  );

  ALTER TABLE "users" DROP COLUMN "zoho_customer_id";
  ALTER TABLE "users_zoho_contacts" ADD CONSTRAINT "users_zoho_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_zoho_contacts_order_idx" ON "users_zoho_contacts" USING btree ("_order");
  CREATE INDEX "users_zoho_contacts_parent_id_idx" ON "users_zoho_contacts" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_zoho_contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_zoho_contacts" CASCADE;
  ALTER TABLE "users" ADD COLUMN "zoho_customer_id" varchar;`)
}
