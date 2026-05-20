ALTER TABLE `kegiatan` MODIFY COLUMN `status_kegiatan` enum('BELUM_DILAKSANAKAN','SEDANG_DILAKSANAKAN','SELESAI') NOT NULL DEFAULT 'BELUM_DILAKSANAKAN';--> statement-breakpoint
ALTER TABLE `kegiatan` DROP COLUMN `tanggal_mulai`;--> statement-breakpoint
ALTER TABLE `kegiatan` DROP COLUMN `tanggal_selesai`;