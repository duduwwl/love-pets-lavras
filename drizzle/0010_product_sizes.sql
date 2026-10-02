ALTER TABLE shop_products ADD COLUMN sizes text NOT NULL DEFAULT '[]';
--> statement-breakpoint
UPDATE shop_products SET sizes = '["P","M","G"]' WHERE id = '10000000-0000-4000-8000-000000000019';
