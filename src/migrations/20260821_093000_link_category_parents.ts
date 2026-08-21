import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    WITH desired_parents(title, slug, sequence, aliases) AS (
      VALUES
        ('Drone Parts', 'drone-parts', 10, ARRAY['drone-parts']),
        ('Connectors', 'connectors', 20, ARRAY['connectors']),
        ('Modules', 'modules', 30, ARRAY['modules']),
        ('Cables', 'cables', 40, ARRAY['cables']),
        ('Fan''s and Accessories', 'fans-and-accessories', 50, ARRAY['fans-and-accessories', 'cooling-fans-filters-and-grills', 'fan-accessories']),
        ('Components', 'components', 60, ARRAY['components']),
        ('Hand Tools & Consumables', 'hand-tools-and-consumables', 70, ARRAY['hand-tools-and-consumables', 'hand-tools-consumables', 'tools-and-consumables']),
        ('Fasteners', 'fasteners', 80, ARRAY['fasteners']),
        ('A/C - D/C Power supply', 'ac-dc-power-supply', 90, ARRAY['ac-dc-power-supply', 'a-c-d-c-power-supply', 'power-supply']),
        ('R&D Tools', 'rd-tools', 100, ARRAY['rd-tools', 'r-and-d-tools', 'research-and-development-tools'])
    )
    INSERT INTO "categories" ("title", "slug", "sequence", "spec_schema_type", "updated_at", "created_at")
    SELECT title, slug, sequence, 'none', now(), now()
    FROM desired_parents desired
    WHERE NOT EXISTS (
      SELECT 1
      FROM "categories" existing
      WHERE existing."slug" = ANY(desired.aliases)
    );

    WITH parent_links(child_slug, parent_slug, child_sequence) AS (
      VALUES
        ('usb-cables', 'cables', 41),
        ('jst-cables', 'cables', 42),
        ('ffc-cables', 'cables', 43),
        ('hdmi-cables', 'cables', 44),
        ('resistor', 'components', 61),
        ('capacitor', 'components', 62),
        ('inductor', 'components', 63),
        ('diode', 'components', 64),
        ('transistor', 'components', 65),
        ('ic', 'components', 66),
        ('led', 'components', 67),
        ('buzzer', 'components', 68),
        ('switch', 'components', 69),
        ('fuse', 'components', 70),
        ('nuts-and-screws', 'fasteners', 81),
        ('brass', 'fasteners', 82),
        ('nylon', 'fasteners', 83),
        ('nylon-with-brass', 'fasteners', 84)
    )
    UPDATE "categories" child
    SET
      "parent_id" = parent."id",
      "sequence" = parent_links.child_sequence,
      "updated_at" = now()
    FROM parent_links
    INNER JOIN "categories" parent ON parent."slug" = parent_links.parent_slug
    WHERE child."slug" = parent_links.child_slug;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    WITH parent_links(child_slug, parent_slug) AS (
      VALUES
        ('usb-cables', 'cables'),
        ('jst-cables', 'cables'),
        ('ffc-cables', 'cables'),
        ('hdmi-cables', 'cables'),
        ('resistor', 'components'),
        ('capacitor', 'components'),
        ('inductor', 'components'),
        ('diode', 'components'),
        ('transistor', 'components'),
        ('ic', 'components'),
        ('led', 'components'),
        ('buzzer', 'components'),
        ('switch', 'components'),
        ('fuse', 'components'),
        ('nuts-and-screws', 'fasteners'),
        ('brass', 'fasteners'),
        ('nylon', 'fasteners'),
        ('nylon-with-brass', 'fasteners')
    )
    UPDATE "categories" child
    SET
      "parent_id" = NULL,
      "updated_at" = now()
    FROM parent_links
    INNER JOIN "categories" parent ON parent."slug" = parent_links.parent_slug
    WHERE child."slug" = parent_links.child_slug
      AND child."parent_id" = parent."id";
  `)
}
