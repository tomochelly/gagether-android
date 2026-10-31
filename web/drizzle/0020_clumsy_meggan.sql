CREATE TABLE `gfl2_record_limits` (
	`account_id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gfl2_record_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`account_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `gfl2_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gfl2_record_reports_record` ON `gfl2_record_reports` (`record_id`);--> statement-breakpoint
CREATE TABLE `gfl2_records` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`author` text NOT NULL,
	`mode` text NOT NULL,
	`cycle_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`party_key` text NOT NULL,
	`max_chain` integer NOT NULL,
	`payload` text NOT NULL,
	`duration_ms` integer,
	`score` integer,
	`state` text DEFAULT 'public' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gfl2_records_cohort` ON `gfl2_records` (`mode`,`cycle_id`,`state`,`stage_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `gfl2_records_account` ON `gfl2_records` (`account_id`,`cycle_id`,`stage_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `gfl2_setups` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gfl2_setups_account` ON `gfl2_setups` (`account_id`,`updated_at`);