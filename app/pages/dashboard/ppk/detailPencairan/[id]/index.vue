<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <button
          @click="$router.push('/dashboard/ppk/pencairan')"
          class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali ke Daftar
        </button>
        <h2 class="text-lg font-bold text-slate-900" v-if="data?.kegiatan">
          Dokumentasi Kegiatan: <span class="text-[#d1a82a]">{{ data.kegiatan.judulKegiatan }}</span>
        </h2>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8" v-if="data">
      <!-- Activity Summary Info -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Judul Kegiatan</p>
          <p class="font-bold text-slate-800">{{ data.kegiatan.judulKegiatan }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Ormawa / Pengaju</p>
          <p class="font-bold text-slate-600">{{ data.kegiatan.ormawaName }} / {{ data.kegiatan.pengajuNama }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Status Kegiatan</p>
          <span
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
            :class="data.kegiatan.statusKegiatan === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'"
          >
            {{ data.kegiatan.statusKegiatan }}
          </span>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase mb-1">Total Biaya Diajukan</p>
          <p class="font-bold text-[#d1a82a] text-xl">{{ formatRp(data.totalBiaya) }}</p>
        </div>
      </div>

      <!-- Documentation List -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">List Dokumentasi & Tagihan</h3>
            <p class="text-sm text-slate-500">Tinjau seluruh berkas yang diunggah</p>
          </div>
          
          <div class="flex items-center gap-4">
            <label class="text-sm font-semibold text-slate-700">Filter Status Dokumen:</label>
            <select v-model="filterDocStatus" class="text-sm border border-slate-200 rounded-lg p-2 focus:outline-none">
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
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Tipe</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Keterangan / Deskripsi</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Tanggal Upload</th>
                <th class="text-right py-3 px-4 font-semibold text-slate-500">Biaya</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Status</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in filteredDocs" :key="doc.id + doc.type" class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-4 px-4">
                  <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {{ doc.type === 'foto' ? 'Dokumentasi' : 'Tagihan ' + doc.tipeDokumen }}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-700 font-medium">
                  {{ doc.deskripsi }}
                </td>
                <td class="py-4 px-4 text-slate-500">
                  {{ formatDate(doc.createdAt) }}
                </td>
                <td class="py-4 px-4 text-right font-bold" :class="doc.nominal > 0 ? 'text-[#d1a82a]' : 'text-slate-300'">
                  {{ doc.nominal > 0 ? formatRp(doc.nominal) : '-' }}
                </td>
                <td class="py-4 px-4 text-center">
                  <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase" :class="statusClass(doc.status)">
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
        <div class="w-8 h-8 border-2 border-slate-200 border-t-[#d1a82a] rounded-full animate-spin"></div>
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
const { data, loading, error, filterDocStatus, filteredDocs } = storeToRefs(store);
const { fetchDetail } = store;

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
</script>
