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
	`at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
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
	`at`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
)
SELECT
	`id`,
	`scheduleId`,
	`itemId`,
	`categoryId`,
	`unitId`,
	`scheduledAmount`,
	`scheduledAt`,
	`amount`,
	`createdAt`,
	`createdAt`,
	`updatedAt`,
	`deletedAt`
FROM `history_old`;
--> statement-breakpoint
DROP TABLE `history_old`;
CREATE INDEX `ix_history_deletedAt` ON `history` (`deletedAt`);--> statement-breakpoint
CREATE INDEX `ix_history_scheduleId_deletedAt` ON `history` (`scheduleId`,`deletedAt`);