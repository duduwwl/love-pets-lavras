ALTER TABLE shop_products ADD COLUMN flavors text NOT NULL DEFAULT '[]';
--> statement-breakpoint
UPDATE shop_products SET name = 'OneByOne Fit 50 g', description = 'Snack mastigável OneByOne Fit para cães, 50 g. Escolha entre Maçã com cenoura e quinoa, Manga com beterraba e linhaça ou Morango com batata-doce e chia.', flavors = '["Maçã","Manga","Morango"]', updated_at = CURRENT_TIMESTAMP WHERE id = '10000000-0000-4000-8000-000000000008';
--> statement-breakpoint
DELETE FROM shop_products WHERE id IN ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000010');
