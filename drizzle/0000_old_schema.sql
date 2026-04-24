CREATE TABLE if not exists  "__drizzle_migrations" (
	id SERIAL PRIMARY KEY,
	hash text NOT NULL,
	created_at numeric
);
CREATE TABLE if not exists `category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_name` text NOT NULL,
	`hue` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE TABLE if not exists `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`amount` real,
	`scheduled_amount` real,
	`scheduled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE if not exists `history_status` (
	`status_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_name` text NOT NULL
);
CREATE TABLE if not exists `item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`unit_id` integer NOT NULL,
	`sum_total` integer DEFAULT true NOT NULL,
	`tags` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`step_size` real DEFAULT 1 NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE if not exists `schedule` (
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
	`cycle_total_days_gen` integer GENERATED ALWAYS AS (cycle_on_days + cycle_off_days) VIRTUAL,
	`start_at` integer DEFAULT (unixepoch('now', 'start of day')) NOT NULL,
	`end_at` integer,
	`day_mask` integer DEFAULT '127' NOT NULL,
	`month_mask` integer DEFAULT '4095' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`due_at` integer,
	`completed_at` integer,
	`migrated_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	last_amount real,
	skipped_at integer,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE if not exists `schedule_status` (
	`status_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_name` text NOT NULL,
	`status_emoji` text NOT NULL
);
CREATE TABLE if not exists `target` (
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
CREATE TABLE if not exists `test` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_mask` integer NOT NULL,
	`some_text` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE TABLE if not exists `unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE UNIQUE INDEX if not exists `category_category_name_unique` ON `category` (`category_name`);
CREATE INDEX if not exists `schedule_id_created_at_ix` ON `history` (`schedule_id`, `created_at`);
CREATE UNIQUE INDEX if not exists `history_status_status_name_unique` ON `history_status` (`status_name`);
CREATE UNIQUE INDEX if not exists `item_item_name_unit_id_unique` ON `item` (`item_name`, `unit_id`);
CREATE UNIQUE INDEX if not exists `schedule_migrated_id_unique` ON `schedule` (`migrated_id`);
CREATE UNIQUE INDEX if not exists `schedule_status_status_name_unique` ON `schedule_status` (`status_name`);
CREATE UNIQUE INDEX if not exists `unit_unit_name_unique` ON `unit` (`unit_name`);
CREATE VIEW if not exists item_view as
select "item"."id",
	"item"."item_name",
	"item"."unit_id",
	"unit"."unit_name",
	"item"."sum_total",
	"item"."tags",
	"item"."step_size",
	"item"."created_at",
	"item"."updated_at"
from "item"
	inner join "unit" on "unit"."id" = "item"."unit_id"
	/* item_view(id,item_name,unit_id,unit_name,sum_total,tags,step_size,created_at,updated_at) */
;
CREATE VIEW if not exists history_view as
select "history"."id",
	"history"."schedule_id",
	"schedule"."item_id",
	"item"."item_name",
	"item"."tags",
	"schedule"."category_id",
	"category"."category_name",
	"item"."unit_id",
	"item"."step_size",
	"unit"."unit_name",
	"history"."amount",
	"history"."scheduled_amount",
	"history_status"."status_id",
	"history_status"."status_name",
	"history"."scheduled_at",
	"history"."created_at"
from "history"
	inner join "schedule" on "schedule"."id" = "history"."schedule_id"
	inner join "item" on "item"."id" = "schedule"."item_id"
	inner join "category" on "category"."id" = "schedule"."category_id"
	inner join "unit" on "unit"."id" = "item"."unit_id"
	inner join "history_status" on "history_status"."status_id" = case
		when coalesce(history.amount, 0) <= 0 then 0
		when history.scheduled_amount is null then 4
		when history.amount < history.scheduled_amount then 1
		when history.amount = history.scheduled_amount then 2
		else 3
	end
	/* history_view(id,schedule_id,item_id,item_name,tags,category_id,category_name,unit_id,step_size,unit_name,amount,scheduled_amount,status_id,status_name,scheduled_at,created_at) */
;
CREATE VIEW if not exists history_newest_view as
select "history_view"."id",
	"history_view"."schedule_id",
	"history_view"."item_id",
	"history_view"."item_name",
	"history_view"."tags",
	"history_view"."category_id",
	"history_view"."category_name",
	"history_view"."unit_id",
	"history_view"."unit_name",
	"history_view"."amount",
	"history_view"."scheduled_amount",
	"history_view"."status_id",
	"history_view"."status_name",
	"history_view"."scheduled_at",
	"history_view"."created_at"
from "history_view"
	left join (
		select "schedule_id",
			max("created_at") as "max_created_at"
		from "history"
		group by "history"."schedule_id"
	) "history_newest" on (
		"history_newest"."schedule_id" = "history_view"."schedule_id"
		and "max_created_at" = "history_view"."created_at"
	)
where (
		"history_newest"."schedule_id" is not null
		or "history_view"."created_at" >= datetime('now', '-1 day')
	)
	/* history_newest_view(id,schedule_id,item_id,item_name,tags,category_id,category_name,unit_id,unit_name,amount,scheduled_amount,status_id,status_name,scheduled_at,created_at) */
;
CREATE VIEW if not exists schedule_view as
select "schedule"."id",
	"schedule"."item_id",
	"item"."item_name",
	"item"."unit_id",
	"unit"."unit_name",
	"schedule"."category_id",
	"category"."category_name",
	"category"."hue",
	"schedule"."hour",
	"schedule"."minute",
	"schedule"."amount",
	"schedule"."repeat_count",
	"schedule"."rest_days",
	"schedule"."cycle_on_days",
	"schedule"."cycle_off_days",
	"schedule"."cycle_total_days_gen",
	"schedule"."start_at",
	"schedule"."end_at",
	(
		cast(
			(unixepoch('now', 'start of day') - start_at) / 86400 as integer
		)
	) %(cycle_total_days_gen) as "cycle_day_num",
	"schedule"."day_mask",
	"schedule"."month_mask",
	"schedule"."enabled",
	"schedule"."sort",
	"item"."tags",
	"item"."step_size",
	"schedule"."due_at",
	"schedule"."completed_at",
	"schedule"."skipped_at",
	"schedule"."last_amount",
	enabled = 1
	and (
		(
			skipped_at is not null
			and skipped_at > coalesce(completed_at, 0)
			and due_at < unixepoch('now', 'start of day', '+2 day')
		)
		or due_at < unixepoch('now', 'start of day')
		or due_at is null
	) as "is_warning",
	due_at is not null
	and (
		completed_at is null
		or unixepoch(completed_at, 'unixepoch', 'start of day') < unixepoch('now', '-1 day', 'start of day')
		or rest_days > 0
		or cycle_on_days > 1
		or cycle_off_days > 0
		or day_mask < 127
		or month_mask < 4095
		or end_at is not null
		or enabled = 0
	) as "is_info",
	"schedule_status"."status_id",
	"schedule_status"."status_name",
	"schedule_status"."status_emoji",
	"schedule"."migrated_id",
	"schedule"."created_at",
	"schedule"."updated_at"
from "schedule"
	inner join "item" on "item"."id" = "schedule"."item_id"
	inner join "category" on "category"."id" = "schedule"."category_id"
	inner join "unit" on "unit"."id" = "item"."unit_id"
	inner join "schedule_status" on "schedule_status"."status_id" = case
		when enabled = 0 then 0
		when due_at is null then 1
		when due_at < unixepoch('now', 'start of day') then 2
		when due_at < unixepoch() then 3
		when due_at < unixepoch('now', 'start of day', '+1 day') then 4
		else 5
	end
	/* schedule_view(id,item_id,item_name,unit_id,unit_name,category_id,category_name,hue,hour,minute,amount,repeat_count,rest_days,cycle_on_days,cycle_off_days,cycle_total_days_gen,start_at,end_at,cycle_day_num,day_mask,month_mask,enabled,sort,tags,step_size,due_at,completed_at,skipped_at,last_amount,is_warning,is_info,status_id,status_name,status_emoji,migrated_id,created_at,updated_at) */
;
CREATE VIEW if not exists water_view as
select "water_target"."item_id",
	"water_target"."target_amount",
	"now_target_amount",
	"last_completed",
	"last_amount",
	"amount_day_0",
	"amount_day_1",
	"amount_day_2",
	"amount_day_3",
	"amount_day_4",
	"amount_day_5",
	"amount_day_6",
	"amount_day_7",
	"amount_day_8",
	"amount_day_9",
	"amount_day_10",
	"amount_day_11",
	"amount_day_12",
	"amount_day_13"
from (
		select "item_id",
			"target_amount",
			round(
				target_amount / iif(
					hour_end = hour_start,
					1.0,
					1.0 *(hour_end - hour_start) /(
						cast(strftime('%H', 'now', 'localtime') as integer) - hour_start
					)
				)
			) as "now_target_amount"
		from "target"
		where "target"."target_name" = 'Water'
	) "water_target"
	inner join (
		select max("created_at") as "last_completed",
			coalesce(
				first_value(amount) over(
					order by created_at desc
				),
				0
			) as "last_amount",
			coalesce(
				sum(amount) filter(
					where created_at >= unixepoch('now', 'start of day')
				),
				0
			) as "amount_day_0",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-1 day') and unixepoch('now', 'start of day')
				),
				0
			) as "amount_day_1",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-2 day') and unixepoch('now', 'start of day', '-1 day')
				),
				0
			) as "amount_day_2",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-3 day') and unixepoch('now', 'start of day', '-2 day')
				),
				0
			) as "amount_day_3",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-4 day') and unixepoch('now', 'start of day', '-3 day')
				),
				0
			) as "amount_day_4",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-5 day') and unixepoch('now', 'start of day', '-4 day')
				),
				0
			) as "amount_day_5",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-6 day') and unixepoch('now', 'start of day', '-5 day')
				),
				0
			) as "amount_day_6",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-7 day') and unixepoch('now', 'start of day', '-6 day')
				),
				0
			) as "amount_day_7",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-8 day') and unixepoch('now', 'start of day', '-7 day')
				),
				0
			) as "amount_day_8",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-9 day') and unixepoch('now', 'start of day', '-8 day')
				),
				0
			) as "amount_day_9",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-10 day') and unixepoch('now', 'start of day', '-9 day')
				),
				0
			) as "amount_day_10",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-11 day') and unixepoch('now', 'start of day', '-10 day')
				),
				0
			) as "amount_day_11",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-12 day') and unixepoch('now', 'start of day', '-11 day')
				),
				0
			) as "amount_day_12",
			coalesce(
				sum(amount) filter(
					where created_at between unixepoch('now', 'start of day', '-13 day') and unixepoch('now', 'start of day', '-12 day')
				),
				0
			) as "amount_day_13"
		from "history_view"
		where (
				"history_view"."item_name" = 'Water'
				and "history_view"."created_at" >= unixepoch('now', 'start of day', '-13 day')
			)
	) "water_history" on 1 = 1
	/* water_view(item_id,target_amount,now_target_amount,last_completed,last_amount,amount_day_0,amount_day_1,amount_day_2,amount_day_3,amount_day_4,amount_day_5,amount_day_6,amount_day_7,amount_day_8,amount_day_9,amount_day_10,amount_day_11,amount_day_12,amount_day_13) */
