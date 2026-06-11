import { defineEventHandler, readBody, createError } from "h3";
import { useDrizzle } from "../../../db/index";
import { eq } from "drizzle-orm";
import { lpgTable } from "../../../db/schema/lpgSchema";
import { revisiLpgLogTable } from "../../../db/schema/revisiLpgLogSchema";
import { pengajuanRabTable } from "../../../db/schema/pengajuanRabSchema";
import { kegiatanTable } from "../../../db/schema/KegiatanSchema";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "spi") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { lpgId, action, notes } = body; // action: 'approve' | 'revision'

  if (!lpgId || !action) {
    throw createError({ statusCode: 400, message: "Data tidak lengkap" });
  }

  const db = useDrizzle();
  const idLpg = Number(lpgId);
  const idUser = Number(user.id);

  try {
    const status = action === "approve" ? "DISETUJUI" : "REVISI_SPI";
    const finalNotes = action === "approve" ? (notes || "Laporan Pertanggungjawaban telah disetujui oleh SPI.") : notes;

    if (action === "revision" && !notes) {
      throw createError({ statusCode: 400, message: "Catatan revisi wajib diisi" });
    }
    
    await db.transaction(async (tx) => {
      // Update LPG status
      const updateData: any = { 
        statusLpg: status,
        spiNotes: finalNotes,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      if (action === "approve") {
        updateData.approvedBy = idUser;
        updateData.approvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else {
        updateData.lastRevisedBy = idUser;
      }

      await tx.update(lpgTable)
        .set(updateData)
        .where(eq(lpgTable.id, idLpg));

      // If revision, add to log
      if (action === "revision") {
        await tx.insert(revisiLpgLogTable).values({
          lpgId: idLpg,
          requesterId: idUser,
          catatanRevisi: finalNotes,
        });
      }

      // If approved, update RAB status to 'selesai_spi'
      if (action === "approve") {
        const lpg = await tx.query.lpgTable.findFirst({
            where: eq(lpgTable.id, idLpg)
        });

        if (lpg) {
            const kegiatan = await tx.query.kegiatanTable.findFirst({
                where: eq(kegiatanTable.id, lpg.kegiatanId)
            });

            if (kegiatan) {
                await tx.update(pengajuanRabTable)
                    .set({ status: 'selesai_spi' })
                    .where(eq(pengajuanRabTable.id, kegiatan.pengajuanRabId));
            }
        }
      }
    });

    return {
      success: true,
      message: action === "approve" ? "LPG disetujui" : "Revisi LPG dikirim",
    };
  } catch (error: any) {
    console.error("Error reviewing LPG:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server saat memproses review LPG: " + error.message,
    });
  }
});
