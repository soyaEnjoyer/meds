CREATE TABLE `category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL,
	`hue` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`amount` real,
	`scheduled_amount` real,
	`scheduled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `history_status` (
	`status_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`unit_id` integer NOT NULL,
	`sum_total` integer DEFAULT true NOT NULL,
	`tags` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`hour` integer DEFAULT 7 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 1 NOT NULL,
	`repeat_count` integer DEFAULT 1 NOT NULL,
	`rest_days` integer DEFAULT 0 NOT NULL,
	`cycle_on_days` integer DEFAULT 0 NOT NULL,
	`cycle_off_days` integer DEFAULT 0 NOT NULL,
	`cycle_total_days_gen` integer GENERATED ALWAYS AS (cycle_on_days+cycle_off_days) VIRTUAL,
	`start_at` integer DEFAULT (unixepoch('now','start of day')) NOT NULL,
	`end_at` integer,
	`day_mask` integer DEFAULT '127' NOT NULL,
	`month_mask` integer DEFAULT '4095' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`due_at` integer,
	`completed_at` integer,
	`last_amount` real,
	`skipped_at` integer,
	`migrated_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_status` (
	`status_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_name` text NOT NULL,
	`status_emoji` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `target` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer,
	`category_id` integer,
	`unit_id` integer,
	`schedule_id` integer,
	`target_name` text NOT NULL,
	`target_amount` real NOT NULL,
	`num_days` integer DEFAULT 1 NOT NULL,
	`hour_start` integer DEFAULT 0 NOT NULL,
	`hour_end` integer DEFAULT 23 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_mask` integer NOT NULL,
	`some_text` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_category_name_unique` ON `category` (`category_name`);--> statement-breakpoint
CREATE INDEX `schedule_id_created_at_ix` ON `history` (`schedule_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `history_status_status_name_unique` ON `history_status` (`status_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `item_item_name_unit_id_unique` ON `item` (`item_name`,`unit_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_migrated_id_unique` ON `schedule` (`migrated_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_status_status_name_unique` ON `schedule_status` (`status_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `unit_unit_name_unique` ON `unit` (`unit_name`);