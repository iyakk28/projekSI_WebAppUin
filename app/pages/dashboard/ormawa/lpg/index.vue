<script setup lang="ts">
import { useLpgListStore } from '~/stores/ormawa/lpgList';

const lpgListStore = useLpgListStore();

onMounted(async () => {
  await lpgListStore.fetchReadyRabs();
});

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getStatusBadgeClass = (status: string | null) => {
  if (!status) return 'bg-amber-100 text-amber-700 border-amber-200';
  switch (status) {
    case 'WAITING_SPI': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'REVISION': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status: string | null) => {
  if (!status) return 'Belum Diupload';
  switch (status) {
    case 'WAITING_SPI': return 'Menunggu Review SPI';
    case 'APPROVED': return 'Disetujui SPI';
    case 'REVISION': return 'Perlu Revisi';
    default: return status;
  }
};

const formatRupiah = (amount: string | number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount));
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Manajemen LPG</h1>
        <p class="text-slate-500 mt-1">Daftar kegiatan yang telah selesai dan siap untuk pelaporan.</p>
      </div>
      <NuxtLink 
        to="/dashboard/ormawa" 
        class="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
      >
        <span class="i-lucide-arrow-left w-5 h-5"></span>
        Kembali ke Dashboard
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="lpgListStore.loading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-slate-500">Memuat data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="lpgListStore.error" class="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center">
      <p class="text-rose-600 font-medium">{{ lpgListStore.error }}</p>
      <button 
        @click="lpgListStore.fetchReadyRabs()" 
        class="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-shadow shadow-sm"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="lpgListStore.readyRabs.length === 0" class="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
      <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="i-lucide-clipboard-check w-10 h-10 text-slate-400"></span>
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-2">Tidak Ada Kegiatan Siap LPG</h3>
      <p class="text-slate-500 max-w-md mx-auto">
        Belum ada kegiatan yang berstatus 'Selesai' dan telah 'Lunas PPK'. Silakan selesaikan kegiatan Anda terlebih dahulu.
      </p>
    </div>

    <!-- List of Ready RABs -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="item in lpgListStore.readyRabs" 
        :key="item.rabId"
        class="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
      >
        <div class="p-6 flex-1">
          <div class="flex justify-between items-start mb-4">
            <span 
              class="px-3 py-1 rounded-full text-xs font-semibold border"
              :class="getStatusBadgeClass(item.lpgStatus)"
            >
              {{ getStatusLabel(item.lpgStatus) }}
            </span>
            <span class="text-xs font-medium text-slate-400">#{{ item.nomorPengajuan }}</span>
          </div>

          <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {{ item.judulKegiatan }}
          </h3>

          <div class="space-y-3 mt-4">
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="i-lucide-calendar w-4 h-4 text-slate-400"></span>
              <span>{{ formatDate(item.tanggalMulai) }} - {{ formatDate(item.tanggalSelesai) }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="i-lucide-wallet w-4 h-4 text-slate-400"></span>
              <span class="font-semibold text-slate-900">{{ formatRupiah(item.totalAnggaran) }}</span>
            </div>
          </div>

          <div class="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div class="flex items-center gap-2 text-emerald-700 text-sm font-bold mb-1">
              <span class="i-lucide-check-circle-2 w-4 h-4"></span>
              Siap Upload LPG
            </div>
            <p class="text-xs text-emerald-600/80 leading-relaxed">
              Kegiatan telah selesai dilaksanakan dan dana telah dilunasi oleh PPK. Segera kumpulkan laporan pertanggungjawaban.
            </p>
          </div>
        </div>

        <div class="p-6 pt-0 mt-auto">
          <NuxtLink 
            :to="`/dashboard/ormawa/lpg/${item.rabId}`"
            class="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-sm active:scale-[0.98]"
          >
            {{ item.lpgId ? 'Lihat / Edit LPG' : 'Upload LPG Sekarang' }}
            <span class="i-lucide-arrow-right w-4 h-4"></span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>