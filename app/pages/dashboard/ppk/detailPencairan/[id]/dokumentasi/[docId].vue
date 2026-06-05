<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <button
          @click="$router.back()"
          class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali
        </button>
        <h2 class="text-lg font-bold text-slate-900">Detail Berkas Dokumentasi</h2>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8" v-if="doc">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Content Area -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">Tipe Berkas</p>
                <p class="font-bold text-slate-700">{{ type === 'foto' ? 'Dokumentasi Foto' : 'Tagihan ' + doc.tipeTagihan }}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase" :class="statusClass(doc.statusTagihan || doc.status)">
                {{ doc.statusTagihan || doc.status }}
              </span>
            </div>

            <div class="p-8">
              <!-- Photo Gallery -->
              <h3 class="text-sm font-bold text-slate-400 uppercase mb-4">Berkas Visual</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="img in visualFiles" :key="img.field" class="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <template v-if="blobUrls[img.field]">
                    <img :src="blobUrls[img.field]" class="w-full h-full object-contain" v-if="isImage(blobUrls[img.field]) || isImage(img.originalUrl)" />
                    <div v-else class="flex flex-col items-center justify-center h-full text-slate-400">
                      <Icon name="heroicons:document-text" class="w-10 h-10 mb-2 opacity-20" />
                      <a :href="blobUrls[img.field]" target="_blank" class="text-xs font-bold text-[#3b5988] hover:underline">Lihat / Download Berkas</a>
                    </div>
                  </template>
                  <div v-else class="flex items-center justify-center h-full">
                     <div class="w-6 h-6 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"></div>
                  </div>

                  <div v-if="blobUrls[img.field]" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <a :href="blobUrls[img.field]" target="_blank" class="px-4 py-2 bg-white rounded-lg text-xs font-bold text-slate-800">Buka Berkas</a>
                  </div>
                  <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold">{{ img.label }}</div>
                </div>
              </div>

              <!-- Information Details -->
              <div class="mt-12 space-y-8">
                <div v-if="type === 'tagihan'">
                  <h3 class="text-sm font-bold text-slate-400 uppercase mb-4">Rincian Tagihan</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div v-for="item in [
                      { label: 'Nama Penerima', value: doc.namaPenerima },
                      { label: 'Bank', value: doc.bankPenerima },
                      { label: 'Nomor Rekening', value: doc.rekeningPenerima },
                      { label: 'Nominal', value: formatRp(doc.nominal), highlight: true },
                      { label: 'Nama Toko', value: doc.tokoNama },
                      { label: 'Alamat Toko', value: doc.tokoAlamat }
                    ]" :key="item.label" v-show="item.value">
                      <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">{{ item.label }}</p>
                      <p class="font-semibold text-slate-700" :class="item.highlight ? 'text-lg text-[#d1a82a]' : 'text-sm'">
                        {{ item.value || '-' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-if="type === 'foto'">
                  <h3 class="text-sm font-bold text-slate-400 uppercase mb-4">Deskripsi Dokumentasi</h3>
                  <p class="text-slate-700 leading-relaxed">{{ doc.deskripsi || 'Tidak ada deskripsi' }}</p>
                </div>

                <div v-if="type === 'tagihan'">
                   <h3 class="text-sm font-bold text-slate-400 uppercase mb-4">Dokumen Pendukung</h3>
                   <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <div v-for="file in supportingFiles" :key="file.label" class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                       <div>
                         <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">{{ file.label }}</p>
                         <p class="text-[10px] text-slate-600 font-medium truncate mb-2">{{ file.value || '-' }}</p>
                       </div>
                       <template v-if="blobUrls[file.field]">
                         <a :href="blobUrls[file.field]" target="_blank" class="text-[10px] font-bold text-[#3b5988] flex items-center gap-1 hover:underline">
                           <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
                           Lihat Berkas
                         </a>
                       </template>
                       <p v-else-if="file.originalUrl" class="text-[10px] text-slate-400 animate-pulse">Loading...</p>
                       <p v-else class="text-[10px] text-slate-400 italic">Tidak ada</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Sidebar -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <h3 class="text-sm font-bold text-slate-800 uppercase mb-6">Aksi Verifikasi PPK</h3>
            
            <div class="space-y-4">
              <button
                @click="selectedAction = 'terima'"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="selectedAction === 'terima' ? 'border-[#3b5988] bg-[#3b5988]/5' : 'border-slate-100 hover:border-slate-300'"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Icon name="heroicons:check-badge" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm">Terima / Valid</span>
                </div>
                <Icon name="heroicons:chevron-right" class="w-4 h-4 text-slate-300" />
              </button>

              <button
                @click="selectedAction = 'revisi'"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="selectedAction === 'revisi' ? 'border-orange-400 bg-orange-50' : 'border-slate-100 hover:border-slate-300'"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Icon name="heroicons:arrow-path" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm">Minta Revisi</span>
                </div>
                <Icon name="heroicons:chevron-right" class="w-4 h-4 text-slate-300" />
              </button>

              <button
                v-if="type === 'tagihan'"
                @click="selectedAction = 'bayar'"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="selectedAction === 'bayar' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Icon name="heroicons:banknotes" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm">Bayarkan</span>
                </div>
                <Icon name="heroicons:chevron-right" class="w-4 h-4 text-slate-300" />
              </button>
            </div>

            <!-- Action Form -->
            <div v-if="selectedAction" class="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div v-if="selectedAction === 'revisi'">
                <label class="text-xs font-bold text-slate-500 uppercase mb-2 block">Komentar Revisi</label>
                <textarea
                  v-model="actionPayload.komentar"
                  rows="4"
                  class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="Jelaskan bagian mana yang perlu direvisi..."
                ></textarea>
              </div>

              <div v-if="selectedAction === 'bayar'">
                <label class="text-xs font-bold text-slate-500 uppercase mb-2 block">Unggah Bukti Pembayaran</label>
                <div class="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition">
                  <input type="file" @change="handleFileChange" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <div class="space-y-2">
                    <Icon name="heroicons:cloud-arrow-up" class="w-8 h-8 mx-auto text-slate-300 group-hover:text-emerald-500" />
                    <p class="text-xs text-slate-500">{{ fileName || 'Pilih foto bukti transfer' }}</p>
                  </div>
                </div>
              </div>

              <div v-if="selectedAction === 'terima'">
                <p class="text-xs text-slate-500 italic">Dokumen akan ditandai sebagai valid dan diterima.</p>
              </div>

              <button
                @click="handleSubmitAction"
                :disabled="loading || (selectedAction === 'revisi' && !actionPayload.komentar) || (selectedAction === 'bayar' && !actionPayload.fotoBukti)"
                class="w-full py-3 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50"
                :class="actionBtnClass"
              >
                {{ loading ? 'Memproses...' : 'Konfirmasi Aksi' }}
              </button>
            </div>
          </div>

          <!-- Summary Progress -->
          <div v-if="successMsg" class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
            <Icon name="heroicons:check-circle" class="w-5 h-5 flex-shrink-0" />
            <p class="text-sm font-medium">{{ successMsg }}</p>
          </div>
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
            <Icon name="heroicons:exclamation-circle" class="w-5 h-5 flex-shrink-0" />
            <p class="text-sm font-medium">{{ error }}</p>
          </div>
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
import { usePpkDocDetailStore } from "~/stores/ppk/docDetail";

const route = useRoute();
const docId = Number(route.params.docId);
const type = route.query.type as 'foto' | 'tagihan';

const store = usePpkDocDetailStore();
const { doc, loading, error, successMsg } = storeToRefs(store);
const { fetchDocDetail, performAction, getFileBlob } = store;

const selectedAction = ref("");
const actionPayload = reactive({
  komentar: "",
  fotoBukti: null as File | null,
});
const fileName = ref("");

// Store blob URLs for the current document
const blobUrls = reactive<Record<string, string>>({});

onMounted(async () => {
  await fetchDocDetail(docId, type);
  loadAllBlobs();
});

// Load blobs for all relevant file fields
const loadAllBlobs = async () => {
  if (!doc.value) return;

  const fieldsToLoad = type === 'foto' 
    ? ['fileUrl'] 
    : ['strukFileUrl', 'fotoBarangUrl', 'buktiPembayaranUrl', 'skFileUrl', 'npwpFileUrl', 'ktpFileUrl', 'spmtFileUrl', 'amprahFileUrl', 'bukuRekeningFileUrl'];

  for (const field of fieldsToLoad) {
    if (doc.value[field]) {
      const url = await getFileBlob(docId, type, field);
      if (url) blobUrls[field] = url;
    }
  }
};

const visualFiles = computed(() => {
  if (!doc.value) return [];
  if (type === 'foto') return [{ label: 'Foto Dokumentasi', field: 'fileUrl', originalUrl: doc.value.fileUrl }];
  
  return [
    { label: 'Struk Belanja', field: 'strukFileUrl', originalUrl: doc.value.strukFileUrl },
    { label: 'Foto Barang', field: 'fotoBarangUrl', originalUrl: doc.value.fotoBarangUrl },
    { label: 'Bukti Bayar PPK', field: 'buktiPembayaranUrl', originalUrl: doc.value.buktiPembayaranUrl },
  ].filter(f => f.originalUrl);
});

const supportingFiles = computed(() => {
  if (type !== 'tagihan' || !doc.value) return [];
  return [
    { label: 'SK Nomor', value: doc.value.skNomor, field: 'skFileUrl', originalUrl: doc.value.skFileUrl },
    { label: 'NPWP', value: doc.value.npwpNomor, field: 'npwpFileUrl', originalUrl: doc.value.npwpFileUrl },
    { label: 'KTP', value: doc.value.ktpNomor, field: 'ktpFileUrl', originalUrl: doc.value.ktpFileUrl },
    { label: 'SPMT', value: doc.value.spmtNomor, field: 'spmtFileUrl', originalUrl: doc.value.spmtFileUrl },
    { label: 'Amprah', value: doc.value.amprahNomor, field: 'amprahFileUrl', originalUrl: doc.value.amprahFileUrl },
    { label: 'Buku Rekening', value: 'Lampiran', field: 'bukuRekeningFileUrl', originalUrl: doc.value.bukuRekeningFileUrl }
  ];
});

const handleFileChange = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    actionPayload.fotoBukti = file;
    fileName.value = file.name;
  }
};

const handleSubmitAction = async () => {
  await performAction({
    id: docId,
    type,
    action: selectedAction.value,
    komentar: actionPayload.komentar,
    fotoBukti: actionPayload.fotoBukti || undefined,
  });
  
  if (!error.value) {
    selectedAction.value = "";
    actionPayload.komentar = "";
    actionPayload.fotoBukti = null;
    fileName.value = "";
    // Reload blobs if needed (e.g. after payment proof upload)
    loadAllBlobs();
  }
};

const actionBtnClass = computed(() => {
  if (selectedAction.value === 'revisi') return 'bg-orange-500 hover:bg-orange-600 shadow-orange-200';
  if (selectedAction.value === 'terima') return 'bg-blue-600 hover:bg-blue-700 shadow-blue-200';
  if (selectedAction.value === 'bayar') return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
  return 'bg-slate-800';
});

// Updated isImage to handle blob URLs by checking original extension if possible
const isImage = (url: string) => {
  if (!url) return false;
  // If it's a blob URL, we can't easily check extension from string, 
  // but we can check the original file URL if we pass it, or just assume common image MIME types are handled by the browser
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('blob:');
};

const formatRp = (val: any) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(val || 0));
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
