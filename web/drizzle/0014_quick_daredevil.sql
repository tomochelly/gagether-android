CREATE TABLE `visitor_oauth_challenges` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`code_verifier` text NOT NULL,
	`origin` text NOT NULL,
	`locale` text NOT NULL,
	`return_to` text NOT NULL,
	`session_hash` text,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitor_oauth_challenges_expiry` ON `visitor_oauth_challenges` (`expires_at`);--> statement-breakpoint
ALTER TABLE `visitor_accounts` ADD `provider` text DEFAULT 'google' NOT NULL;