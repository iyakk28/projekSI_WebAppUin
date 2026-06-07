<!-- FILE: app/pages/dashboard/ppk/detailPengajuan/[id].vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between">
        <button @click="$router.back()" class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
        </button>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{ detail?.rab.nomorPengajuan }}</span>
          <div class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm">
            STATUS: LUNAS
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
       <div class="w-8 h-8 border-4 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center py-32 text-red-500 font-medium">
      {{ error }}
    </div>

    <!-- Content -->
    <main v-else-if="detail" class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Title Section -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div class="space-y-2">
          <h1 class="text-3xl font-extrabold text-slate-900 leading-tight">{{ detail.rab.judulKegiatan }}</h1>
          <div class="flex flex-wrap gap-3">
             <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">{{ detail.ormawa?.nama }}</span>
             <span class="px-3 py-1 bg-[#d1a82a]/10 text-[#d1a82a] rounded-full text-xs font-bold uppercase tracking-wider">{{ detail.rab.nomorPengajuan }}</span>
          </div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-4 min-w-[200px] flex flex-col justify-center border border-slate-100">
           <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Anggaran</p>
           <p class="text-2xl font-black text-[#3b5988]">{{ formatRp(detail.rab.totalAnggaran) }}</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
        <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key" 
          :class="['px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2', 
          activeTab === t.key ? 'bg-white text-[#3b5988] shadow-sm' : 'text-slate-500 hover:text-slate-800']">
          <Icon :name="t.icon" class="w-5 h-5" />
          {{ t.label }}
        </button>
      </div>

      <!-- TAB CONTENT: DOKUMEN (RAB & TOR) -->
      <div v-if="activeTab === 'dokumen'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- RAB Preview -->
         <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center">
               <h3 class="font-bold text-slate-800 flex items-center gap-2">
                 <Icon name="heroicons:calculator" class="w-5 h-5 text-[#d1a82a]" />
                 Rincian Anggaran Biaya (RAB)
               </h3>
               <button @click="openFile(detail.rab.fileRabUrl)" class="text-[#3b5988] text-xs font-bold uppercase hover:underline">Tab Baru</button>
            </div>
            <div class="p-4 bg-slate-50 aspect-[3/4]">
               <iframe :src="getFileUrl(detail.rab.fileRabUrl)" class="w-full h-full rounded-xl border border-slate-200" frameborder="0"></iframe>
            </div>
         </div>

         <!-- TOR Preview -->
         <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center">
               <h3 class="font-bold text-slate-800 flex items-center gap-2">
                 <Icon name="heroicons:document-duplicate" class="w-5 h-5 text-[#d1a82a]" />
                 Term of Reference (TOR)
               </h3>
               <button @click="openFile(detail.rab.fileTorUrl)" class="text-[#3b5988] text-xs font-bold uppercase hover:underline">Tab Baru</button>
            </div>
            <div class="p-4 bg-slate-50 aspect-[3/4]">
               <iframe :src="getFileUrl(detail.rab.fileTorUrl)" class="w-full h-full rounded-xl border border-slate-200" frameborder="0"></iframe>
            </div>
         </div>
      </div>

      <!-- TAB CONTENT: DOKUMENTASI -->
      <div v-if="activeTab === 'dokumentasi'" class="space-y-6">
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="doc in detail.dokumentasi" :key="doc.id" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
               <div class="aspect-video bg-slate-100 relative overflow-hidden">
                  <img :src="getFileUrl(doc.fileUrl)" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button @click="selectedImg = doc.fileUrl" class="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-xs uppercase">Zoom In</button>
                  </div>
               </div>
               <div class="p-5 space-y-2">
                  <p class="text-xs font-bold text-[#d1a82a] uppercase tracking-widest">{{ doc.tipeDokumen }}</p>
                  <p class="text-sm text-slate-700 line-clamp-2">{{ doc.deskripsi || "Tidak ada deskripsi." }}</p>
                  <div class="pt-2 flex justify-between items-center border-t border-slate-100">
                     <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(doc.createdAt) }}</span>
                     <button @click="openFile(doc.fileUrl)" class="text-slate-500 hover:text-slate-900 transition"><Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" /></button>
                  </div>
               </div>
            </div>
         </div>
         <div v-if="detail.dokumentasi.length === 0" class="py-20 text-center text-slate-400">
            <Icon name="heroicons:photo" class="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p class="font-medium">Belum ada dokumentasi yang diupload.</p>
         </div>
      </div>

      <!-- TAB CONTENT: TAGIHAN & PEMBAYARAN -->
      <div v-if="activeTab === 'tagihan'" class="space-y-6">
         <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="min-w-full text-sm">
               <thead class="bg-slate-50 text-slate-500">
                  <tr>
                     <th class="text-left py-4 px-6 font-bold uppercase tracking-wider">Penerima</th>
                     <th class="text-left py-4 px-6 font-bold uppercase tracking-wider">Tipe / Item</th>
                     <th class="text-right py-4 px-6 font-bold uppercase tracking-wider">Nominal</th>
                     <th class="text-center py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                     <th class="text-center py-4 px-6 font-bold uppercase tracking-wider">Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr v-for="t in detail.tagihan" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50 transition">
                     <td class="py-5 px-6">
                        <p class="font-bold text-slate-800">{{ t.namaPenerima }}</p>
                        <p class="text-xs text-slate-500">{{ t.bankPenerima }} - {{ t.rekeningPenerima }}</p>
                     </td>
                     <td class="py-5 px-6">
                        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase mb-1 inline-block">{{ t.tipeTagihan }}</span>
                        <p class="text-slate-700">{{ t.tipeTagihan === 'BARANG' ? t.tokoNama : (t.skNomor || "-") }}</p>
                     </td>
                     <td class="py-5 px-6 text-right font-black text-[#3b5988]">
                        {{ formatRp(t.nominal) }}
                     </td>
                     <td class="py-5 px-6 text-center">
                        <span :class="['px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest', tagihanStatusClass(t.statusTagihan)]">
                           {{ t.statusTagihan.replaceAll('_', ' ') }}
                        </span>
                     </td>
                     <td class="py-5 px-6 text-center">
                        <button @click="selectedTagihan = t" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition">Detail</button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </main>

    <!-- Modal Image Zoom -->
    <div v-if="selectedImg" class="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" @click="selectedImg = ''">
       <img :src="getFileUrl(selectedImg)" class="max-w-full max-h-full rounded-2xl shadow-2xl" />
       <button class="absolute top-8 right-8 text-white" @click="selectedImg = ''"><Icon name="heroicons:x-mark" class="w-10 h-10" /></button>
    </div>

    <!-- Modal Tagihan Detail -->
    <div v-if="selectedTagihan" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="selectedTagihan = null">
       <div class="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="p-8 space-y-8">
             <div class="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                   <h3 class="text-2xl font-black text-slate-900">Detail Tagihan ({{ selectedTagihan.tipeTagihan }})</h3>
                   <p class="text-slate-500">Informasi lengkap rincian pembayaran</p>
                </div>
                <button @click="selectedTagihan = null"><Icon name="heroicons:x-mark" class="w-8 h-8 text-slate-400" /></button>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-6">
                   <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <h4 class="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Informasi Penerima</h4>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                         <div>
                            <p class="text-slate-400 mb-1">Nama</p>
                            <p class="font-bold text-slate-800">{{ selectedTagihan.namaPenerima }}</p>
                         </div>
                         <div>
                            <p class="text-slate-400 mb-1">Bank</p>
                            <p class="font-bold text-slate-800">{{ selectedTagihan.bankPenerima }}</p>
                         </div>
                         <div class="col-span-2">
                            <p class="text-slate-400 mb-1">Rekening</p>
                            <p class="font-bold text-slate-800 text-lg">{{ selectedTagihan.rekeningPenerima }}</p>
                         </div>
                      </div>
                   </div>

                   <!-- Info Khusus BARANG -->
                   <div v-if="selectedTagihan.tipeTagihan === 'BARANG'" class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <h4 class="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Rincian Toko</h4>
                      <div class="text-sm space-y-3">
                         <div class="flex justify-between border-b border-slate-200 pb-2">
                            <span class="text-slate-400">Toko</span>
                            <span class="font-bold">{{ selectedTagihan.tokoNama || "-" }}</span>
                         </div>
                         <div class="flex justify-between">
                            <span class="text-slate-400">Alamat Toko</span>
                            <span class="text-right max-w-[60%] font-medium">{{ selectedTagihan.tokoAlamat || "-" }}</span>
                         </div>
                      </div>
                   </div>

                   <!-- Info Khusus JASA -->
                   <div v-if="selectedTagihan.tipeTagihan === 'JASA'" class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <h4 class="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Dokumen Pendukung</h4>
                      <div class="text-sm space-y-3">
                         <div class="flex justify-between border-b border-slate-200 pb-2">
                            <span class="text-slate-400">Nomor SK</span>
                            <span class="font-bold">{{ selectedTagihan.skNomor || "-" }}</span>
                         </div>
                         <div v-if="selectedTagihan.spmtNomor" class="flex justify-between border-b border-slate-200 pb-2">
                            <span class="text-slate-400">Nomor SPMT</span>
                            <span class="font-bold">{{ selectedTagihan.spmtNomor }}</span>
                         </div>
                         <div v-if="selectedTagihan.amprahNomor" class="flex justify-between border-b border-slate-200 pb-2">
                            <span class="text-slate-400">Nomor Amprah</span>
                            <span class="font-bold">{{ selectedTagihan.amprahNomor }}</span>
                         </div>
                         <div v-if="selectedTagihan.npwpNomor" class="flex justify-between border-b border-slate-200 pb-2">
                            <span class="text-slate-400">NPWP</span>
                            <span class="font-bold">{{ selectedTagihan.npwpNomor }}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div class="space-y-6">
                   <h4 class="font-bold text-slate-800 uppercase text-xs tracking-widest text-slate-400">Lampiran Bukti</h4>
                   <div class="grid grid-cols-2 gap-4">
                      <!-- Files for BARANG -->
                      <div v-if="selectedTagihan.strukFileUrl" class="space-y-2">
                         <p class="text-[10px] font-bold text-slate-400 uppercase">Struk / Nota</p>
                         <div class="aspect-square rounded-xl overflow-hidden border border-slate-200">
                            <img :src="getFileUrl(selectedTagihan.strukFileUrl)" class="w-full h-full object-cover cursor-pointer" @click="selectedImg = selectedTagihan.strukFileUrl" />
                         </div>
                      </div>
                      <div v-if="selectedTagihan.fotoBarangUrl" class="space-y-2">
                         <p class="text-[10px] font-bold text-slate-400 uppercase">Foto Barang</p>
                         <div class="aspect-square rounded-xl overflow-hidden border border-slate-200">
                            <img :src="getFileUrl(selectedTagihan.fotoBarangUrl)" class="w-full h-full object-cover cursor-pointer" @click="selectedImg = selectedTagihan.fotoBarangUrl" />
                         </div>
                      </div>

                      <!-- Files for JASA -->
                      <div v-if="selectedTagihan.skFileUrl" class="space-y-2">
                         <p class="text-[10px] font-bold text-slate-400 uppercase">File SK</p>
                         <button @click="openFile(selectedTagihan.skFileUrl)" class="w-full aspect-square rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[#3b5988]">
                            <Icon name="heroicons:document-text" class="w-8 h-8" />
                         </button>
                      </div>
                      <div v-if="selectedTagihan.bukuRekeningFileUrl" class="space-y-2">
                         <p class="text-[10px] font-bold text-slate-400 uppercase">Buku Rekening</p>
                         <div class="aspect-square rounded-xl overflow-hidden border border-slate-200">
                            <img :src="getFileUrl(selectedTagihan.bukuRekeningFileUrl)" class="w-full h-full object-cover cursor-pointer" @click="selectedImg = selectedTagihan.bukuRekeningFileUrl" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePpkDetailStore } from "~/stores/ppk/DetailPengajuan";
