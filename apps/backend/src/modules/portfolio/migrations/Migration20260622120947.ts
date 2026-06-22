import { Migration } from '@mikro-orm/migrations';

export class Migration20260622120947 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "portfolio_work" ("id" text not null, "service_type" text not null, "title" text not null, "description" text null, "car" text null, "materials" text null, "date_label" text null, "thumbnail" text null, "images" jsonb null, "rank" integer not null default 0, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "portfolio_work_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_portfolio_work_deleted_at" ON "portfolio_work" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "portfolio_work" cascade;`);
  }

}
