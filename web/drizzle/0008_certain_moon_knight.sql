CREATE TABLE `community_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`account_id` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `community_reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_likes_review` ON `community_likes` (`review_id`);--> statement-breakpoint
CREATE TABLE `community_limits` (
	`account_id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`account_id` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `community_reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_reports_review` ON `community_reports` (`review_id`);--> statement-breakpoint
CREATE TABLE `community_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`target` text NOT NULL,
	`entry_id` text NOT NULL,
	`member` text NOT NULL,
	`account_id` text NOT NULL,
	`author` text NOT NULL,
	`stars` integer NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_reviews_target` ON `community_reviews` (`target`,`hidden`,`updated_at`);