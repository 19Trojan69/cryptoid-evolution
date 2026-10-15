CREATE TABLE `diagnostic_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`received_at` integer NOT NULL,
	`client_version` text NOT NULL,
	`trace_json` text NOT NULL
);
