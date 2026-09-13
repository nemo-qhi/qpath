ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','teacher') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `classes` ADD `codeExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `classes` ADD `codeIsActive` boolean DEFAULT true NOT NULL;