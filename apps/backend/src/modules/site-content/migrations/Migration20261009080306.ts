import { Migration } from '@mikro-orm/migrations';

export class Migration20261009080306 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "content_block" ("id" text not null, "collection" text not null, "key" text null, "title" text null, "subtitle" text null, "description" text null, "image" text null, "value" text null, "link_label" text null, "link_href" text null, "rank" integer not null default 0, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "content_block_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_content_block_deleted_at" ON "content_block" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_content_block_collection" ON "content_block" (collection) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "content_block" cascade;`);
  }

}
