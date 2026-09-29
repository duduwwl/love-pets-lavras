CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`service` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`pet_name` text NOT NULL,
	`pet_type` text NOT NULL,
	`guardian_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`notes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_date` ON `appointments` (`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_phone_created` ON `appointments` (`phone`,`created_at`);--> statement-breakpoint
CREATE TABLE `blocked_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_blocked_date_time` ON `blocked_slots` (`date`,`time`);--> statement-breakpoint
CREATE TABLE `calendar_cells` (
	`date` text NOT NULL,
	`time` text NOT NULL,
	`appointment_id` text,
	`block_id` text,
	PRIMARY KEY(`date`, `time`),
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`block_id`) REFERENCES `blocked_slots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_calendar_cells_appointment` ON `calendar_cells` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `idx_calendar_cells_block` ON `calendar_cells` (`block_id`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`enabled` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_hours` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL,
	`open_time` text NOT NULL,
	`close_time` text NOT NULL
);
