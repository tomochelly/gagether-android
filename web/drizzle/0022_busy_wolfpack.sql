CREATE TABLE `owner_push_sends` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_id` text NOT NULL,
	`draft_revision` integer NOT NULL,
	`owner_id` text NOT NULL,
	`game_id` text NOT NULL,
	`locale` text NOT NULL,
	`topic` text NOT NULL,
	`payload` text NOT NULL,
	`payload_hash` text NOT NULL,
	`state` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`provider_id` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `owner_push_sends_audience` ON `owner_push_sends` (`game_id`,`locale`,`updated_at`);--> statement-breakpoint
CREATE INDEX `owner_push_sends_payload` ON `owner_push_sends` (`payload_hash`,`state`,`created_at`);