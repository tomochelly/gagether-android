CREATE TABLE `forum_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`parent_id` text,
	`account_id` text NOT NULL,
	`author` text NOT NULL,
	`locale` text NOT NULL,
	`body` text NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_comments_post` ON `forum_comments` (`post_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `forum_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`account_id` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_likes_post` ON `forum_likes` (`post_id`);--> statement-breakpoint
CREATE TABLE `forum_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `forum_media` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`account_id` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_media_post` ON `forum_media` (`post_id`);--> statement-breakpoint
CREATE INDEX `forum_media_account` ON `forum_media` (`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`account_id` text NOT NULL,
	`author` text NOT NULL,
	`category` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`document` text NOT NULL,
	`plain_text` text NOT NULL,
	`content_hash` text NOT NULL,
	`spoiler` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_posts_game` ON `forum_posts` (`game_id`,`state`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `forum_posts_author` ON `forum_posts` (`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `forum_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`comment_id` text,
	`account_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_reports_post` ON `forum_reports` (`post_id`);