DROP INDEX `category_category_name_unique`;--> statement-breakpoint
DROP INDEX `history_status_status_name_unique`;--> statement-breakpoint
DROP INDEX `item_item_name_unit_id_unique`;--> statement-breakpoint
DROP INDEX `schedule_id_created_at_ix`;--> statement-breakpoint
DROP INDEX `schedule_migrated_id_unique`;--> statement-breakpoint
DROP INDEX `schedule_status_status_name_unique`;--> statement-breakpoint
DROP INDEX `unit_unit_name_unique`;--> statement-breakpoint


ALTER TABLE `unit` RENAME TO `unit_old`; --> statement-breakpoint
CREATE TABLE `unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unit_name_unique` ON `unit` (`name`);--> statement-breakpoint
INSERT INTO `unit` (
	`id`,
	`name`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
)
SELECT
	`id`,
	`unit_name`,
	`created_at` * 1000,
	`updated_at` * 1000,
	NULL
FROM `unit_old`;
--> statement-breakpoint


ALTER TABLE `category` RENAME TO `category_old`; --> statement-breakpoint
CREATE TABLE `category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique` ON `category` (`name`);--> statement-breakpoint
INSERT INTO `category` (
	`id`,
	`name`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
) SELECT
	`id`,
	`category_name`,
	`created_at` * 1000,
	`updated_at` * 1000,
	NULL
FROM `category_old`;
--> statement-breakpoint


ALTER TABLE `item` RENAME TO `item_old`; --> statement-breakpoint
CREATE TABLE `item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`defaultCategoryId` integer NOT NULL,
	`defaultUnitId` integer NOT NULL,
	`defaultAmount` real DEFAULT 1 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`defaultCategoryId`) REFERENCES `category`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`defaultUnitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_name_unique` ON `item` (`name`);--> statement-breakpoint
INSERT INTO `item` (
	`id`,
	`name`,
	`defaultCategoryId`,
	`defaultUnitId`,
	`defaultAmount`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
)
SELECT
	`id`,
	`item_name`,
	-- TODO: items with no schedule and therefore no category will need to be manually assigned
	COALESCE(`schedule_last`.`category_id`, -1),
	`unit_id`,
	COALESCE(`schedule_last`.`amount`, 1),
	`created_at` * 1000,
	`updated_at` * 1000,
	NULL
FROM `item_old`
LEFT JOIN (
	SELECT
		`schedule`.`item_id`,
		FIRST_VALUE(`schedule`.`category_id`) OVER `win` AS `category_id`,
		FIRST_VALUE(`schedule`.`amount`) OVER `win` AS `amount`
	FROM `schedule`
	GROUP BY
		`schedule`.`item_id`
	WINDOW `win` AS (
		PARTITION BY `item_id`
		ORDER BY
			`schedule`.`completed_at` DESC,
			`schedule`.`enabled` DESC
	)
) AS `schedule_last` ON
	`schedule_last`.`item_id` = `item_old`.`id`
WHERE true
-- previous schema allowed for duplicate names with different units
ON CONFLICT DO NOTHING;
--> statement-breakpoint


ALTER TABLE `schedule` RENAME TO `schedule_old`; --> statement-breakpoint
CREATE TABLE `schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itemId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`unitId` integer NOT NULL,
	`amount` real NOT NULL,
	`cycleOnDays` integer DEFAULT 0 NOT NULL,
	`cycleOffDays` integer DEFAULT 0 NOT NULL,
	`restDays` integer DEFAULT 0 NOT NULL,
	`repeatCount` integer DEFAULT 1 NOT NULL,
	`dayMask` integer DEFAULT 127 NOT NULL,
	`monthMask` integer DEFAULT 4095 NOT NULL,
	`hour` integer DEFAULT 7 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`startAt` integer DEFAULT (unixepoch('now','start of day')) NOT NULL,
	`endAt` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`adHoc` integer DEFAULT false NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`dueAt` integer,
	`skippedAt` integer,
	`completedAt` integer,
	`lastAmount` real,
	`createdAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE cascade ON DELETE cascade
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scheduleUnique` ON `schedule` (`categoryId`,`itemId`,`unitId`,`hour`,`minute`);--> statement-breakpoint
INSERT INTO `schedule` (
	`id`,
	`itemId`,
	`categoryId`,
	`unitId`,
	`amount`,
	`cycleOnDays`,
	`cycleOffDays`,
	`restDays`,
	`repeatCount`,
	`dayMask`,
	`monthMask`,
	`hour`,
	`minute`,
	`startAt`,
	`endAt`,
	`enabled`,
	`adHoc`,
	`sort`,
	`dueAt`,
	`skippedAt`,
	`completedAt`,
	`lastAmount`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
)
SELECT
	`id`,
	-- item may have been remapped
	(SELECT `item`.`id` FROM `item` INNER JOIN `item_old` ON `item_old`.`item_name` = `item`.`name` WHERE `item_old`.`id` = `schedule_old`.`item_id`),
	`category_id`,
	(SELECT `item_old`.`unit_id` FROM `item_old` WHERE `item_old`.`id` = `schedule_old`.`item_id`),
	`amount`,
	`cycle_on_days`,
	`cycle_off_days`,
	`rest_days`,
	`repeat_count`,
	`day_mask`,
	`month_mask`,
	`hour`,
	`minute`,
	`start_at` * 1000,
	`end_at` * 1000,
	`enabled`,
	FALSE,
	`sort`,
	`due_at` * 1000,
	`skipped_at` * 1000,
	`completed_at` * 1000,
	`last_amount`,
	`created_at` * 1000,
	`updated_at` * 1000,
	NULL