import { storeToRefs } from "pinia";

const route = useRoute();
const id = route.params.id as string;
const store = usePpkDetailStore();

const { detail, loading, error } = storeToRefs(store);
const { fetchFullData, getFileUrl } = store;

const activeTab = ref("dokumen");
const selectedImg = ref("");
const selectedTagihan = ref<any>(null);

const tabs = [
  { key: "dokumen", label: "Dokumen RAB/TOR", icon: "heroicons:document-text" },
  { key: "dokumentasi", label: "Dokumentasi Lapangan", icon: "heroicons:photo" },
  { key: "tagihan", label: "Tagihan & Bukti", icon: "heroicons:banknotes" },
];

const formatRp = (n?: number | string) => 
  "Rp " + new Intl.NumberFormat("id-ID").format(Number(n) || 0);

const formatDate = (d?: string) => d 
  ? new Date(d).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) 
  : "-";

const tagihanStatusClass = (status: string) => {
  switch(status) {
    case 'SELESAI': return 'bg-emerald-100 text-emerald-700';
    case 'WAITING_PEMBAYARAN': return 'bg-amber-100 text-amber-700';
    case 'DITOLAK': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const openFile = (path: string) => {
  if (path) window.open(getFileUrl(path), '_blank');
};

onMounted(() => {
  fetchFullData(id);
});
</script>
