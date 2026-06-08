import { Migration } from '@mikro-orm/migrations';

export class Migration20260528105938 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" add column if not exists "tracking_number" text null, add column if not exists "tracking_url" text null, add column if not exists "shipping_carrier" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" drop column if exists "tracking_number", drop column if exists "tracking_url", drop column if exists "shipping_carrier";`);
  }

}
