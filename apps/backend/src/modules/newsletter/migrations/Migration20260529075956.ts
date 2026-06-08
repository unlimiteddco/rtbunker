import { Migration } from '@mikro-orm/migrations';

export class Migration20260529075956 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "newsletter_subscriber" ("id" text not null, "email" text not null, "consent_given" boolean not null default false, "coupon_code" text null, "source" text null, "ip" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_deleted_at" ON "newsletter_subscriber" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "newsletter_subscriber" cascade;`);
  }

}
