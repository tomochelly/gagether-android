CREATE TABLE `usage_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage_views` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	`view` text NOT NULL,
	`game_id` text
);
--> statement-breakpoint
CREATE TABLE `usage_visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`device` text NOT NULL,
	`locale` text NOT NULL,
	`referrer` text NOT NULL
);
