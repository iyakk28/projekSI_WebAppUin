<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between gap-4">
        <button
          @click="$router.push('/dashboard/ppk/pencairan')"
          class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali ke Daftar
        </button>
        <h2 class="text-lg font-bold text-slate-900" v-if="data?.kegiatan">
          Dokumentasi Kegiatan:
          <span class="text-[#d1a82a]">{{ data.kegiatan.judulKegiatan }}</span>
        </h2>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8" v-if="data">
      <!-- Activity Summary Info -->
      <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">
            Judul Kegiatan
          </p>
          <p class="font-bold text-slate-800">
            {{ data.kegiatan.judulKegiatan }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">
            Ormawa / Pengaju
          </p>
          <p class="font-bold text-slate-600">
            {{ data.kegiatan.ormawaName }} / {{ data.kegiatan.pengajuNama }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">
            Status Kegiatan
          </p>
          <span
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
            :class="
              data.kegiatan.statusKegiatan === 'LUNAS'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            "
          >
            {{ data.kegiatan.statusKegiatan }}
          </span>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">
            Total Anggaran
          </p>
          <p class="font-bold text-[#d1a82a] text-xl">
            {{ formatRp(data.kegiatan.totalAnggaran) }}
          </p>
        </div>
      </div>

      <!-- Payment Progress Banner -->
      <div
        class="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border"
        :class="
          data.kegiatan.statusKegiatan === 'LUNAS'
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-white border-slate-200'
        "
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :class="
              data.kegiatan.statusKegiatan === 'LUNAS'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-blue-50 text-blue-500'
            "
          >
            <Icon
              :name="
                data.kegiatan.statusKegiatan === 'LUNAS'
                  ? 'heroicons:check-circle'
                  : 'heroicons:banknotes'
              "
              class="w-7 h-7"
            />
          </div>
          <div>
            <h3 class="font-bold text-slate-800">Progres Pelunasan Anggaran</h3>
            <p class="text-sm text-slate-500">
              Total Dibayar:
              <span class="font-bold text-[#d1a82a]">{{
                formatRp(data.totalDibayar)
              }}</span>
              dari
              <span class="font-bold">{{
                formatRp(data.kegiatan.totalAnggaran)
              }}</span>
            </p>
          </div>
        </div>

        <div v-if="data.kegiatan.statusKegiatan !== 'LUNAS'">
          <button
            @click="handleConfirmLunas"
            :disabled="!data.isReadyForLunas || loading"
            class="px-8 py-3 rounded-xl font-bold text-white transition shadow-lg disabled:opacity-50 disabled:shadow-none"
            :class="
              data.isReadyForLunas
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-slate-300 cursor-not-allowed'
            "
          >
            {{ loading ? "Memproses..." : "Konfirmasi Kegiatan Lunas" }}
          </button>
          <p
            v-if="!data.isReadyForLunas"
            class="text-[10px] text-red-400 mt-2 text-center font-medium italic"
          >
            * Anggaran belum terpenuhi untuk pelunasan
          </p>
        </div>

        <div
          v-else
          class="flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-lg text-emerald-700"
        >
          <Icon name="heroicons:sparkles" class="w-5 h-5" />
          <span class="text-sm font-bold uppercase"
            >Kegiatan Ini Sudah Lunas</span
          >
        </div>
      </div>

      <div
        v-if="successMsg"
        class="bg-emerald-100 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl font-medium text-sm text-center"
      >
        {{ successMsg }}
      </div>
      <div
        v-if="error"
        class="bg-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-xl font-medium text-sm text-center"
      >
        {{ error }}
      </div>

      <!-- RAB & TOR Preview Section -->
      <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div
          class="p-5 border-b border-slate-200 flex items-center justify-between"
        >
          <div>
            <h3 class="text-lg font-bold text-slate-900">RAB & TOR Pembanding</h3>
            <p class="text-sm text-slate-500">
              Gunakan berkas ini untuk memvalidasi dokumentasi yang diunggah
            </p>
          </div>
          <button
            @click="showRabTor = !showRabTor"
            class="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
          >
            <Icon
              :name="showRabTor ? 'heroicons:eye-slash' : 'heroicons:eye'"
              class="w-4 h-4"
            />
            {{ showRabTor ? "Sembunyikan Berkas" : "Lihat RAB & TOR" }}
          </button>
        </div>

        <div v-if="showRabTor" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h4 class="font-bold text-slate-700 flex items-center gap-2">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-[#d1a82a]" />
              Dokumen RAB
            </h4>
            <div
              class="aspect-[3/4] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative group"
            >
              <iframe
                v-if="rabBlobUrl"
                :src="rabBlobUrl"
                class="w-full h-full border-none"
              ></iframe>
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                <div class="flex flex-col items-center gap-2">
                  <Icon name="heroicons:document-magnifying-glass" class="w-8 h-8 opacity-20" />
                  <p class="text-xs italic">Memuat Berkas RAB...</p>
                </div>
              </div>
              <div
                v-if="rabBlobUrl"
                class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition"
              >
                <a
                  :href="rabBlobUrl"
                  target="_blank"
                  class="p-2 bg-white rounded-full shadow-lg text-[#d1a82a] hover:scale-110 transition flex items-center justify-center"
                >
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="font-bold text-slate-700 flex items-center gap-2">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-[#d1a82a]" />
              Dokumen TOR
            </h4>
            <div
              class="aspect-[3/4] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative group"
            >
              <iframe
                v-if="torBlobUrl"
                :src="torBlobUrl"
                class="w-full h-full border-none"
              ></iframe>
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                <div class="flex flex-col items-center gap-2">
                  <Icon name="heroicons:document-magnifying-glass" class="w-8 h-8 opacity-20" />
                  <p class="text-xs italic">Memuat Berkas TOR...</p>
                </div>
              </div>
              <div
                v-if="torBlobUrl"
                class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition"
              >
                <a
                  :href="torBlobUrl"
                  target="_blank"
                  class="p-2 bg-white rounded-full shadow-lg text-[#d1a82a] hover:scale-110 transition flex items-center justify-center"
                >
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Documentation List -->
      <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div
          class="p-5 border-b border-slate-200 flex items-center justify-between"
        >
          <div>
            <h3 class="text-lg font-bold text-slate-900">
              List Dokumentasi & Tagihan
            </h3>
            <p class="text-sm text-slate-500">
              Tinjau seluruh berkas yang diunggah
            </p>
          </div>

          <div class="flex items-center gap-4">
            <label class="text-sm font-semibold text-slate-700"
              >Filter Status Dokumen:</label
            >
            <select
              v-model="filterDocStatus"
              class="text-sm border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="ALL">Semua Berkas</option>
              <option value="REVISI">Perlu Revisi</option>
              <option value="TERVERIFIKASI">Terverifikasi / Diterima</option>
              <option value="LUNAS">Sudah Dibayar</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Tipe
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Keterangan / Deskripsi
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">
                  Tanggal Upload
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-500">
                  Biaya
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">
                  Status
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="doc in filteredDocs"
                :key="doc.id + doc.type"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <td class="py-4 px-4">
                  <span
                    class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase"
                  >
                    {{
                      doc.type === "foto"
                        ? "Dokumentasi"
                        : "Tagihan " + doc.tipeDokumen
                    }}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-700 font-medium">
                  {{ doc.deskripsi }}
                </td>
                <td class="py-4 px-4 text-slate-500">
                  {{ formatDate(doc.createdAt) }}
                </td>
                <td
                  class="py-4 px-4 text-right font-bold"
                  :class="doc.nominal > 0 ? 'text-[#d1a82a]' : 'text-slate-300'"
                >
                  {{ doc.nominal > 0 ? formatRp(doc.nominal) : "-" }}
                </td>
                <td class="py-4 px-4 text-center">
                  <span
                    class="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                    :class="statusClass(doc.status)"
                  >
                    {{ doc.status }}
                  </span>
                </td>
                <td class="py-4 px-4 text-center">
                  <NuxtLink
                    :to="`/dashboard/ppk/detailPencairan/${kegiatanId}/dokumentasi/${doc.id}?type=${doc.type}`"
                    class="px-4 py-1.5 rounded-lg bg-[#3b5988] text-white text-xs font-bold hover:bg-[#2d4570] transition shadow-md"
                  >
                    Detail Berkas
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="filteredDocs.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400 italic">
                  Tidak ada dokumentasi yang cocok dengan filter
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <div v-else class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#d1a82a] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat detail...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from "pinia";
  import { usePpkActivityDetailStore } from "~/stores/ppk/activityDetail";

  const route = useRoute();
  const kegiatanId = Number(route.params.id);

  const store = usePpkActivityDetailStore();
  const { data, loading, error, successMsg, filterDocStatus, filteredDocs } =
    storeToRefs(store);
  const { fetchDetail, confirmLunas } = store;

  const showRabTor = ref(false);
  const rabBlobUrl = ref<string | null>(null);
  const torBlobUrl = ref<string | null>(null);

  const fetchFileBlob = async (fileType: "fileRabUrl" | "fileTorUrl") => {
    try {
      const response = await $fetch<Blob>("/api/ppk/pencairan/view-rab-tor", {
        method: "POST",
        body: { kegiatanId, fileType },
        responseType: "blob",
      });
      return URL.createObjectURL(response);
    } catch (err) {
      console.error(`Gagal memuat ${fileType}:`, err);
      return null;
    }
  };

  watch(showRabTor, async (val) => {
    if (val) {
      if (!rabBlobUrl.value) {
        rabBlobUrl.value = await fetchFileBlob("fileRabUrl");
      }
      if (!torBlobUrl.value) {
        torBlobUrl.value = await fetchFileBlob("fileTorUrl");
      }
    }
  });

  onUnmounted(() => {
    if (rabBlobUrl.value) URL.revokeObjectURL(rabBlobUrl.value);
    if (torBlobUrl.value) URL.revokeObjectURL(torBlobUrl.value);
  });

  onMounted(() => {
    fetchDetail(kegiatanId);
  });

  const formatRp = (val: any) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "WAITING_PEMBAYARAN":
      case "MENUNGGU":
        return "bg-amber-100 text-amber-700";
      case "TERVERIFIKASI":
      case "DITERIMA":
        return "bg-blue-100 text-blue-700";
      case "SELESAI":
        return "bg-emerald-100 text-emerald-700";
      case "REVISI":
      case "DIKEMBALIKAN":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleConfirmLunas = async () => {
    if (
      confirm(
        "Apakah Anda yakin ingin menandai kegiatan ini sebagai LUNAS? Tindakan ini hanya dapat dilakukan jika total pembayaran sudah memenuhi anggaran.",
      )
    ) {
      await confirmLunas(kegiatanId);
    }
  };
</script>
