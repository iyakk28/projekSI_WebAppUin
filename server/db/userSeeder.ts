// seed.ts
import { sql } from "drizzle-orm";
import { useDrizzle } from "./index";
import {
  fakultasTable,
  programStudiTable,
  ormawaTable,
  usersTable,
  pengajuanRabTable,
  kegiatanTable,
  tagihanPencairanTable,
  pembayaranTable,
  lpgTable,
  revisiLpgLogTable,
  approvalLogTable,
} from "./schema/index";

const db = useDrizzle();

async function seed() {
  console.log("🌱 Cleaning database tables...");

  // Disable foreign key checks to allow truncating
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
  
  // Truncate all tables in reverse order of dependencies
  const tables = [
    "audit_log",
    "log_dokumentasi_tagihan",
    "revisi_lpg_log",
    "lpg",
    "pembayaran",
    "tagihan_pencairan",
    "dokumentasi_kegiatan",
    "kegiatan",
    "approval_log",
    "pengajuan_rab",
    "users",
    "ormawa",
    "program_studi",
    "fakultas",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql`TRUNCATE TABLE ${sql.raw(table)}`);
      console.log(`🧹 Truncated table: ${table}`);
    } catch (err) {
      console.warn(`⚠️ Warning: Could not truncate ${table}, trying to delete instead:`, err);
      try {
        await db.execute(sql`DELETE FROM ${sql.raw(table)}`);
      } catch (delErr) {
        console.error(`❌ Failed to clear table ${table}:`, delErr);
      }
    }
  }

  // Re-enable foreign key checks
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

  console.log("🌱 Seeding restored & dummy data...");

  // ============================================
  // 1. FAKULTAS
  // ============================================
  const [fakultasTeknik] = await db
    .insert(fakultasTable)
    .values({ nama: "Fakultas Teknik", kode: "1" })
    .$returningId();
  const fakultasTeknikId = fakultasTeknik!.id;

  const [fakultasEkonomi] = await db
    .insert(fakultasTable)
    .values({ nama: "Fakultas Ekonomi", kode: "2" })
    .$returningId();
  const fakultasEkonomiId = fakultasEkonomi!.id;

  // New Faculty: Fakultas Ekonomi dan Bisnis Islam (FEBI)
  const [fakultasFebi] = await db
    .insert(fakultasTable)
    .values({ nama: "Fakultas Ekonomi dan Bisnis Islam", kode: "FEBI" })
    .$returningId();
  const fakultasFebiId = fakultasFebi!.id;

  // ============================================
  // 2. PROGRAM STUDI
  // ============================================
  const [prodiTi] = await db
    .insert(programStudiTable)
    .values({
      nama: "Teknik Informatika",
      kode: "101",
      fakultasId: fakultasTeknikId,
    })
    .$returningId();
  const prodiTiId = prodiTi!.id;

  const [prodiManajemen] = await db
    .insert(programStudiTable)
    .values({ nama: "Manajemen", kode: "102", fakultasId: fakultasEkonomiId })
    .$returningId();
  const prodiManajemenId = prodiManajemen!.id;

  // 7 Prodi FEBI
  const prodisFebiData = [
    { nama: "Sistem Informasi", kode: "SI" },
    { nama: "Akuntansi Syariah", kode: "AS" },
    { nama: "Ekonomi Syariah", kode: "ES" },
    { nama: "Manajemen Bisnis Syariah", kode: "MBS" },
    { nama: "Pariwisata Syariah", kode: "PS" },
    { nama: "Manajemen Zakat dan Wakaf", kode: "MZW" },
    { nama: "Perbankan Syariah", kode: "PBS" },
  ];

  const prodiFebiIds: Record<string, number> = {};
  for (const p of prodisFebiData) {
    const [inserted] = await db
      .insert(programStudiTable)
      .values({
        nama: p.nama,
        kode: p.kode,
        fakultasId: fakultasFebiId,
      })
      .$returningId();
    prodiFebiIds[p.kode] = inserted.id;
  }

  // ============================================
  // 3. ORMAWA
  // ============================================
  const [ormawaHimati] = await db
    .insert(ormawaTable)
    .values({
      nama: "Himpunan Mahasiswa Teknik Informatika",
      kode: "201",
      totalAnggaran: 50000000,
      prodiId: prodiTiId,
      fakultasId: fakultasTeknikId,
    })
    .$returningId();
  const ormawaHimatiId = ormawaHimati!.id;

  const [ormawaBem] = await db
    .insert(ormawaTable)
    .values({
      nama: "BEM Fakultas Ekonomi",
      kode: "202",
      totalAnggaran: 75000000,
      prodiId: prodiManajemenId,
      fakultasId: fakultasEkonomiId,
    })
    .$returningId();
  const ormawaBemId = ormawaBem!.id;

  // 7 Ormawa FEBI
  const ormawasFebiData = [
    { nama: "HMPS Sistem Informasi", kode: "HMPS-SI", prodiKode: "SI" },
    { nama: "HMPS Akuntansi Syariah", kode: "HMPS-AS", prodiKode: "AS" },
    { nama: "HMPS Ekonomi Syariah", kode: "HMPS-ES", prodiKode: "ES" },
    { nama: "HMPS Manajemen Bisnis Syariah", kode: "HMPS-MBS", prodiKode: "MBS" },
    { nama: "HMPS Pariwisata Syariah", kode: "HMPS-PS", prodiKode: "PS" },
    { nama: "HMPS Manajemen Zakat dan Wakaf", kode: "HMPS-MZW", prodiKode: "MZW" },
    { nama: "HMPS Perbankan Syariah", kode: "HMPS-PBS", prodiKode: "PBS" },
  ];

  const ormawaFebiIds: Record<string, number> = {};
  for (const o of ormawasFebiData) {
    const [inserted] = await db
      .insert(ormawaTable)
      .values({
        nama: o.nama,
        kode: o.kode,
        totalAnggaran: 100000000,
        prodiId: prodiFebiIds[o.prodiKode],
        fakultasId: fakultasFebiId,
      })
      .$returningId();
    ormawaFebiIds[o.kode] = inserted.id;
  }

  // ============================================
  // 4. USERS
  // ============================================
  // Original Users
  const [userKaprodiTi] = await db.insert(usersTable).values({
    userName: "1",
    email: "kaprodi@univ.ac.id",
    passwordHash: "pass123",
    fullName: "Kaprodi Teknik Informatika",
    role: "kaprodi",
    isActive: true,
    prodiId: prodiTiId,
    ormawaId: null,
    fakultasId: null,
  }).$returningId();

  // FIX 1: Melengkapi prodiId dan fakultasId untuk Ketua HIMATI
  const [userOrmawaHimati] = await db.insert(usersTable).values({
    userName: "2",
    email: "ormawa@univ.ac.id",
    passwordHash: "pass123",
    fullName: "Ketua HIMATI",
    role: "ormawa",
    isActive: true,
    prodiId: prodiTiId,
    ormawaId: ormawaHimatiId,
    fakultasId: fakultasTeknikId,
  }).$returningId();

  const [userPpkFt] = await db.insert(usersTable).values({
    userName: "3",
    email: "ppk@univ.ac.id",
    passwordHash: "pass123",
    fullName: "PPK Fakultas Teknik",
    role: "ppk",
    isActive: true,
    prodiId: null,
    ormawaId: null,
    fakultasId: fakultasTeknikId,
  }).$returningId();

  const [userSpiSatu] = await db.insert(usersTable).values({
    userName: "4",
    email: "spi@univ.ac.id",
    passwordHash: "pass123",
    fullName: "SPI Satu",
    role: "spi",
    isActive: true,
    prodiId: null,
    ormawaId: null,
    fakultasId: null,
  }).$returningId();

  // 1 PPK FEBI
  const [userPpkFebi] = await db.insert(usersTable).values({
    userName: "ppk_febi",
    email: "ppkfebi@univ.ac.id",
    passwordHash: "pass123",
    fullName: "PPK FEBI",
    role: "ppk",
    isActive: true,
    prodiId: null,
    ormawaId: null,
    fakultasId: fakultasFebiId,
  }).$returningId();

  // 1 SPI FEBI
  const [userSpiFebi] = await db.insert(usersTable).values({
    userName: "spi_febi",
    email: "spifebi@univ.ac.id",
    passwordHash: "pass123",
    fullName: "SPI FEBI",
    role: "spi",
    isActive: true,
    prodiId: null,
    ormawaId: null,
    fakultasId: null,
  }).$returningId();

  // 7 Kaprodi & 7 Ormawa Users under FEBI
  const ormawaUsers: Record<string, number> = {};
  const kaprodiUsers: Record<string, number> = {};

  for (const o of ormawasFebiData) {
    const prodiId = prodiFebiIds[o.prodiKode];
    const ormawaId = ormawaFebiIds[o.kode];

    const [uKaprodi] = await db.insert(usersTable).values({
      userName: `kaprodi_${o.prodiKode.toLowerCase()}`,
      email: `kaprodi.${o.prodiKode.toLowerCase()}@univ.ac.id`,
      passwordHash: "pass123",
      fullName: `Kaprodi ${o.nama.replace("HMPS ", "")}`,
      role: "kaprodi",
      isActive: true,
      prodiId: prodiId,
      ormawaId: null,
      fakultasId: null,
    }).$returningId();
    kaprodiUsers[o.prodiKode] = uKaprodi.id;

    // FIX 2: Melengkapi prodiId dan fakultasId untuk semua Ketua HMPS di bawah FEBI
    const [uOrmawa] = await db.insert(usersTable).values({
      userName: `ormawa_${o.prodiKode.toLowerCase()}`,
      email: `ormawa.${o.prodiKode.toLowerCase()}@univ.ac.id`,
      passwordHash: "pass123",
      fullName: `Ketua ${o.nama}`,
      role: "ormawa",
      isActive: true,
      prodiId: prodiId,
      ormawaId: ormawaId,
      fakultasId: fakultasFebiId,
    }).$returningId();
    ormawaUsers[o.prodiKode] = uOrmawa.id;
  }

  // ============================================
  // 5. SUBMISSIONS (PENGAJUAN RAB) & TRANSACTIONS
  // ============================================
  console.log("🌱 Seeding ~30 dummy submissions...");

  const activitiesList = [
    { title: "Seminar Nasional Kebangsaan", desc: "Meningkatkan wawasan kebangsaan mahasiswa." },
    { title: "Workshop Kepemimpinan dan Manajemen", desc: "Pelatihan kepemimpinan dasar organisasi." },
    { title: "Bakti Sosial Ramadhan Berbagi", desc: "Penyaluran sembako dan bantuan ke panti asuhan." },
    { title: "Lomba Karya Tulis Ilmiah", desc: "Kompetisi akademik tingkat universitas." },
    { title: "Studi Banding Kelembagaan", desc: "Kunjungan kerja ke universitas mitra." },
    { title: "Festival Seni dan Budaya Islam", desc: "Pentas seni mahasiswa bernuansa Islami." },
    { title: "Webinar Kewirausahaan Kreatif", desc: "Mengembangkan jiwa entrepreneur muda." },
  ];

  const statuses = [
    "waiting_kaprodi",
    "revisi_kaprodi",
    "waiting_ppk",
    "revisi_ppk",
    "waiting_spi",
    "revisi_spi",
    "ditolak_spi",
    "disetujui",
    "lunas_ppk",
    "waiting_spi_lpj", 
    "revisi_spi_lpj",  
    "selesai_spi",
  ];

  let pengajuanCount = 0;

  for (let i = 1; i <= 33; i++) {
    const ormawaIndex = (i - 1) % ormawasFebiData.length;
    const ormawaConfig = ormawasFebiData[ormawaIndex];
    const prodiId = prodiFebiIds[ormawaConfig.prodiKode];
    const ormawaId = ormawaFebiIds[ormawaConfig.kode];
    const ormawaUserId = ormawaUsers[ormawaConfig.prodiKode];
    const kaprodiUserId = kaprodiUsers[ormawaConfig.prodiKode];

    const activity = activitiesList[(i - 1) % activitiesList.length];
    const statusType = statuses[(i - 1) % statuses.length];

    const nomorPengajuan = `REQ-FEBI-${ormawaConfig.prodiKode}-${String(i).padStart(4, "0")}`;
    const budget = 3000000 + (i * 350000);

    let dbStatus: any = statusType;
    if (statusType === "waiting_spi_lpj" || statusType === "revisi_spi_lpj") {
      dbStatus = "lunas_ppk"; 
    }

    const [rab] = await db.insert(pengajuanRabTable).values({
      nomorPengajuan,
      usersId: String(ormawaUserId),
      judulKegiatan: `${activity.title} - ${ormawaConfig.nama}`,
      deskripsi: `${activity.desc} Diselenggarakan oleh ${ormawaConfig.nama}.`,
      fileRabUrl: "uploads/dummy/rab_dummy.pdf",
      fileTorUrl: "uploads/dummy/tor_dummy.pdf",
      totalAnggaran: String(budget),
      fakultasId: String(fakultasFebiId),
      prodiId: String(prodiId),
      ormawaId: String(ormawaId),
      tanggalMulai: "2026-07-01",
      tanggalSelesai: "2026-07-05",
      status: dbStatus,
    }).$returningId();

    const rabId = rab.id;
    pengajuanCount++;

    if (statusType === "revisi_kaprodi") {
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: kaprodiUserId,
        action: "revisi",
        catatanRevisi: "Harap perbaiki rincian anggaran konsumsi dan narasumber.",
      });
    } else if (statusType === "waiting_ppk") {
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: kaprodiUserId,
        action: "setuju",
        catatanRevisi: "Direkomendasikan Kaprodi.",
      });
    } else if (statusType === "revisi_ppk") {
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: kaprodiUserId,
        action: "setuju",
        catatanRevisi: "Direkomendasikan Kaprodi.",
      });
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: userPpkFebi.id,
        action: "revisi",
        catatanRevisi: "Rincian tor belum sesuai standar biaya umum.",
      });
    } else if (statusType === "waiting_spi" || statusType === "revisi_spi" || statusType === "ditolak_spi" || statusType === "disetujui" || statusType === "lunas_ppk" || statusType === "waiting_spi_lpj" || statusType === "revisi_spi_lpj" || statusType === "selesai_spi") {
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: kaprodiUserId,
        action: "setuju",
        catatanRevisi: "Disetujui tingkat program studi.",
      });
      await db.insert(approvalLogTable).values({
        pengajuanRabId: rabId,
        actorId: userPpkFebi.id,
        action: "setuju",
        catatanRevisi: "Disetujui tingkat fakultas.",
      });

      if (statusType === "revisi_spi") {
        await db.insert(approvalLogTable).values({
          pengajuanRabId: rabId,
          actorId: userSpiFebi.id,
          action: "revisi",
          catatanRevisi: "File excel RAB dan Tor berbeda jumlah nominalnya.",
        });
      } else if (statusType === "ditolak_spi") {
        await db.insert(approvalLogTable).values({
          pengajuanRabId: rabId,
          actorId: userSpiFebi.id,
          action: "tolak",
          catatanRevisi: "Kegiatan tidak relevan dengan program tahunan fakultas.",
        });
      }
    }

    const hasKegiatan = [
      "disetujui",
      "lunas_ppk",
      "waiting_spi_lpj",
      "revisi_spi_lpj",
      "selesai_spi",
    ].includes(statusType);

    if (hasKegiatan) {
      const isLunas = [
        "lunas_ppk",
        "waiting_spi_lpj",
        "revisi_spi_lpj",
        "selesai_spi",
      ].includes(statusType);

      const [kegiatan] = await db.insert(kegiatanTable).values({
        pengajuanRabId: rabId,
        ormawaId: ormawaId,
        statusKegiatan: isLunas ? "LUNAS" : "BELUM_DILAKSANAKAN",
      }).$returningId();

      const kegiatanId = kegiatan.id;

      if (isLunas) {
        const [tagihanJasa] = await db.insert(tagihanPencairanTable).values({
          kegiatanId: kegiatanId,
          tipeTagihan: "JASA",
          fakultasId: String(fakultasFebiId),
          prodiId: String(prodiId),
          userId: ormawaUserId,
          namaPenerima: `Narasumber ${activity.title}`,
          rekeningPenerima: "0099887766",
          nominal: String(budget * 0.4),
          statusTagihan: "SELESAI",
          createdBy: ormawaUserId,
        }).$returningId();

        await db.insert(pembayaranTable).values({
          tagihanId: tagihanJasa.id,
          ppkId: userPpkFebi.id,
          fakultasId: fakultasFebiId,
          buktiTransferUrl: "uploads/dummy/transfer_dummy.png",
          catatanPembayaran: "Lunas transfer narasumber.",
        });

        const [tagihanBarang] = await db.insert(tagihanPencairanTable).values({
          kegiatanId: kegiatanId,
          tipeTagihan: "BARANG",
          fakultasId: String(fakultasFebiId),
          prodiId: String(prodiId),
          userId: ormawaUserId,
          namaPenerima: `Toko ATK & Perlengkapan`,
          rekeningPenerima: "1122334455",
          nominal: String(budget * 0.6),
          statusTagihan: "SELESAI",
          createdBy: ormawaUserId,
        }).$returningId();

        await db.insert(pembayaranTable).values({
          tagihanId: tagihanBarang.id,
          ppkId: userPpkFebi.id,
          fakultasId: fakultasFebiId,
          buktiTransferUrl: "uploads/dummy/transfer_dummy.png",
          catatanPembayaran: "Lunas transfer belanja ATK.",
        });

        const hasLpg = [
          "waiting_spi_lpj",
          "revisi_spi_lpj",
          "selesai_spi",
        ].includes(statusType);

        if (hasLpg) {
          let lpgStatus: any = "WAITING_SPI";
          if (statusType === "revisi_spi_lpj") {
            lpgStatus = "REVISI_SPI";
          } else if (statusType === "selesai_spi") {
            lpgStatus = "DISETUJUI";
          }

          const [lpg] = await db.insert(lpgTable).values({
            kegiatanId: kegiatanId,
            rabId: rabId,
            fileLpgUrl: "uploads/dummy/lpj_dummy.pdf",
            statusLpg: lpgStatus,
            uploadedBy: ormawaUserId,
            spiNotes: statusType === "selesai_spi" ? "Laporan LPJ dinyatakan lengkap dan valid." : undefined,
            approvedBy: statusType === "selesai_spi" ? userSpiFebi.id : null,
            approvedAt: statusType === "selesai_spi" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
          }).$returningId();

          if (statusType === "revisi_spi_lpj") {
            await db.insert(revisiLpgLogTable).values({
              lpgId: lpg.id,
              requesterId: userSpiFebi.id,
              catatanRevisi: "Nota konsumsi konsumsi konsumsi belum distempel resmi toko.",
            });
          }
        }
      }
    }
  }

  console.log(`✅ Seeding completed! Total ${pengajuanCount} submissions created.`);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});