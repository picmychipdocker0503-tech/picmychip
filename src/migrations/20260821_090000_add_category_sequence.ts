import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sequence" numeric DEFAULT 1000;
    CREATE INDEX IF NOT EXISTS "categories_sequence_idx" ON "categories" USING btree ("sequence");

    UPDATE "categories"
    SET "sequence" = CASE
      WHEN "slug" = 'drone-parts' THEN 10
      WHEN "slug" = 'connectors' THEN 20
      WHEN "slug" = 'modules' THEN 30
      WHEN "slug" = 'cables' THEN 40
      WHEN "slug" IN ('cooling-fans-filters-and-grills', 'fans-and-accessories', 'fan-accessories') THEN 50
      WHEN "slug" IN ('resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'ic', 'led', 'buzzer', 'switch', 'fuse') THEN 60
      WHEN "slug" = 'components' THEN 65
      WHEN "slug" IN ('hand-tools-and-consumables', 'hand-tools-consumables', 'tools-and-consumables') THEN 70
      WHEN "slug" IN ('nuts-and-screws', 'brass', 'nylon', 'nylon-with-brass', 'fasteners') THEN 80
      WHEN "slug" IN ('ac-dc-power-supply', 'a-c-d-c-power-supply', 'power-supply') THEN 90
      WHEN "slug" IN ('rd-tools', 'r-and-d-tools', 'research-and-development-tools') THEN 100
      WHEN "slug" = 'shop' THEN 9990
      ELSE 1000
    END;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_sequence_idx";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "sequence";
  `)
}
