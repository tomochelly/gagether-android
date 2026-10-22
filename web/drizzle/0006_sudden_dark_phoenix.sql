CREATE TABLE `visitor_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`google_subject` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visitor_accounts_google_subject_unique` ON `visitor_accounts` (`google_subject`);--> statement-breakpoint
CREATE TABLE `visitor_login_challenges` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitor_login_challenges_expiry` ON `visitor_login_challenges` (`expires_at`);--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visitor_sessions_expiry` ON `visitor_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `visitor_sessions_account` ON `visitor_sessions` (`account_id`);