CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
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
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "generations_status_check" CHECK("generations"."status" IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'expired')),
	CONSTRAINT "generations_type_check" CHECK("generations"."type" IN ('video', 'image', 'storyboard', 'music'))
);
--> statement-breakpoint
CREATE INDEX `generations_user_id_idx` ON `generations` (`user_id`);--> statement-breakpoint
CREATE INDEX `generations_type_idx` ON `generations` (`type`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`error` text,
	`prompt` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`reference_id` text,
	`usage` text,
	`estimated_cost` text,
	`total_cost` text,
	`generation_time` text,
	`latency` text,
	`count` integer,
	`background` text,
	`moderation` text,
	`quality` text,
	`size` text,
	`mode` text,
	`input_fidelity` text,
	`source_images` text,
	`mask` text,
	`path` text,
	`source_url` text,
	`mime_type` text,
	`width` integer,
	`height` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "images_input_fidelity_check" CHECK("images"."input_fidelity" IS NULL OR "images"."input_fidelity" IN ('low', 'high'))
);
--> statement-breakpoint
CREATE INDEX `images_user_id_idx` ON `images` (`user_id`);--> statement-breakpoint
CREATE INDEX `images_generation_id_idx` ON `images` (`generation_id`);--> statement-breakpoint
CREATE INDEX `images_batch_id_idx` ON `images` (`batch_id`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text NOT NULL,
	`source_prompt` text DEFAULT '' NOT NULL,
	`source_url` text,
	`title` text DEFAULT '' NOT NULL,
	`style_notes` text DEFAULT '[]' NOT NULL,
	`characters` text DEFAULT '[]' NOT NULL,
	`page_count` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stories_generation_id_unique` ON `stories` (`generation_id`);--> statement-breakpoint
CREATE INDEX `stories_user_id_idx` ON `stories` (`user_id`);--> statement-breakpoint
CREATE INDEX `stories_generation_id_idx` ON `stories` (`generation_id`);--> statement-breakpoint
CREATE TABLE `story_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`story_id` text NOT NULL,
	`name` text NOT NULL,
	`image_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `story_characters_story_id_idx` ON `story_characters` (`story_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `story_characters_story_id_name_unique` ON `story_characters` (`story_id`,`name`);--> statement-breakpoint
CREATE TABLE `story_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`story_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`panel_count` integer NOT NULL,
	`characters` text DEFAULT '[]' NOT NULL,
	`original_content` text DEFAULT '' NOT NULL,
	`image_prompt` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `story_pages_user_id_idx` ON `story_pages` (`user_id`);--> statement-breakpoint
CREATE INDEX `story_pages_story_id_idx` ON `story_pages` (`story_id`);--> statement-breakpoint
CREATE INDEX `story_pages_story_page_number_idx` ON `story_pages` (`story_id`,`page_number`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`cloudflare_access_key_id` text,
	`cloudflare_r2_endpoint_url` text,
	`cloudflare_secret_access_key` text,
	`deepseek_api_key` text,
	`atlas_cloud_api_key` text,
	`kie_api_key` text,
	`openrouter_api_key` text,
	`openai_api_key` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`prompt` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`reference_id` text,
	`usage` text,
	`cost_type` text,
	`estimated_cost` text,
	`total_cost` text,
	`generation_time` text,
	`latency` text,
	`job_id` text NOT NULL,
	`aspect_ratio` text,
	`resolution` text,
	`duration` integer,
	`input_video_duration` integer,
	`generate_audio` integer DEFAULT true NOT NULL,
	`path` text,
	`input_references` text,
	`frame_first` text,
	`frame_last` text,
	`provider` text,
	`elapsed` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_job_id_unique` ON `videos` (`job_id`);--> statement-breakpoint
CREATE INDEX `videos_user_id_idx` ON `videos` (`user_id`);--> statement-breakpoint
CREATE INDEX `videos_generation_id_idx` ON `videos` (`generation_id`);