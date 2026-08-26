CREATE TABLE `bank_transfer_deposits` (
	`id` text PRIMARY KEY NOT NULL,
	`virtual_account_id` text NOT NULL,
	`gmo_notification_id` text NOT NULL,
	`amount` integer NOT NULL,
	`deposited_at` integer NOT NULL,
	`matched_subscription_payment_id` text,
	`raw_payload` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`virtual_account_id`) REFERENCES `virtual_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`matched_subscription_payment_id`) REFERENCES `subscription_payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_transfer_deposits_gmo_notification_id_idx` ON `bank_transfer_deposits` (`gmo_notification_id`);--> statement-breakpoint
CREATE INDEX `bank_transfer_deposits_virtual_account_id_idx` ON `bank_transfer_deposits` (`virtual_account_id`);--> statement-breakpoint
CREATE TABLE `circle_members` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circle_members_circle_id_user_id_idx` ON `circle_members` (`circle_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `circle_members_circle_id_idx` ON `circle_members` (`circle_id`);--> statement-breakpoint
CREATE TABLE `circles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`public_token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circles_public_token_idx` ON `circles` (`public_token`);--> statement-breakpoint
CREATE TABLE `expense_records` (
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
	FOREIGN KEY (`reimbursement_request_id`) REFERENCES `reimbursement_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_records_circle_id_idx` ON `expense_records` (`circle_id`);--> statement-breakpoint
CREATE INDEX `expense_records_reimbursement_request_id_idx` ON `expense_records` (`reimbursement_request_id`);--> statement-breakpoint
CREATE TABLE `income_records` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`occurred_on` integer NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `income_records_circle_id_idx` ON `income_records` (`circle_id`);--> statement-breakpoint
CREATE TABLE `reimbursement_requests` (
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
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reimbursement_requests_circle_id_idx` ON `reimbursement_requests` (`circle_id`);--> statement-breakpoint
CREATE INDEX `reimbursement_requests_status_idx` ON `reimbursement_requests` (`status`);--> statement-breakpoint
CREATE TABLE `subscription_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`external_reference` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscription_payments_subscription_id_idx` ON `subscription_payments` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`payment_method` text NOT NULL,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`square_customer_id` text,
	`square_subscription_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_circle_id_idx` ON `subscriptions` (`circle_id`);--> statement-breakpoint
CREATE TABLE `virtual_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`bank_name` text NOT NULL,
	`branch_name` text NOT NULL,
	`account_type` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder_name` text NOT NULL,
	`gmo_account_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `virtual_accounts_circle_id_idx` ON `virtual_accounts` (`circle_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `virtual_accounts_gmo_account_id_idx` ON `virtual_accounts` (`gmo_account_id`);