CREATE TABLE `adminCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`createdBy` int NOT NULL,
	`usedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `adminCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminCodes_code_unique` UNIQUE(`code`)
);
