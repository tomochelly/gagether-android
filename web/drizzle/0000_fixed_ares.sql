CREATE TABLE `source_checks` (
	`game_id` text PRIMARY KEY NOT NULL,
	`checked_at` text NOT NULL,
	`status` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