;
CREATE VIEW if not exists notify_view as
select printf(
		'%s %d %s',
		status_emoji,
		sum(item_count),
		lower(status_name)
	) as "title_part",
	printf(
		'%s %s [%d]: ',
		status_emoji,
		status_name,
		sum(item_count)
	) as "prefix",
	group_concat(
		category_name || ': ' || item_names,
		' ' || status_emoji || ' '
	) as "items"
from (
		select "status_id",
			"status_name",
			"status_emoji",
			"category_name",
			replace(
				group_concat(distinct item_name),
				',',
				' · '
			) as "item_names",
			count(1) as "item_count"
		from (
				select "id",
					"item_id",
					"item_name",
					"unit_id",
					"unit_name",
					"category_id",
					"category_name",
					"hue",
					"hour",
					"minute",
					"amount",
					"repeat_count",
					"rest_days",
					"cycle_on_days",
					"cycle_off_days",
					"cycle_total_days_gen",
					"start_at",
					"end_at",
					"cycle_day_num",
					"day_mask",
					"month_mask",
					"enabled",
					"sort",
					"tags",
					"step_size",
					"due_at",
					"completed_at",
					"skipped_at",
					"last_amount",
					"is_warning",
					"is_info",
					"status_id",
					"status_name",
					"status_emoji",
					"migrated_id",
					"created_at",
					"updated_at"
				from "schedule_view"
				order by "schedule_view"."due_at",
					"schedule_view"."sort",
					"schedule_view"."item_name"
			) "schedule_sort"
		where "schedule_sort"."due_at" < unixepoch('now', 'start of day', '+1 day')
		group by "schedule_sort"."status_id",
			"schedule_sort"."category_id"
		order by "schedule_sort"."status_id",
			"schedule_sort"."category_name"
	) "schedule_today"
group by "schedule_today"."status_id"
order by "schedule_today"."status_id"
	/* notify_view(title_part,prefix,items) */
;
CREATE VIEW if not exists stats_view as
select count(1) filter(
		where status_id = 0
	) as "count_disabled",
	count(1) filter(
		where status_id = 1
	) as "count_not_scheduled",
	count(1) filter(
		where status_id = 2
	) as "count_missed",
	count(1) filter(
		where status_id = 3
	) as "count_due",
	count(1) filter(
		where status_id = 4
	) as "count_later",
	count(1) filter(
		where status_id = 5
	) as "count_scheduled"
from "schedule_view"
	/* stats_view(count_disabled,count_not_scheduled,count_missed,count_due,count_later,count_scheduled) */
;