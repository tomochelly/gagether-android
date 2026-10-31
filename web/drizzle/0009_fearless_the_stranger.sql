CREATE TABLE `feedback_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`category` text NOT NULL,
	`game_id` text,
	`region` text NOT NULL,
	`locale` text NOT NULL,
	`message` text NOT NULL,
	`source_url` text NOT NULL,
	`reply_to` text NOT NULL,
	`page_url` text NOT NULL,
	`attachments` text NOT NULL,
	`state` text DEFAULT 'new' NOT NULL,
	`mail_state` text DEFAULT 'queued' NOT NULL,
	`mail_token` text,
	`mail_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_requests_request_key_unique` ON `feedback_requests` (`request_key`);--> statement-breakpoint
CREATE INDEX `feedback_mail_queue` ON `feedback_requests` (`mail_state`,`created_at`);