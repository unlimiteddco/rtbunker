import { Migration } from '@mikro-orm/migrations';

export class Migration20260618171940 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" add column if not exists "product_type" text null, add column if not exists "cut_type" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "custom_order" drop column if exists "product_type", drop column if exists "cut_type";`);
  }

}
