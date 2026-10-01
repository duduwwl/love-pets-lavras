ALTER TABLE shop_products ADD COLUMN stock_quantity integer;
--> statement-breakpoint
ALTER TABLE shop_products ADD COLUMN illustrative integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE shop_products ADD COLUMN image_col integer;
--> statement-breakpoint
ALTER TABLE shop_products ADD COLUMN image_row integer;
--> statement-breakpoint
ALTER TABLE shop_products ADD COLUMN image_cols integer;
--> statement-breakpoint
ALTER TABLE shop_products ADD COLUMN image_rows integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS catalog_bootstrap (key text PRIMARY KEY NOT NULL, applied_at text NOT NULL DEFAULT CURRENT_TIMESTAMP);
