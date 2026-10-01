ALTER TABLE appointments ADD COLUMN taxydog integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE appointments ADD COLUMN pickup_address text;
