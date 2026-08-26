CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `account` (`issuer`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_circle_members` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_circle_members`("id", "circle_id", "user_id", "role", "created_at") SELECT "id", "circle_id", "user_id", "role", "created_at" FROM `circle_members`;--> statement-breakpoint
DROP TABLE `circle_members`;--> statement-breakpoint
ALTER TABLE `__new_circle_members` RENAME TO `circle_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `circle_members_circle_id_user_id_idx` ON `circle_members` (`circle_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `circle_members_circle_id_idx` ON `circle_members` (`circle_id`);--> statement-breakpoint
CREATE TABLE `__new_expense_records` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	`reimbursement_request_id` text,
	`occurred_on` integer NOT NULL,
	`recorded_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reimbursement_request_id`) REFERENCES `reimbursement_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_expense_records`("id", "circle_id", "amount", "description", "source", "reimbursement_request_id", "occurred_on", "recorded_by", "created_at", "updated_at") SELECT "id", "circle_id", "amount", "description", "source", "reimbursement_request_id", "occurred_on", "recorded_by", "created_at", "updated_at" FROM `expense_records`;--> statement-breakpoint
DROP TABLE `expense_records`;--> statement-breakpoint
ALTER TABLE `__new_expense_records` RENAME TO `expense_records`;--> statement-breakpoint
CREATE INDEX `expense_records_circle_id_idx` ON `expense_records` (`circle_id`);--> statement-breakpoint
CREATE INDEX `expense_records_reimbursement_request_id_idx` ON `expense_records` (`reimbursement_request_id`);--> statement-breakpoint
CREATE TABLE `__new_income_records` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`occurred_on` integer NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_income_records`("id", "circle_id", "amount", "description", "occurred_on", "recorded_by", "created_at", "updated_at") SELECT "id", "circle_id", "amount", "description", "occurred_on", "recorded_by", "created_at", "updated_at" FROM `income_records`;--> statement-breakpoint
DROP TABLE `income_records`;--> statement-breakpoint
ALTER TABLE `__new_income_records` RENAME TO `income_records`;--> statement-breakpoint
CREATE INDEX `income_records_circle_id_idx` ON `income_records` (`circle_id`);--> statement-breakpoint
CREATE TABLE `__new_reimbursement_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`payer_name` text NOT NULL,
	`amount` integer NOT NULL,
	`memo` text,
	`receipt_image_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reimbursement_requests`("id", "circle_id", "payer_name", "amount", "memo", "receipt_image_key", "status", "created_at", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at") SELECT "id", "circle_id", "payer_name", "amount", "memo", "receipt_image_key", "status", "created_at", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at" FROM `reimbursement_requests`;--> statement-breakpoint
DROP TABLE `reimbursement_requests`;--> statement-breakpoint
ALTER TABLE `__new_reimbursement_requests` RENAME TO `reimbursement_requests`;--> statement-breakpoint
CREATE INDEX `reimbursement_requests_circle_id_idx` ON `reimbursement_requests` (`circle_id`);--> statement-breakpoint
CREATE INDEX `reimbursement_requests_status_idx` ON `reimbursement_requests` (`status`);