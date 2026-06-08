import { Migration } from '@mikro-orm/migrations';

export class Migration20260528100620 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "custom_order" ("id" text not null, "customer_email" text not null, "customer_name" text null, "customer_phone" text null, "shape" text not null, "material" text not null, "size_id" text null, "width_cm" integer null, "height_cm" integer null, "units" integer not null, "unit_price" integer not null, "total_price" integer not null, "design_file_url" text null, "design_file_name" text null, "customer_notes" text null, "status" text not null default 'pending_review', "proofs" jsonb null, "admin_notes" text null, "cart_id" text null, "order_id" text null, "magic_token" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "custom_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_custom_order_deleted_at" ON "custom_order" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "custom_order" cascade;`);
  }

}
