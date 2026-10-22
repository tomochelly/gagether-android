CREATE TABLE `refresh_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`last_started_at` text,
	`last_finished_at` text,
	`result` text
);
