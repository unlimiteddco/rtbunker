import { Migration } from '@mikro-orm/migrations';

export class Migration20260602073105 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "membership" drop constraint if exists "membership_stripe_subscription_id_unique";`);
    this.addSql(`create table if not exists "membership" ("id" text not null, "customer_id" text not null, "tier" text check ("tier" in ('bronce', 'plata', 'gold')) not null, "status" text check ("status" in ('incomplete', 'active', 'past_due', 'canceled')) not null default 'incomplete', "stripe_customer_id" text null, "stripe_subscription_id" text null, "current_period_end" timestamptz null, "cancel_at_period_end" boolean not null default false, "credits_balance" integer not null default 0, "credits_renews_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_deleted_at" ON "membership" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_customer_id" ON "membership" (customer_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_membership_stripe_subscription_id_unique" ON "membership" (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "membership" cascade;`);
  }

}
