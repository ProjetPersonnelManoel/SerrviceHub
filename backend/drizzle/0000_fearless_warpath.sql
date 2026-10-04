CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposal_id` int NOT NULL,
	`status` enum('CONFIRMEE','EN_COURS','TERMINEE','ANNULEE') NOT NULL DEFAULT 'CONFIRMEE',
	`started_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_proposal_id_unique` UNIQUE(`proposal_id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`client_id` int NOT NULL,
	`provider_id` int NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_request_provider_uq` UNIQUE(`request_id`,`provider_id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`content` text NOT NULL,
	`attachment` varchar(255),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(150) NOT NULL,
	`content` text,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`provider_id` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`message` text,
	`estimated_days` int,
	`status` enum('EN_ATTENTE','ACCEPTEE','REFUSEE','RETIREE') NOT NULL DEFAULT 'EN_ATTENTE',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_request_provider_uq` UNIQUE(`request_id`,`provider_id`)
);
--> statement-breakpoint
CREATE TABLE `provider_categories` (
	`provider_id` int NOT NULL,
	`category_id` int NOT NULL,
	CONSTRAINT `provider_categories_provider_id_category_id_pk` PRIMARY KEY(`provider_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `provider_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`bio` text,
	`experience_years` int,
	`availability` varchar(255),
	`hourly_rate` decimal(10,2),
	CONSTRAINT `provider_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporter_id` int NOT NULL,
	`target_type` enum('USER','REQUEST','PROPOSAL','MESSAGE','REVIEW') NOT NULL,
	`target_id` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('EN_ATTENTE','EN_COURS','TRAITE','REJETE') NOT NULL DEFAULT 'EN_ATTENTE',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`actor_id` int,
	`old_status` enum('OUVERTE','ATTRIBUEE','EN_COURS','TERMINEE','ANNULEE'),
	`new_status` enum('OUVERTE','ATTRIBUEE','EN_COURS','TERMINEE','ANNULEE') NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `request_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`category_id` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`budget` decimal(10,2),
	`priority` enum('BASSE','NORMALE','HAUTE','URGENTE') NOT NULL DEFAULT 'NORMALE',
	`desired_date` date,
	`status` enum('OUVERTE','ATTRIBUEE','EN_COURS','TERMINEE','ANNULEE') NOT NULL DEFAULT 'OUVERTE',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`booking_id` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_booking_id_unique` UNIQUE(`booking_id`),
	CONSTRAINT `reviews_rating_check` CHECK(`reviews`.`rating` BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('CLIENT','PRESTATAIRE','ADMIN') NOT NULL DEFAULT 'CLIENT',
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`photo` varchar(255),
	`city` varchar(100),
	`email_verified` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_proposal_id_proposals_id_fk` FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_categories_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_client_id_users_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_provider_id_users_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_provider_id_users_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provider_categories` ADD CONSTRAINT `provider_categories_provider_id_users_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provider_categories` ADD CONSTRAINT `provider_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provider_profiles` ADD CONSTRAINT `provider_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_users_id_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_events` ADD CONSTRAINT `request_events_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_events` ADD CONSTRAINT `request_events_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_client_id_users_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_booking_id_bookings_id_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `messages_conversation_created_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `requests_status_idx` ON `requests` (`status`);