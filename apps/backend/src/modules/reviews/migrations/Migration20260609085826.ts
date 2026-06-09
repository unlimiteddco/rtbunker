import { Migration } from '@mikro-orm/migrations';

export class Migration20260609085826 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "images" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "images";`);
  }

}
