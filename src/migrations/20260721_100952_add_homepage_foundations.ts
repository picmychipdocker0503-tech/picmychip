import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_content_type" AS ENUM('article', 'video');
  CREATE TYPE "public"."enum__guides_v_version_content_type" AS ENUM('article', 'video');
  CREATE TYPE "public"."enum_site_settings_announcement_bar_messages_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"icon_id" integer,
  	"description" varchar,
  	"body" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "newsletter_subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"subscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_announcement_bar_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"link_type" "enum_site_settings_announcement_bar_messages_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar
  );
  
  CREATE TABLE "site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  ALTER TABLE "guides" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "guides" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "guides" ADD COLUMN "content_type" "enum_guides_content_type" DEFAULT 'article';
  ALTER TABLE "guides" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN "version_cover_image_id" integer;
  ALTER TABLE "_guides_v" ADD COLUMN "version_excerpt" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN "version_content_type" "enum__guides_v_version_content_type" DEFAULT 'article';
  ALTER TABLE "_guides_v" ADD COLUMN "version_video_url" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_subscribers_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_bar_dismissible" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_bar_rotate_seconds" numeric DEFAULT 5;
  ALTER TABLE "services" ADD CONSTRAINT "services_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_announcement_bar_messages" ADD CONSTRAINT "site_settings_announcement_bar_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "services_icon_idx" ON "services" USING btree ("icon_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
  CREATE INDEX "newsletter_subscribers_updated_at_idx" ON "newsletter_subscribers" USING btree ("updated_at");
  CREATE INDEX "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");
  CREATE INDEX "site_settings_announcement_bar_messages_order_idx" ON "site_settings_announcement_bar_messages" USING btree ("_order");
  CREATE INDEX "site_settings_announcement_bar_messages_parent_id_idx" ON "site_settings_announcement_bar_messages" USING btree ("_parent_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_pages_id_idx" ON "site_settings_rels" USING btree ("pages_id");
  ALTER TABLE "guides" ADD CONSTRAINT "guides_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk" FOREIGN KEY ("newsletter_subscribers_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_cover_image_idx" ON "guides" USING btree ("cover_image_id");
  CREATE INDEX "_guides_v_version_version_cover_image_idx" ON "_guides_v" USING btree ("version_cover_image_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_newsletter_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletter_subscribers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_announcement_bar_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "services" CASCADE;
  DROP TABLE "newsletter_subscribers" CASCADE;
  DROP TABLE "site_settings_announcement_bar_messages" CASCADE;
  DROP TABLE "site_settings_rels" CASCADE;
  ALTER TABLE "guides" DROP CONSTRAINT "guides_cover_image_id_media_id_fk";
  
  ALTER TABLE "_guides_v" DROP CONSTRAINT "_guides_v_version_cover_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk";
  
  DROP INDEX "guides_cover_image_idx";
  DROP INDEX "_guides_v_version_version_cover_image_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_newsletter_subscribers_id_idx";
  ALTER TABLE "guides" DROP COLUMN "cover_image_id";
  ALTER TABLE "guides" DROP COLUMN "excerpt";
  ALTER TABLE "guides" DROP COLUMN "content_type";
  ALTER TABLE "guides" DROP COLUMN "video_url";
  ALTER TABLE "_guides_v" DROP COLUMN "version_cover_image_id";
  ALTER TABLE "_guides_v" DROP COLUMN "version_excerpt";
  ALTER TABLE "_guides_v" DROP COLUMN "version_content_type";
  ALTER TABLE "_guides_v" DROP COLUMN "version_video_url";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_subscribers_id";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_bar_dismissible";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_bar_rotate_seconds";
  DROP TYPE "public"."enum_guides_content_type";
  DROP TYPE "public"."enum__guides_v_version_content_type";
  DROP TYPE "public"."enum_site_settings_announcement_bar_messages_link_type";`)
}
