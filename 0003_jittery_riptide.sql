CREATE TABLE `learningProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`masteredCount` int NOT NULL DEFAULT 0,
	`reviewedCount` int NOT NULL DEFAULT 0,
	`totalLearningTime` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalLearningCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`quizId` int NOT NULL,
	`status` enum('learning','mastered','reviewing') NOT NULL DEFAULT 'learning',
	`reviewCount` int NOT NULL DEFAULT 0,
	`masteredAt` timestamp,
	`lastReviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalLearningCards_id` PRIMARY KEY(`id`)
);
