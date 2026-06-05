<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            Pencairan <span class="text-[#d1a82a]">Kegiatan</span>
          </h2>
          <p class="text-sm text-slate-500">
            Daftar kegiatan yang siap atau telah dicairkan
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm">
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kegiatan / ormawa..."
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none w-44 sm:w-64"
            />
          </div>

          <div class="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-4 py-2 shadow-sm">
            <Icon name="heroicons:funnel" class="w-4 h-4 text-[#d1a82a]" />
            <select
              v-model="filterStatus"
              @change="fetchActivities"
              class="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kegiatan</option>
              <option value="SELESAI">Selesai (Menunggu Lunas)</option>
              <option value="LUNAS">Lunas</option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <main class="p-4 sm:p-6 lg:p-8">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-200">
          <h3 class="text-lg font-bold text-slate-900">Daftar Pengajuan</h3>
          <p class="text-sm text-slate-500">{{ filteredActivities.length }} data ditemukan</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Ormawa / Organisasi</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Judul Kegiatan</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Tanggal Upload</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-500">Pengupload</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Status</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Jumlah Dokumen</th>
                <th class="text-center py-3 px-4 font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="activity in filteredActivities"
                :key="activity.id"
                class="border-b border-slate-100 hover:bg-slate-50 transition"
              >
                <td class="py-4 px-4 text-slate-600 font-medium">
                  {{ activity.ormawaName }}
                </td>
                <td class="py-4 px-4 text-slate-800 font-semibold">
                  {{ activity.judulKegiatan }}
                </td>
                <td class="py-4 px-4 text-slate-500">
                  {{ formatDate(activity.latestUpload) }}
                </td>
                <td class="py-4 px-4 text-slate-600">
                  {{ activity.pengajuNama }}
                </td>
                <td class="py-4 px-4 text-center">
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                    :class="activity.statusKegiatan === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ activity.statusKegiatan }}
                  </span>
                </td>
                <td class="py-4 px-4 text-center">
                  <p class="text-xs text-slate-500">
                    {{ activity.docDescription }}
                  </p>
                </td>
                <td class="py-4 px-4 text-center">
                  <NuxtLink
                    :to="`/dashboard/ppk/detailPencairan/${activity.id}`"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d1a82a]/10 text-[#a78317] hover:bg-[#d1a82a]/20 transition font-medium text-sm"
                  >
                    <Icon name="heroicons:eye" class="w-4 h-4" />
                    Detail
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="filteredActivities.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  <Icon name="heroicons:inbox" class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Tidak ada data kegiatan</p>
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
import { storeToRefs } from "pinia";
import { usePpkPencairanStore } from "~/stores/ppk/pencairan";

const store = usePpkPencairanStore();
const { searchQuery, filterStatus, filteredActivities } = storeToRefs(store);
const { fetchActivities, formatDate } = store;

onMounted(() => {
  fetchActivities();
});
</script>
