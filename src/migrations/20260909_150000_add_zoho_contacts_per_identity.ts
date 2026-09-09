import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Replaces the single users.zoho_customer_id with a per-identity list —
 * a customer who orders once as an Individual and again as a Registered
 * Business now gets two separate Zoho contacts instead of one shared/
 * overwritten record. See src/lib/zoho/customers.ts's getZohoIdentityKey.
 *
 * Preserves every existing zoho_customer_id by carrying it over as an
 * 'individual' identityKey entry before dropping the column — 'individual'
 * is a guess (the old flat field predates the Individual/Company
 * distinction entirely, so there's no way to know which identity it
 * actually was), but a wrong guess here is self-correcting and never loses
 * the contact: resolveCustomerForOrder's identityKey lookup would simply
 * miss on the next order, falling through to findOrCreateZohoCustomer's own
 * email/GSTIN/phone matching, which still finds and reuses the same real
 * Zoho contact (identityConflicts checks the contact's OWN actual
 * gst_treatment, not our locally-guessed label) and persists the corrected
 * identityKey from then on. What must never happen is silently dropping the
 * column with no carry-over at all, which would orphan every existing
 * customer's contact id with no trace of it anywhere.
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

  INSERT INTO "users_zoho_contacts" ("_order", "_parent_id", "id", "identity_key", "contact_id")
  SELECT 1, "id", gen_random_uuid()::text, 'individual', "zoho_customer_id"
  FROM "users"
  WHERE "zoho_customer_id" IS NOT NULL AND "zoho_customer_id" <> '';

  ALTER TABLE "users" DROP COLUMN "zoho_customer_id";
  ALTER TABLE "users_zoho_contacts" ADD CONSTRAINT "users_zoho_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_zoho_contacts_order_idx" ON "users_zoho_contacts" USING btree ("_order");
  CREATE INDEX "users_zoho_contacts_parent_id_idx" ON "users_zoho_contacts" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "zoho_customer_id" varchar;

  UPDATE "users" u
  SET "zoho_customer_id" = sub."contact_id"
  FROM (
    SELECT DISTINCT ON ("_parent_id") "_parent_id", "contact_id"
    FROM "users_zoho_contacts"
    ORDER BY "_parent_id", "_order"
  ) sub
  WHERE u."id" = sub."_parent_id";

  ALTER TABLE "users_zoho_contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_zoho_contacts" CASCADE;`)
  // Best-effort only: if a user has since accumulated more than one identity's
  // contact, only the first (by _order) survives the rollback — real data
  // written after the up-migration ran can't be losslessly collapsed back
  // into one column.
}
