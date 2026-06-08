import { Migration } from '@mikro-orm/migrations';

export class Migration20260604063240 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" add column if not exists "priority" boolean not null default false, add column if not exists "membership_tier" text null, add column if not exists "paid_with_credits" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" drop column if exists "priority", drop column if exists "membership_tier", drop column if exists "paid_with_credits";`);
  }

}
