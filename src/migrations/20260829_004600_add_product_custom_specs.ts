import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_custom_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );

  CREATE TABLE "_products_v_version_custom_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );

  ALTER TABLE "products_custom_specs" ADD CONSTRAINT "products_custom_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_custom_specs" ADD CONSTRAINT "_products_v_version_custom_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_custom_specs_order_idx" ON "products_custom_specs" USING btree ("_order");
  CREATE INDEX "products_custom_specs_parent_id_idx" ON "products_custom_specs" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_custom_specs_order_idx" ON "_products_v_version_custom_specs" USING btree ("_order");
  CREATE INDEX "_products_v_version_custom_specs_parent_id_idx" ON "_products_v_version_custom_specs" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_custom_specs" CASCADE;
  DROP TABLE "_products_v_version_custom_specs" CASCADE;`)
}
