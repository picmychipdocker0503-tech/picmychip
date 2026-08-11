import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_faq" ALTER COLUMN "heading" SET DEFAULT 'Frequently asked questions';
  ALTER TABLE "_pages_v_blocks_faq" ALTER COLUMN "heading" SET DEFAULT 'Frequently asked questions';
  ALTER TABLE "categories_blocks_faq" ALTER COLUMN "heading" SET DEFAULT 'Frequently asked questions';
  ALTER TABLE "guides_blocks_faq" ALTER COLUMN "heading" SET DEFAULT 'Frequently asked questions';
  ALTER TABLE "_guides_v_blocks_faq" ALTER COLUMN "heading" SET DEFAULT 'Frequently asked questions';
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "eyebrow" varchar DEFAULT 'FAQ';
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "contact_card_enabled" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "contact_card_heading" varchar DEFAULT 'Still have questions?';
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "contact_card_description" varchar DEFAULT 'Our team typically responds within a few hours.';
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "contact_card_link_label" varchar DEFAULT 'Contact support';
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "contact_card_link_url" varchar DEFAULT '/contact';
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "eyebrow" varchar DEFAULT 'FAQ';
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "contact_card_enabled" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "contact_card_heading" varchar DEFAULT 'Still have questions?';
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "contact_card_description" varchar DEFAULT 'Our team typically responds within a few hours.';
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "contact_card_link_label" varchar DEFAULT 'Contact support';
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "contact_card_link_url" varchar DEFAULT '/contact';
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "eyebrow" varchar DEFAULT 'FAQ';
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "contact_card_enabled" boolean DEFAULT true;
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "contact_card_heading" varchar DEFAULT 'Still have questions?';
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "contact_card_description" varchar DEFAULT 'Our team typically responds within a few hours.';
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "contact_card_link_label" varchar DEFAULT 'Contact support';
  ALTER TABLE "categories_blocks_faq" ADD COLUMN "contact_card_link_url" varchar DEFAULT '/contact';
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "eyebrow" varchar DEFAULT 'FAQ';
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "contact_card_enabled" boolean DEFAULT true;
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "contact_card_heading" varchar DEFAULT 'Still have questions?';
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "contact_card_description" varchar DEFAULT 'Our team typically responds within a few hours.';
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "contact_card_link_label" varchar DEFAULT 'Contact support';
  ALTER TABLE "guides_blocks_faq" ADD COLUMN "contact_card_link_url" varchar DEFAULT '/contact';
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "eyebrow" varchar DEFAULT 'FAQ';
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "contact_card_enabled" boolean DEFAULT true;
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "contact_card_heading" varchar DEFAULT 'Still have questions?';
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "contact_card_description" varchar DEFAULT 'Our team typically responds within a few hours.';
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "contact_card_link_label" varchar DEFAULT 'Contact support';
  ALTER TABLE "_guides_v_blocks_faq" ADD COLUMN "contact_card_link_url" varchar DEFAULT '/contact';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_faq" ALTER COLUMN "heading" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_faq" ALTER COLUMN "heading" DROP DEFAULT;
  ALTER TABLE "categories_blocks_faq" ALTER COLUMN "heading" DROP DEFAULT;
  ALTER TABLE "guides_blocks_faq" ALTER COLUMN "heading" DROP DEFAULT;
  ALTER TABLE "_guides_v_blocks_faq" ALTER COLUMN "heading" DROP DEFAULT;
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "contact_card_enabled";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "contact_card_heading";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "contact_card_description";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "contact_card_link_label";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "contact_card_link_url";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "contact_card_enabled";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "contact_card_heading";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "contact_card_description";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "contact_card_link_label";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "contact_card_link_url";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "contact_card_enabled";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "contact_card_heading";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "contact_card_description";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "contact_card_link_label";
  ALTER TABLE "categories_blocks_faq" DROP COLUMN "contact_card_link_url";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "contact_card_enabled";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "contact_card_heading";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "contact_card_description";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "contact_card_link_label";
  ALTER TABLE "guides_blocks_faq" DROP COLUMN "contact_card_link_url";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "contact_card_enabled";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "contact_card_heading";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "contact_card_description";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "contact_card_link_label";
  ALTER TABLE "_guides_v_blocks_faq" DROP COLUMN "contact_card_link_url";`)
}
