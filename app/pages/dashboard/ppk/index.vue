<!-- FILE: app/pages/dashboard/ppk/index.vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Main Content tanpa sidebar -->
    <div class="transition-all duration-300">
      <!-- Header -->
      <header
        class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div>
              <h2 class="text-xl font-bold text-slate-900">
                Dashboard <span class="text-[#d1a82a]">PPK</span>
              </h2>
              <p class="text-sm text-slate-500">
                Monitoring keuangan ormawa —
                {{ selectedOrmawa?.nama || "Semua Ormawa" }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="glass-chip flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 px-4 py-2 shadow-sm"
            >
              <Icon
                name="heroicons:adjustments-horizontal"
                class="w-4 h-4 text-[#d1a82a]"
              />

              <select
                v-model="selectedOrmawaId"
                @change="onOrmawaChange"
                class="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Semua Ormawa</option>

                <optgroup
                  v-for="fak in ormawaList"
                  :key="fak.id"
                  :label="fak.nama"
                >
                  <option
                    v-for="orm in fak.ormawa"
                    :key="orm.id"
                    :value="orm.id"
                  >
                    {{ orm.nama }} ({{ orm.kode }})
                  </option>
                </optgroup>
              </select>
            </div>

            <div
              class="date-chip bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md"
            >
              {{ todayStr }}
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <main class="p-4 sm:p-6 lg:p-8 space-y-6">
        <!-- Stats Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          <!-- Total Anggaran -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-[#3b5988]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-[#3b5988]/10 text-[#3b5988]">
                  <Icon name="heroicons:banknotes" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ formatRp(currentData.totalAnggaran) }}
              </h3>
              <p class="text-sm text-slate-500">Total Anggaran</p>
            </div>
          </div>

          <!-- Terpakai -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                  <Icon name="heroicons:clock" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ formatRp(currentData.terpakai) }}
              </h3>
              <p class="text-sm text-slate-500">Terpakai</p>
              <span class="inline-block mt-1 text-xs text-slate-400">
                {{ usedPct }}% dari total
              </span>
            </div>
          </div>

          <!-- Sisa Anggaran -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Icon name="heroicons:check-badge" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ formatRp(currentData.sisa) }}
              </h3>
              <p class="text-sm text-slate-500">Sisa Anggaran</p>
              <span class="inline-block mt-1 text-xs text-slate-400">
                {{ 100 - usedPct }}% tersisa
              </span>
            </div>
          </div>

          <!-- Total Kegiatan -->
          <div
            class="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:shadow-lg transition-all duration-300"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
            ></div>

            <div class="relative">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                  <Icon name="heroicons:document-text" class="w-6 h-6" />
                </div>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1">
                {{ currentData.totalKegiatan }}
              </h3>
              <p class="text-sm text-slate-500">Total Kegiatan</p>
              <span class="inline-block mt-1 text-xs text-slate-400">
                Proposal aktif
              </span>
            </div>
          </div>
        </div>

        <!-- Budget Hero -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
        >
          <div class="flex flex-wrap justify-between items-center gap-4">
            <div>
              <span
                class="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                PENGGUNAAN ANGGARAN
              </span>

              <div class="flex items-baseline gap-2 mt-1">
                <span
                  class="text-5xl font-bold text-[#d1a82a]"
                  :class="{
                    'text-red-500': usedPct >= 90,
                    'text-amber-500': usedPct >= 70 && usedPct < 90,
                  }"
                >
                  {{ usedPct }}<span class="text-3xl">%</span>
                </span>
                <span class="text-sm text-slate-500">terpakai</span>
              </div>
            </div>

            <div class="flex-1 min-w-[200px]">
              <div
                class="relative h-4 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  class="absolute left-0 top-0 h-full bg-gradient-to-r from-[#3b5988] to-[#d1a82a] rounded-full transition-all duration-700"
                  :style="{ width: usedPct + '%' }"
                ></div>
              </div>

              <div class="flex justify-between text-xs text-slate-400 mt-2">
                <span>Rp 0</span>
                <span>{{ formatRp(currentData.totalAnggaran) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Bar Chart -->
          <div
            class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-bold text-slate-900">
                  Anggaran per Ormawa
                </h3>
                <p class="text-sm text-slate-500">
                  Komparasi anggaran & penggunaan se-fakultas
                </p>
              </div>

              <span
                class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full"
              >
                {{ barData.length }} ormawa
              </span>
            </div>

            <div class="space-y-4">
              <div v-for="(bar, idx) in barData" :key="idx" class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="font-semibold text-slate-700">
                    {{ bar.kode }}
                  </span>
                  <span class="text-slate-500">
                    {{ formatRpShort(bar.terpakai) }} /
                    {{ formatRpShort(bar.anggaran) }}
                  </span>
                </div>

                <div
                  class="relative h-2 bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    class="absolute left-0 top-0 h-full bg-slate-300 rounded-full"
                    :style="{ width: bar.totalPct + '%' }"
                  ></div>
                  <div
                    class="absolute left-0 top-0 h-full bg-[#d1a82a] rounded-full"
                    :style="{ width: bar.usedPct + '%' }"
                  ></div>
                </div>
              </div>

              <div
                v-if="barData.length === 0"
                class="py-8 text-center text-sm text-slate-400"
              >
                Belum ada data anggaran Ormawa.
              </div>
            </div>

            <div class="flex gap-4 mt-4 text-xs text-slate-500">
              <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-slate-300 rounded-full"></span>
                Tersedia
              </div>
              <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-[#d1a82a] rounded-full"></span>
                Terpakai
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Status Kegiatan -->
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-bold text-slate-900">
                    Status Kegiatan
                  </h3>
                  <p class="text-sm text-slate-500">
                    {{
                      selectedOrmawa
                        ? `Rekap proposal ${selectedOrmawa.nama}`
                        : "Rekap seluruh proposal fakultas"
                    }}
                  </p>
                </div>

                <span
                  class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full"
                >
                  {{ currentData.totalKegiatan }} total
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="st in statusData"
                  :key="st.label"
                  class="bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{
                        backgroundColor: st.color,
                        boxShadow: `0 0 6px ${st.color}`,
                      }"
                    ></span>
                    <span class="text-xs font-semibold text-slate-700">
                      {{ st.label }}
                    </span>
                  </div>

                  <div class="text-2xl font-bold text-slate-800">
                    {{ st.count }}
                  </div>

                  <div
                    class="h-1 bg-slate-200 rounded-full mt-2 overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: st.pct + '%',
                        backgroundColor: st.color,
                      }"
                    ></div>
                  </div>

                  <div class="text-right text-xs text-slate-400 mt-1">
                    {{ st.pct }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress Ormawa -->
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 class="text-lg font-bold text-slate-900 mb-4">
                Progress Ormawa
              </h3>

              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="text-left py-2 font-semibold text-slate-500">
                        Ormawa
                      </th>
                      <th class="text-center py-2 font-semibold text-slate-500">
                        Kegiatan
                      </th>
                      <th class="text-center py-2 font-semibold text-slate-500">
                        ✓ ACC
                      </th>
                      <th class="text-right py-2 font-semibold text-slate-500">
                        Progress
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="row in ormawaRows"
                      :key="row.id"
                      class="border-b border-slate-100 hover:bg-slate-50"
                      :class="{ 'bg-amber-50': selectedOrmawaId == row.id }"
                    >
                      <td class="py-2 font-medium" :class="selectedOrmawaId == row.id ? 'text-[#d1a82a]' : 'text-slate-800'">
                        {{ row.nama }}
                      </td>

                      <td class="py-2 text-center text-slate-600">
                        {{ row.kegiatan }}
                      </td>

                      <td
                        class="py-2 text-center text-emerald-600 font-semibold"
                      >
                        {{ row.disetujui }}
                      </td>

                      <td class="py-2">
                        <div class="flex items-center gap-2">
                          <div
                            class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                          >
                            <div
                              class="h-full bg-[#d1a82a] rounded-full"
                              :style="{ width: row.progPct + '%' }"
                            ></div>
                          </div>

                          <span class="text-xs text-slate-500 w-10 text-right">
                            {{ row.progPct }}%
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr v-if="ormawaRows.length === 0">
                      <td colspan="4" class="py-6 text-center text-slate-500">
                        Belum ada data progress Ormawa.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Daftar Kegiatan Ormawa -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"
          >
            <div>
              <h3 class="text-lg font-bold text-slate-900">
                Daftar Kegiatan {{ selectedOrmawa ? selectedOrmawa.nama : 'Ormawa' }}
              </h3>
              <p class="text-sm text-slate-500">
                {{ selectedOrmawa 
                  ? `Menampilkan seluruh pengajuan dari ${selectedOrmawa.nama}.` 
                  : 'Seluruh pengajuan RAB/TOR dari ormawa fakultas Anda, beserta status, pencairan, dan status SPI/LPJ.'
                }}
              </p>
            </div>

            <span
              class="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full"
            >
              {{ activityRows.length }} kegiatan
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-left text-slate-500">
                  <th class="py-2 font-semibold">Ormawa</th>
                  <th class="py-2 font-semibold">Judul Kegiatan</th>
                  <th class="py-2 font-semibold">Status RAB</th>
                  <th class="py-2 font-semibold">Status Kegiatan</th>
                  <th class="py-2 font-semibold">Pencairan</th>
                  <th class="py-2 font-semibold">SPI / LPJ</th>
                  <th class="py-2 font-semibold text-right">Detail</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="activityRows.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-500">
                    Belum ada pengajuan kegiatan dari ormawa di fakultas Anda.
                  </td>
                </tr>

                <tr
                  v-for="item in activityRows"
                  :key="item.id"
                  class="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td class="py-3 font-medium text-slate-800">
                    {{ item.ormawa.nama }}
                  </td>

                  <td class="py-3 text-slate-700">
                    {{ item.judulKegiatan }}
                  </td>

                  <td class="py-3 text-slate-600 capitalize">
                    {{ item.status.replaceAll("_", " ") }}
                  </td>

                  <td class="py-3 text-slate-600">
                    {{ item.statusKegiatan || "Belum dibuat" }}
                  </td>

                  <td class="py-3 text-slate-600">
                    <div>{{ item.pencairanLabel }}</div>
                    <div class="text-xs text-slate-400">
                      {{ formatRpShort(item.pencairanNominal) }}
                    </div>
                  </td>

                  <td class="py-3 text-slate-600">
                    {{ item.lpjStatus }}
                  </td>

                  <td class="py-3 text-right">
                    <button
                      type="button"
                      class="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                      @click="
                        item.status === 'waiting_ppk' 
                          ? navigateTo(`/dashboard/ppk/detailRab/${item.id}`)
                          : navigateTo(`/dashboard/ppk/detailPengajuan/${item.id}`)
                      "
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from "pinia";
  import { usePpkDashboardStore } from "~/stores/ppk/dashboard";

  const ppkDashboardStore = usePpkDashboardStore();

  const {
    selectedOrmawaId,
    selectedOrmawa,
    todayStr,
    ormawaList,
    currentData,
    usedPct,
    barData,
    statusData,
    ormawaRows,
    activityRows,
  } = storeToRefs(ppkDashboardStore);

  const { fetchAll, onOrmawaChange, formatRp, formatRpShort } =
    ppkDashboardStore;

  await fetchAll();
</script>

<style scoped>
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