FROM `schedule_old`;
--> statement-breakpoint


ALTER TABLE `history` RENAME TO `history_old`; --> statement-breakpoint
CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scheduleId` integer NOT NULL,
	`itemId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`unitId` integer NOT NULL,
	`scheduledAmount` real,
	`scheduledAt` integer,
	`amount` real,
	`createdAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`scheduleId`) REFERENCES `schedule`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE cascade ON DELETE cascade
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `history` (
	`id`,
	`scheduleId`,
	`itemId`,
	`categoryId`,
	`unitId`,
	`scheduledAmount`,
	`scheduledAt`,
	`amount`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
)
SELECT
	`history_old`.`id`,
	`history_old`.`schedule_id`,
	`schedule_old`.`item_id`,
	`schedule_old`.`category_id`,
	`item_old`.`unit_id`,
	`history_old`.`scheduled_amount`,
	`history_old`.`scheduled_at` * 1000,
	`history_old`.`amount`,
	`history_old`.`created_at` * 1000,
	`history_old`.`created_at` * 1000,
	NULL
FROM `history_old`
LEFT JOIN `schedule_old` ON `schedule_old`.`id` = `history_old`.`schedule_id`
LEFT JOIN `item_old` ON `item_old`.`id` = `schedule_old`.`item_id`;
--> statement-breakpoint


DROP TABLE `category_old`;--> statement-breakpoint
DROP TABLE `history_old`;--> statement-breakpoint
DROP TABLE `item_old`;--> statement-breakpoint
DROP TABLE `schedule_old`;--> statement-breakpoint
DROP TABLE `unit_old`;--> statement-breakpoint

DROP TABLE `history_status`;--> statement-breakpoint
DROP TABLE `schedule_status`;--> statement-breakpoint
DROP TABLE `target`;--> statement-breakpoint
DROP TABLE `test`;--> statement-breakpoint

DROP VIEW `history_newest_view`;--> statement-breakpoint
DROP VIEW `history_view`;--> statement-breakpoint
DROP VIEW `item_view`;--> statement-breakpoint
DROP VIEW `notify_view`;--> statement-breakpoint
DROP VIEW `schedule_view`;--> statement-breakpoint
DROP VIEW `stats_view`;--> statement-breakpoint
DROP VIEW `water_view`;