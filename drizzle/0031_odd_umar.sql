ALTER TABLE `users` RENAME COLUMN `users_id` TO `user_name`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_users_id_unique`;--> statement-breakpoint
ALTER TABLE `approval_log` DROP FOREIGN KEY `approval_log_pengajuan_rab_id_pengajuan_rab_id_fk`;
--> statement-breakpoint
ALTER TABLE `pengajuan_rab` DROP FOREIGN KEY `pengajuan_rab_users_id_users_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `kegiatan` ADD `ormawa_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `lpg` ADD `rab_id` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `ormawa` ADD `ormawa_fakultas` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pembayaran` ADD `fakultas_id` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `pengajuan_rab` ADD `ormawa_id` varchar(50) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `tagihan_pencairan` ADD `user_id` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_user_name_unique` UNIQUE(`user_name`);--> statement-breakpoint
ALTER TABLE `approval_log` ADD CONSTRAINT `approval_log_pengajuan_rab_id_pengajuan_rab_id_fk` FOREIGN KEY (`pengajuan_rab_id`) REFERENCES `pengajuan_rab`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_ormawa_id_ormawa_id_fk` FOREIGN KEY (`ormawa_id`) REFERENCES `ormawa`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lpg` ADD CONSTRAINT `lpg_rab_id_pengajuan_rab_id_fk` FOREIGN KEY (`rab_id`) REFERENCES `pengajuan_rab`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_fakultas_id_fakultas_id_fk` FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_rab` ADD CONSTRAINT `pengajuan_rab_users_id_users_id_fk` FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pengajuan_rab` ADD CONSTRAINT `pengajuan_rab_ormawa_id_ormawa_id_fk` FOREIGN KEY (`ormawa_id`) REFERENCES `ormawa`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagihan_pencairan` ADD CONSTRAINT `tagihan_pencairan_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagihan_pencairan` DROP COLUMN `bukti_pembayaran_url`;