import { Migration } from '@mikro-orm/migrations';

export class Migration20260819091251 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "featured_category" ("id" text not null, "category_handle" text not null, "label" text null, "image" text null, "rank" integer not null default 0, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "featured_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_featured_category_deleted_at" ON "featured_category" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "process_step" ("id" text not null, "title" text not null, "description" text null, "badge" text null, "icon" text null, "rank" integer not null default 0, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "process_step_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_process_step_deleted_at" ON "process_step" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "service_item" ("id" text not null, "eyebrow" text null, "title" text not null, "description" text null, "bullets" jsonb null, "cta_label" text null, "cta_href" text null, "icon" text null, "image" text null, "featured" boolean not null default false, "rank" integer not null default 0, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_item_deleted_at" ON "service_item" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "featured_category" cascade;`);

    this.addSql(`drop table if exists "process_step" cascade;`);

    this.addSql(`drop table if exists "service_item" cascade;`);
  }

}
