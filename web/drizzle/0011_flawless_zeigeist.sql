CREATE TABLE `official_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`region` text NOT NULL,
	`locale` text NOT NULL,
	`url` text NOT NULL,
	`payload` text NOT NULL,
	`body_hash` text NOT NULL,
	`reviewed_hash` text,
	`status` text NOT NULL,
	`checked_at` text NOT NULL,
	`verified_at` text,
	`entry_ids` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `official_documents_review` ON `official_documents` (`status`,`checked_at`);