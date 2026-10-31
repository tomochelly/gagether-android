CREATE TABLE `visitor_profiles` (
	`account_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `visitor_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
