CREATE TABLE `owner_secret_handoffs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`key_id` text NOT NULL,
	`ciphertext` text,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
