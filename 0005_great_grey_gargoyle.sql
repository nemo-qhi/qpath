CREATE TABLE `quizFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`createdBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `quizzes` ADD `fileId` int;