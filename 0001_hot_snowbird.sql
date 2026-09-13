CREATE TABLE `battleRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`classId` int NOT NULL,
	`createdBy` int NOT NULL,
	`status` enum('waiting','active','finished') NOT NULL DEFAULT 'waiting',
	`quizzes` json,
	`currentQuizIndex` int NOT NULL DEFAULT 0,
	`maxParticipants` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`finishedAt` timestamp,
	CONSTRAINT `battleRooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `battleRooms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `battleScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`correctCount` int NOT NULL DEFAULT 0,
	`participationPoints` int NOT NULL DEFAULT 0,
	`speedPoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `battleScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `quizAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`answer` text NOT NULL,
	`isCorrect` boolean NOT NULL,
	`viewedExplanation` boolean NOT NULL DEFAULT false,
	`retryCount` int NOT NULL DEFAULT 0,
	`timeSpent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('great','difficult','interesting') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`classId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('multiple_choice','fill_blank') NOT NULL,
	`content` json NOT NULL,
	`explanation` text NOT NULL,
	`tags` json,
	`isPublished` boolean NOT NULL DEFAULT true,
	`answerCount` int NOT NULL DEFAULT 0,
	`correctCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` varchar(100);