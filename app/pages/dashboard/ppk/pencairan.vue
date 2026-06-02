<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            Pengajuan <span class="text-[#d1a82a]">Pencairan</span>
          </h2>
          <p class="text-sm text-slate-500">
            Tinjau dokumen barang dan jasa yang diajukan ormawa
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm">
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari ormawa / kegiatan..."
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none w-44 sm:w-64"
            />
          </div>
          <div class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm">
            <Icon name="heroicons:funnel" class="w-4 h-4 text-[#d1a82a]" />
            <select
              v-model="filterStatus"
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="menunggu_dokumen">Menunggu Dokumen</option>
              <option value="dokumen_lengkap">Dokumen Lengkap</option>
              <option value="dikembalikan">Revisi</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
            {{ todayStr }}
          </div>
        </div>
      </div>
    </header>

    <main class="p-4 sm:p-6 lg:p-8 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 rounded-xl" :class="stat.iconClass">
              <Icon :name="stat.icon" class="w-6 h-6" />
            </div>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-1">{{ stat.value }}</h3>
          <p class="text-sm text-slate-500">{{ stat.label }}</p>
          <span class="inline-block mt-1 text-xs" :class="stat.textClass">{{ stat.caption }}</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="flex justify-between items-center p-5 border-b border-slate-200">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Daftar Pengajuan Pencairan</h3>
            <p class="text-sm text-slate-500">{{ filteredList.length }} pengajuan ditampilkan</p>
          </div>
          <span class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
            {{ pencairanList.length }} total
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Kegiatan</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Ormawa</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Jenis</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Penerima</th>
                <th class="text-right py-3 px-4 font-semibold text-slate-500">Nominal</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Dokumen</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Status</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredList"
                :key="item.urlId"
                class="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td class="py-3 px-4 min-w-64">
                  <p class="font-semibold text-slate-800">{{ item.namaKegiatan }}</p>
                  <p class="text-xs text-slate-500">Diajukan {{ formatDate(item.tanggalPengajuan) }}</p>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-[#3b5988] text-white text-xs font-bold flex items-center justify-center">
                      {{ item.kodeOrmawa?.charAt(0) || "O" }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ item.namaOrmawa }}</p>
                      <p class="text-xs text-slate-500">{{ item.kodeOrmawa }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" :class="typeClass(item.tipeTagihan)">
                    <Icon :name="item.tipeTagihan === 'BARANG' ? 'heroicons:shopping-bag' : 'heroicons:user-group'" class="w-3.5 h-3.5" />
                    {{ item.tipeTagihan }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <p class="font-medium text-slate-800">{{ item.namaPenerima || "-" }}</p>
                  <p class="text-xs text-slate-500">{{ item.rekeningPenerima || "Rekening belum ada" }}</p>
                </td>
                <td class="py-3 px-4 text-right font-semibold text-[#d1a82a]">
                  {{ formatRp(item.totalDana) }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="text-xs font-semibold" :class="item.docPct === 100 ? 'text-emerald-600' : 'text-amber-600'">
                    {{ item.uploadedDocs }}/{{ item.totalDocs }}
                  </span>
                  <div class="mt-1 h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mx-auto">
                    <div class="h-full rounded-full" :class="item.docPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'" :style="{ width: item.docPct + '%' }"></div>
                  </div>
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="inline-flex text-xs font-semibold px-2 py-1 rounded-full" :class="statusClass(item.statusPencairan)">
                    {{ statusLabel(item.statusPencairan) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <button
                    @click="goDetail(item.urlId)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d1a82a]/10 text-[#a78317] hover:bg-[#d1a82a]/20 transition font-medium text-sm"
                  >
                    <Icon name="heroicons:eye" class="w-4 h-4" /> Detail
                  </button>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="8" class="py-12 text-center text-slate-400">
                  <Icon name="heroicons:document-magnifying-glass" class="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Tidak ada data pencairan</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
interface PencairanItem {
  id: number;
  urlId: string; // ← id yang aman untuk URL (mengatasi id negatif)
  namaKegiatan: string;
  namaOrmawa: string;
  kodeOrmawa: string;
  tipeTagihan: string;
  namaPenerima: string;
  rekeningPenerima: string;
  totalDana: number;
  tanggalPengajuan: string;
  statusPencairan: string;
  syaratDokumen: { uploaded: boolean }[];
  uploadedDocs: number;
  totalDocs: number;
  docPct: number;
}

const { data: pencairanData } = await useFetch<{ data: any[] }>("/api/ppk/pencairan");

const searchQuery = ref("");
const filterStatus = ref("");

const todayStr = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ✅ FIX: encode id negatif jadi "v123" agar aman di URL
// id positif  →  "5"    (langsung)
// id negatif  →  "v5"   (prefix v = virtual/dokumentasi)
// id group    →  "g123" (group dokumentasi, id <= -1_000_000)
const encodeUrlId = (id: number): string => {
  if (!Number.isFinite(id) || id === 0) {
    console.warn("⚠️ encodeUrlId: invalid id", id);
    return "0"; // fallback ke 0 jika invalid
  }
  if (id <= -1_000_000) return `g${Math.abs(id) - 1_000_000}`;
  if (id < 0) return `v${Math.abs(id)}`;
  return String(id);
};

const normalizeStatusPencairan = (status?: string) => {
  switch (status) {
    case "TERVERIFIKASI":
    case "DOKUMEN_LENGKAP":
      return "dokumen_lengkap";
    case "DIKEMBALIKAN":
      return "dikembalikan";
    case "SELESAI":
    case "COMPLETED":
      return "selesai";
    default:
      return "menunggu_dokumen";
  }
};

const pencairanList = computed<PencairanItem[]>(() =>
  (pencairanData.value?.data || [])
    .map((item: any, idx: number) => {
      const docs = item.syaratDokumen || [];
      const uploadedDocs = docs.filter((doc: any) => Boolean(doc.uploaded || doc.url)).length;
      const totalDocs = docs.length || 1;
      const rawId = Number(item.id);
      
      // ✅ Validation: pastikan id valid
      if (!Number.isFinite(rawId) || rawId === 0 || rawId === undefined) {
        console.warn(`⚠️ Item ${idx} memiliki id invalid:`, item.id, "item:", item);
        return null; // Skip item dengan id invalid
      }
      
      return {
        id: rawId,
        urlId: encodeUrlId(rawId), // ← pakai urlId untuk navigasi
        namaKegiatan: item.kegiatan?.judulKegiatan || item.namaKegiatan || "",
        namaOrmawa: item.ormawa?.nama || item.namaOrmawa || "",
        kodeOrmawa: item.ormawa?.kode || item.kodeOrmawa || "",
        tipeTagihan: item.tipeTagihan || "",
        namaPenerima: item.namaPenerima || "",
        rekeningPenerima: item.rekeningPenerima || "",
        totalDana: Number(item.nominal ?? item.totalDana ?? 0),
        tanggalPengajuan: item.createdAt || item.tanggalPengajuan || "",
        statusPencairan: normalizeStatusPencairan(item.statusTagihan || item.status),
        syaratDokumen: docs,
        uploadedDocs,
        totalDocs,
        docPct: Math.round((uploadedDocs / totalDocs) * 100),
      };
    })
    .filter(Boolean) as PencairanItem[], // Filter out null items
);

const filteredList = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return pencairanList.value.filter((item) => {
    const matchSearch =
      !q ||
      item.namaKegiatan.toLowerCase().includes(q) ||
      item.namaOrmawa.toLowerCase().includes(q) ||
      item.namaPenerima.toLowerCase().includes(q);
    const matchStatus = !filterStatus.value || item.statusPencairan === filterStatus.value;
    return matchSearch && matchStatus;
  });
});

const stats = computed(() => [
  {
    label: "Total Pengajuan",
    value: pencairanList.value.length,
    caption: "Barang dan jasa",
    icon: "heroicons:document-text",
    iconClass: "bg-[#3b5988]/10 text-[#3b5988]",
    textClass: "text-slate-400",
  },
  {
    label: "Menunggu",
    value: pencairanList.value.filter((item) => item.statusPencairan === "menunggu_dokumen").length,
    caption: "Perlu ditinjau",
    icon: "heroicons:clock",
    iconClass: "bg-amber-500/10 text-amber-600",
    textClass: "text-amber-600",
  },
  {
    label: "Dokumen Lengkap",
    value: pencairanList.value.filter((item) => item.docPct === 100).length,
    caption: "Siap diproses",
    icon: "heroicons:document-check",
    iconClass: "bg-emerald-500/10 text-emerald-600",
    textClass: "text-emerald-600",
  },
  {
    label: "Perlu Revisi",
    value: pencairanList.value.filter((item) => item.statusPencairan === "dikembalikan").length,
    caption: "Catatan dikirim",
    icon: "heroicons:arrow-path",
    iconClass: "bg-orange-500/10 text-orange-600",
    textClass: "text-orange-600",
  },
]);

// ✅ FIX: navigasi pakai urlId yang sudah di-encode, bukan id mentah
const goDetail = (urlId: string) =>
  navigateTo(`/dashboard/ppk/detailPencairan/${urlId}`);

const typeClass = (type: string) =>
  type === "BARANG" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700";

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    menunggu_dokumen: "bg-amber-100 text-amber-700",
    dokumen_lengkap: "bg-blue-100 text-blue-700",
    dikembalikan: "bg-orange-100 text-orange-700",
    selesai: "bg-emerald-100 text-emerald-700",
  };
  return map[status] || "bg-slate-100 text-slate-600";
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    menunggu_dokumen: "Menunggu",
    dokumen_lengkap: "Dokumen Lengkap",
    dikembalikan: "Revisi",
    selesai: "Selesai",
  };
  return map[status] || status;
};

const formatRp = (value?: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(value || 0);

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";
</script>