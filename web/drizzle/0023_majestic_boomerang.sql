CREATE TABLE `orbit_beta_votes` (
	`campaign` text NOT NULL,
	`voter` text NOT NULL,
	`choice` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`campaign`, `voter`)
);
