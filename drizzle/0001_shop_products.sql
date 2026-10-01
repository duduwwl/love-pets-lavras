CREATE TABLE IF NOT EXISTS `shop_products` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `description` text NOT NULL,
  `usage` text NOT NULL,
  `selection` text NOT NULL,
  `care` text NOT NULL,
  `image` text NOT NULL,
  `price` text,
  `available` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
