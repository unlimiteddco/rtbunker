import { Migration } from '@mikro-orm/migrations';

export class Migration20260529110011 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review_request" drop constraint if exists "review_request_order_id_unique";`);
    this.addSql(`alter table if exists "review" drop constraint if exists "review_product_id_email_unique";`);
    this.addSql(`create table if not exists "review" ("id" text not null, "product_id" text not null, "product_title" text null, "product_handle" text null, "product_thumbnail" text null, "customer_id" text null, "order_id" text null, "email" text not null, "name" text null, "rating" integer not null, "title" text null, "content" text null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "verified_purchase" boolean not null default false, "admin_response" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_product_id_email_unique" ON "review" (product_id, email) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_request" ("id" text not null, "order_id" text not null, "email" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_request_deleted_at" ON "review_request" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_request_order_id_unique" ON "review_request" (order_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);

    this.addSql(`drop table if exists "review_request" cascade;`);
  }

}
