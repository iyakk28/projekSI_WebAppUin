<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Laporan & Analisis SPI</h1>
          <p class="text-slate-500 mt-1 text-sm font-medium">
            Monitoring performa pengajuan RAB/LPG dan realisasi anggaran seluruh unit.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/spi"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
            Kembali
          </NuxtLink>
        </div>
      </div>

      <!-- Global Filters -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fakultas</label>
            <select
              v-model="filters.fakultasId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="onFakultasChange"
            >
              <option value="">Semua Fakultas</option>
              <option v-for="f in fakultasStore.fakultas" :key="f.id" :value="f.id">{{ f.nama }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Prodi</label>
            <select
              v-model="filters.prodiId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="onFilterChange"
            >
              <option value="">Semua Prodi</option>
              <option v-for="p in filteredProdi" :key="p.id" :value="p.id">{{ p.nama }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ormawa</label>
            <select
              v-model="filters.ormawaId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="onFilterChange"
            >
              <option value="">Semua Ormawa</option>
              <option v-for="o in filteredOrmawa" :key="o.id" :value="o.id">{{ o.nama }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mulai Dari</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="onFilterChange"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sampai</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="onFilterChange"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
           <button @click="resetAndFetch" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
             <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
             Reset Filter
           </button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-6 py-3 text-sm font-bold transition-all relative"
          :class="activeTab === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'"
        >
          {{ tab.name }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>
        </button>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'rabLpg'" class="space-y-8 animate-in fade-in duration-500">
        <div class="flex items-center justify-between">
           <h2 class="text-xl font-bold text-slate-800 tracking-tight">Monitoring RAB & LPG</h2>
           <button @click="exportAllData" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200">
             <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
             Export Semua Data
           </button>
        </div>

        <!-- Summary Cards RAB & LPG -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="card in rabSummaryCards" :key="card.label" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center gap-3 mb-2">
              <div :class="`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`">
                <Icon :name="card.icon" :class="`w-6 h-6 ${card.color}`" />
              </div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ card.label }}</span>
            </div>
            <div class="text-3xl font-bold text-slate-900">{{ reportStore.loading ? '...' : card.value }}</div>
            <div class="text-[10px] text-slate-400 mt-1 font-medium">{{ card.sub }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <!-- Chart Status RAB -->
           <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 class="text-lg font-bold text-slate-900 mb-6">Status Pengajuan RAB</h3>
              <div v-if="reportStore.rabLpgData" class="space-y-6">
                  <div v-for="item in rabStatusChart" :key="item.label" class="space-y-2">
                      <div class="flex justify-between text-xs font-bold">
                        <span class="text-slate-600 uppercase">{{ item.label }}</span>
                        <span class="text-slate-900">{{ item.count }} ({{ item.pct }}%)</span>
                      </div>
                      <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-1000" :style="{ width: item.pct + '%', backgroundColor: item.color }"></div>
                      </div>
                  </div>
              </div>
              <div v-else class="h-40 flex items-center justify-center text-slate-400 italic">Memuat data...</div>
           </div>

           <!-- Performance Table -->
           <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-slate-900">Performa Unit (Revision Rate)</h3>
                <button @click="exportUnitPerformance" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
                   <Icon name="heroicons:document-arrow-down" class="w-4 h-4" />
                   Export CSV
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="text-slate-500 border-b border-slate-100 text-left">
                      <th class="pb-3 font-bold uppercase tracking-wider">Ormawa</th>
                      <th class="pb-3 font-bold uppercase tracking-wider text-center">Total RAB</th>
                      <th class="pb-3 font-bold uppercase tracking-wider text-center">Revisi</th>
                      <th class="pb-3 font-bold uppercase tracking-wider text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="unit in reportStore.rabLpgData?.unitPerformance" :key="unit.ormawaId" class="hover:bg-slate-50 transition-colors">
                      <td class="py-3 font-bold text-slate-700">{{ unit.ormawaName }}</td>
                      <td class="py-3 text-center font-mono">{{ unit.totalRab }}</td>
                      <td class="py-3 text-center text-rose-600 font-mono font-bold">{{ unit.revisions }}</td>
                      <td class="py-3 text-center">
                        <span :class="getRevisionRateClass(unit.revisions / (unit.totalRab || 1))" class="px-2 py-0.5 rounded-full font-bold">
                          {{ (unit.revisions / (unit.totalRab || 1)).toFixed(1) }}x
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      <div v-if="activeTab === 'financial'" class="space-y-8 animate-in fade-in duration-500">
        <!-- Summary Financial -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="card in financialSummaryCards" :key="card.label" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{{ card.label }}</div>
             <div class="text-2xl font-bold text-slate-900">{{ reportStore.loading ? '...' : formatRupiah(card.value) }}</div>
             <div class="h-1 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div class="h-full rounded-full" :class="card.barColor" :style="{ width: card.pct + '%' }"></div>
             </div>
             <div class="text-[10px] text-slate-400 mt-2 font-medium">{{ card.pct }}% dari Pagu Tahunan</div>
          </div>
        </div>

        <!-- Ormawa Breakdown Financial -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">Realisasi Anggaran Per Unit</h3>
            <button @click="exportFinancial" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
               <Icon name="heroicons:document-arrow-down" class="w-4 h-4" />
               Download Laporan
            </button>
          </div>
          <div class="overflow-x-auto">
             <table class="w-full text-left">
                <thead>
                  <tr class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th class="px-6 py-4">Nama Ormawa</th>
                    <th class="px-6 py-4">Pagu (Quota)</th>
                    <th class="px-6 py-4">Usulan (RAB Disetujui)</th>
                    <th class="px-6 py-4">Realisasi (Cair)</th>
                    <th class="px-6 py-4">Sisa Pagu</th>
                    <th class="px-6 py-4 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                   <tr v-for="row in reportStore.financialData?.ormawaBreakdown" :key="row.ormawaId" class="hover:bg-slate-50 transition-colors">
                      <td class="px-6 py-4 font-bold text-slate-700">{{ row.ormawaName }}</td>
                      <td class="px-6 py-4 font-mono text-slate-600">{{ formatRupiah(row.quota) }}</td>
                      <td class="px-6 py-4 font-mono text-slate-600">{{ formatRupiah(row.proposed || 0) }}</td>
                      <td class="px-6 py-4 font-mono text-emerald-600 font-bold">{{ formatRupiah(row.realized || 0) }}</td>
                      <td class="px-6 py-4 font-mono text-slate-600">{{ formatRupiah(row.quota - (row.realized || 0)) }}</td>
                      <td class="px-6 py-4">
                         <div class="flex items-center gap-2">
                           <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div class="h-full bg-emerald-500 rounded-full" :style="{ width: Math.min(((row.realized || 0) / row.quota) * 100, 100) + '%' }"></div>
                           </div>
                           <span class="text-[10px] font-bold text-slate-500 w-8">{{ Math.round(((row.realized || 0) / row.quota) * 100) }}%</span>
                         </div>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
        </div>

        <!-- Fakultas Breakdown Financial -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">Rekap Per Fakultas</h3>
          </div>
          <div class="overflow-x-auto">
             <table class="w-full text-left text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th class="px-6 py-4">Fakultas</th>
                    <th class="px-6 py-4">Total Pagu</th>
                    <th class="px-6 py-4">Total Usulan</th>
                    <th class="px-6 py-4">Total Realisasi</th>
                    <th class="px-6 py-4">Sisa Anggaran</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="f in reportStore.financialData?.fakultasBreakdown" :key="f.fakultasId" class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-700">{{ f.fakultasName }}</td>
                    <td class="px-6 py-4 font-mono">{{ formatRupiah(f.quota) }}</td>
                    <td class="px-6 py-4 font-mono">{{ formatRupiah(f.proposed || 0) }}</td>
                    <td class="px-6 py-4 font-mono text-emerald-600">{{ formatRupiah(f.realized || 0) }}</td>
                    <td class="px-6 py-4 font-mono">{{ formatRupiah(f.quota - (f.realized || 0)) }}</td>
                  </tr>
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpiReportStore } from '~/stores/spi/report';
import { useSpiFakultasStore } from "~/stores/spi/fakultas";
import { useSpiProdiStore } from "~/stores/spi/prodi";
import { useSpiOrmawaStore } from "~/stores/spi/ormawa";
import { ref, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";

const reportStore = useSpiReportStore();
const fakultasStore = useSpiFakultasStore();
const prodiStore = useSpiProdiStore();
const ormawaStore = useSpiOrmawaStore();

const { filters } = storeToRefs(reportStore);
const activeTab = ref('rabLpg');

const tabs = [
  { id: 'rabLpg', name: 'Monitoring RAB & LPG' },
  { id: 'financial', name: 'Laporan Keuangan' }
];

const filteredProdi = computed(() => {
  if (!filters.value.fakultasId) return prodiStore.prodi;
  return prodiStore.prodi.filter(p => p.fakultasId === parseInt(filters.value.fakultasId));
});

const filteredOrmawa = computed(() => {
  if (!filters.value.fakultasId) return ormawaStore.ormawa;
  let list = ormawaStore.ormawa.filter(o => o.fakultasId === parseInt(filters.value.fakultasId));
  if (filters.value.prodiId) list = list.filter(o => o.prodiId === parseInt(filters.value.prodiId));
  return list;
});

const rabSummaryCards = computed(() => [
  { 
    label: 'RAB Menunggu', 
    value: reportStore.rabLpgData?.rabSummary.waiting || 0, 
    icon: 'heroicons:clock', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    sub: 'Perlu review segera'
  },
  { 
    label: 'RAB Disetujui', 
    value: reportStore.rabLpgData?.rabSummary.approved || 0, 
    icon: 'heroicons:check-badge', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    sub: 'Siap dilaksanakan'
  },
  { 
    label: 'Total Revisi', 
    value: reportStore.rabLpgData?.rabSummary.totalRevisions || 0, 
    icon: 'heroicons:arrow-path', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    sub: 'Total perbaikan dokumen'
  },
  { 
    label: 'RAB Ditolak', 
    value: reportStore.rabLpgData?.rabSummary.rejected || 0, 
    icon: 'heroicons:x-circle', 
    color: 'text-rose-600', 
    bg: 'bg-rose-50',
    sub: 'Tidak memenuhi kriteria'
  }
]);

const rabStatusChart = computed(() => {
  if (!reportStore.rabLpgData) return [];
  const s = reportStore.rabLpgData.rabSummary;
  const total = s.waiting + s.approved + s.rejected + s.revision || 1;
  return [
    { label: 'Disetujui', count: s.approved, pct: Math.round((s.approved / total) * 100), color: '#10b981' },
    { label: 'Menunggu', count: s.waiting, pct: Math.round((s.waiting / total) * 100), color: '#f59e0b' },
    { label: 'Revisi', count: s.revision, pct: Math.round((s.revision / total) * 100), color: '#3b82f6' },
    { label: 'Ditolak', count: s.rejected, pct: Math.round((s.rejected / total) * 100), color: '#f43f5e' }
  ].sort((a, b) => b.count - a.count);
});

const financialSummaryCards = computed(() => {
  if (!reportStore.financialData) return [];
  const s = reportStore.financialData.summary;
  return [
    { label: 'Total Pagu (Tahunan)', value: s.totalQuota, pct: 100, barColor: 'bg-slate-300' },
    { label: 'Usulan RAB (Approved)', value: s.totalProposed, pct: Math.round((s.totalProposed / (s.totalQuota || 1)) * 100), barColor: 'bg-blue-500' },
    { label: 'Realisasi (Cair)', value: s.totalRealized, pct: Math.round((s.totalRealized / (s.totalQuota || 1)) * 100), barColor: 'bg-emerald-500' },
    { label: 'Sisa Pagu', value: s.remaining, pct: Math.round((s.remaining / (s.totalQuota || 1)) * 100), barColor: 'bg-rose-500' }
  ];
});

const onFakultasChange = () => {
  filters.value.prodiId = "";
  filters.value.ormawaId = "";
  onFilterChange();
};

const onFilterChange = () => {
  if (activeTab.value === 'rabLpg') reportStore.fetchRabLpgReport();
  else reportStore.fetchFinancialReport();
};

const resetAndFetch = () => {
  reportStore.resetFilters();
  onFilterChange();
};

const formatRupiah = (amount: number | string) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount));
};

