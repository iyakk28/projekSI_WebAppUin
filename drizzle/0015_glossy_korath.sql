ALTER TABLE `dokumentasi_kegiatan` MODIFY COLUMN `tipe_dokumen` varchar(50) NOT NULL DEFAULT 'DOKUMENTASI';--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` MODIFY COLUMN `deskripsi` text NOT NULL;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nama_toko` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nomor_rekening_toko` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nama_pemilik_rekening_toko` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `foto_barang_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `struk_belanja_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nama_penyedia_jasa` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nomor_rekening_jasa` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `nama_pemilik_rekening_jasa` varchar(100);--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `sk_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `spmt_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `amprah_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `npwp_url` text;--> statement-breakpoint
ALTER TABLE `dokumentasi_kegiatan` ADD `ktp_url` text;