const getRevisionRateClass = (rate: number) => {
  if (rate > 2) return 'bg-rose-50 text-rose-700';
  if (rate > 1) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
};

const exportAllData = async () => {
  try {
    const query = { ...filters.value };
    const res = await $fetch<any>('/api/spi/report/rawExport', { query });
    if (res.success && res.data.length > 0) {
      downloadCsv(res.data, 'raw_data_rab_lpg_spi.csv');
    } else {
      alert('Tidak ada data untuk di-export.');
    }
  } catch (err) {
    alert('Gagal mengambil data export.');
  }
};

const exportUnitPerformance = () => {
  if (!reportStore.rabLpgData) return;
  const data = reportStore.rabLpgData.unitPerformance.map(u => ({
    'Nama Ormawa': u.ormawaName,
    'Total RAB': u.totalRab,
    'Total Revisi': u.revisions,
    'Rasio Revisi': (u.revisions / (u.totalRab || 1)).toFixed(2)
  }));
  downloadCsv(data, 'performa_unit_spi.csv');
};

const exportFinancial = () => {
  if (!reportStore.financialData) return;
  const data = reportStore.financialData.ormawaBreakdown.map(r => ({
    'Nama Ormawa': r.ormawaName,
    'Pagu': r.quota,
    'Usulan (RAB)': r.proposed || 0,
    'Realisasi (Cair)': r.realized || 0,
    'Sisa Pagu': r.quota - (r.realized || 0)
  }));
  downloadCsv(data, 'laporan_keuangan_ormawa_spi.csv');
};

const downloadCsv = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(async () => {
  await Promise.all([
    fakultasStore.fetchFakultas(),
    prodiStore.fetchProdi(),
    ormawaStore.fetchOrmawa(),
    reportStore.fetchRabLpgReport(),
    reportStore.fetchFinancialReport()
  ]);
});

watch(activeTab, (newTab) => {
  if (newTab === 'rabLpg' && !reportStore.rabLpgData) reportStore.fetchRabLpgReport();
  if (newTab === 'financial' && !reportStore.financialData) reportStore.fetchFinancialReport();
});
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
