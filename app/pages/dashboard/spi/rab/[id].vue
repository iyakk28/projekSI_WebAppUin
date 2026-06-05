<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{
            rab?.nomorPengajuan
          }}</span>
          <div
            class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full"
          >
            {{ todayStr }}
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div
      v-if="detailStore.loading"
      class="flex items-center justify-center py-32"
    >
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat data pengajuan...</p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="detailStore.error"
      class="flex items-center justify-center py-32"
    >
      <div class="text-center text-slate-400">
        <Icon
          name="heroicons:exclamation-circle"
          class="w-12 h-12 mx-auto mb-2 text-red-300"
        />
        <p class="font-medium text-red-500">Gagal memuat data</p>
        <p class="text-sm mt-1">{{ detailStore.error }}</p>
        <button
          @click="reloadData"
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Content -->
    <main
      v-else-if="rab"
      class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- LEFT: Info + Dokumen + Riwayat -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Info Kegiatan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#3b5988]/5 to-transparent"
          >
            <div
              class="w-9 h-9 rounded-xl bg-[#3b5988] text-white flex items-center justify-center"
            >
              <Icon name="heroicons:document-text" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-bold text-slate-800 text-lg">
                {{ rab.judulKegiatan }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ rab.ormawa }} · {{ rab.prodi || "Ormawa Fakultas" }}
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
                :class="statusClass(rab.status)"
              >
                {{ formatStatus(rab.status) }}
              </span>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Diajukan Oleh
              </p>
              <p class="font-medium text-slate-800">{{ rab.pengaju || "-" }}</p>
              <p class="text-xs text-slate-500">
                {{ rab.emailPengaju || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Organisasi
              </p>
              <p class="font-medium text-slate-800">{{ rab.ormawa || "-" }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Tanggal Kegiatan
              </p>
              <p class="font-medium text-slate-800">
                {{ formatDate(rab.tanggalMulai) }}
                <span
                  v-if="
                    rab.tanggalSelesai &&
                    rab.tanggalSelesai !== rab.tanggalMulai
                  "
                >
                  — {{ formatDate(rab.tanggalSelesai) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Anggaran
              </p>
              <p class="font-bold text-[#3b5988] text-lg">
                {{ formatRupiah(rab.totalAnggaran) }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Deskripsi
              </p>
              <p class="text-slate-700 text-sm leading-relaxed">
                {{ rab.deskripsi || "Tidak ada deskripsi" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Progress Pengajuan (Stepper) -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:chart-bar" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">Progress Pengajuan</h3>
            <span
              class="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
            >
              {{ getCurrentStepLabel() }}
            </span>
          </div>

          <div class="p-6">
            <!-- Horizontal Stepper (Desktop) -->
            <div class="hidden md:block">
              <div class="relative">
                <!-- Progress Bar Background -->
                <div
                  class="absolute top-5 left-0 w-full h-0.5 bg-slate-200 rounded-full"
                ></div>

                <!-- Dynamic Progress Fill -->
                <div
                  class="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#3b5988] to-[#5b7bb0] rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>

                <!-- Steps -->
                <div class="relative flex justify-between">
                  <div
                    v-for="(step, index) in timelineSteps"
                    :key="index"
                    class="flex flex-col items-center flex-1"
                  >
                    <!-- Step Circle -->
                    <div
                      class="relative z-10 mb-3 transition-all duration-300"
                      :class="{
                        'transform scale-110': step.isActive && !step.isError,
                      }"
                    >
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
                        :class="stepCircleClass(step)"
                      >
                        <Icon
                          v-if="step.isCompleted"
                          name="heroicons:check"
                          class="w-5 h-5 text-white"
                        />
                        <Icon
                          v-else-if="step.isError"
                          name="heroicons:exclamation-triangle"
                          class="w-5 h-5 text-white"
                        />
                        <span
                          v-else
                          class="text-sm font-bold"
                          :class="
                            step.isActive ? 'text-white' : 'text-slate-500'
                          "
                        >
                          {{ index + 1 }}
                        </span>
                      </div>
                      <div
                        v-if="
                          step.isActive && !step.isCompleted && !step.isError
                        "
                        class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#3b5988] animate-ping"
                      ></div>
                    </div>

                    <!-- Step Title -->
                    <div class="text-center">
                      <p
                        class="font-semibold text-sm mb-1 transition-colors"
                        :class="stepTextClass(step)"
                      >
                        {{ step.title }}
                      </p>
                      <p class="text-xs text-slate-500 max-w-[120px] mx-auto">
                        {{ step.description }}
                      </p>
                      <span
                        v-if="step.date"
                        class="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600"
                      >
                        {{ step.date }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vertical Timeline (Mobile) -->
            <div class="md:hidden">
              <div class="relative">
                <div
                  class="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"
                ></div>
                <div class="space-y-6">
                  <div
                    v-for="(step, index) in timelineSteps"
                    :key="index"
                    class="relative flex gap-4"
                  >
                    <div class="relative z-10">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                        :class="stepCircleClass(step)"
                      >
                        <Icon
                          v-if="step.isCompleted"
                          name="heroicons:check"
                          class="w-4 h-4 text-white"
                        />
                        <Icon
                          v-else-if="step.isError"
                          name="heroicons:exclamation-triangle"
                          class="w-4 h-4 text-white"
                        />
                        <span
                          v-else
                          class="text-xs font-bold"
                          :class="
                            step.isActive ? 'text-white' : 'text-slate-500'
                          "
                        >
                          {{ index + 1 }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div
                        class="flex items-center justify-between flex-wrap gap-2 mb-1"
                      >
                        <h4 class="font-semibold" :class="stepTextClass(step)">
                          {{ step.title }}
                        </h4>
                        <span
                          v-if="step.date"
                          class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"
                          >{{ step.date }}</span
                        >
                      </div>
                      <p class="text-sm text-slate-600 leading-relaxed">
                        {{ step.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Summary -->
            <div class="mt-6 pt-4 border-t border-slate-100">
              <div
                class="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4"
              >
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-[#3b5988]/10 flex items-center justify-center"
                    >
                      <Icon
                        name="heroicons:information-circle"
                        class="w-5 h-5 text-[#3b5988]"
                      />
                    </div>
                    <div>
                      <p class="text-xs text-slate-500 uppercase tracking-wide">
                        Status Saat Ini
                      </p>
                      <p class="font-semibold text-slate-800">
                        {{ getCurrentStatusDescription() }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <Icon name="heroicons:clock" class="w-4 h-4" />
                    <span
                      >Terakhir diperbarui:
                      {{ formatDate(rab?.updatedAt) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Dokumen -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <h3
              class="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"
            >
              <Icon
                name="heroicons:document-text"
                class="w-5 h-5 text-[#d1a82a]"
              />
              Preview Dokumen
            </h3>

            <div class="flex gap-2 p-1 bg-slate-100 rounded-xl inline-flex">
              <button
                @click="activeDocumentTab = 'rab'"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  activeDocumentTab === 'rab'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                <Icon name="heroicons:calculator" class="w-4 h-4" />
                RAB
              </button>
              <button
                @click="activeDocumentTab = 'tor'"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  activeDocumentTab === 'tor'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                <Icon name="heroicons:document-duplicate" class="w-4 h-4" />
                TOR
              </button>
            </div>
          </div>

          <div class="p-6">
            <div v-if="currentFileObjectUrl" class="w-full">
              <iframe
                :src="currentFileObjectUrl"
                class="w-full h-[600px] rounded-xl border border-slate-200"
                frameborder="0"
              ></iframe>
              <div class="flex justify-center gap-3 mt-4">
                <button
                  @click="openDocument"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition-all"
                >
                  <Icon name="heroicons:eye" class="w-5 h-5" />
                  Buka {{ activeDocumentTab.toUpperCase() }} di Tab Baru
                </button>
              </div>
            </div>

            <div
              v-else
              class="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div
                class="w-20 h-20 rounded-2xl bg-[#3b5988]/10 flex items-center justify-center mb-4"
              >
                <Icon
                  name="heroicons:document-text"
                  class="w-10 h-10 text-[#3b5988]"
                />
              </div>
              <h4 class="text-lg font-semibold text-slate-900 mb-2">
                Belum ada file
              </h4>
              <p class="text-sm text-slate-500 mb-4 max-w-sm">
                File {{ activeDocumentTab.toUpperCase() }} tidak tersedia atau
                gagal dimuat.
              </p>
            </div>
          </div>
        </div>

        <!-- Riwayat Persetujuan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:clock" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">
              Riwayat Persetujuan & Revisi
            </h3>
            <span
              v-if="approvalLogs.length"
              class="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold"
            >
              {{ approvalLogs.length }} entri
            </span>
          </div>
          <div class="p-6">
            <!-- Upload pertama -->
            <div class="flex gap-4 mb-4">
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0"
                >
                  <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                </div>
                <div
                  v-if="approvalLogs.length"
                  class="w-0.5 flex-1 bg-slate-200 mt-2"
                ></div>
              </div>
              <div class="pb-4">
                <p class="text-sm font-semibold text-slate-800">
                  Pengajuan diunggah
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  oleh {{ rab.pengaju || "Pengaju" }} ·
                  {{ formatDateTime(rab.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Riwayat approval -->
            <div v-if="approvalLogs.length" class="space-y-0">
              <div
                v-for="(log, i) in approvalLogs"
                :key="log.id"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="logIconClass(log.action)"
                  >
                    <Icon :name="logIcon(log.action)" class="w-4 h-4" />
                  </div>
                  <div
                    v-if="i < approvalLogs.length - 1"
                    class="w-0.5 flex-1 bg-slate-200 mt-2"
                  ></div>
                </div>
                <div class="pb-4 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm font-semibold text-slate-800">
                      {{ logLabel(log) }}
                    </p>
                    <span class="text-xs text-slate-400 whitespace-nowrap">{{
                      formatDateTime(log.createdAt)
                    }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    oleh {{ log.actor?.fullname || log.actor?.nama }} ({{
                      log.actor?.role
                    }})
                  </p>
                  <div
                    v-if="log.catatanRevisi"
                    class="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800"
                  >
                    <span class="font-semibold">Catatan:</span>
                    {{ log.catatanRevisi }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6 text-slate-400">
              <p class="text-sm">Belum ada riwayat persetujuan</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Ringkasan + Aksi SPI -->
      <div class="space-y-6">
        <!-- Ringkasan -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Ringkasan</h3>
          </div>
          <div class="p-5 space-y-4">
            <div class="bg-[#3b5988] rounded-xl p-4 text-white">
              <p class="text-xs opacity-70 mb-1">Total Anggaran Diajukan</p>
              <p class="text-xl font-bold">
                {{ formatRupiah(rab.totalAnggaran) }}
              </p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Pengaju</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ rab.pengaju || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Fakultas</span>
                <span class="font-medium text-slate-800">{{
                  rab.fakultas || "-"
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Ormawa</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ rab.ormawa || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal Upload</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(rab.createdAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Status Saat Ini</span>
                <span
                  class="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="statusClass(rab.status)"
                >
                  {{ formatStatus(rab.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aksi SPI (hanya untuk status waiting_spi) -->
        <div
          v-if="rab.status === 'waiting_spi'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Keputusan SPI</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Tinjau pengajuan lalu berikan keputusan
            </p>
          </div>
          <div class="p-5 space-y-4">
            <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon
                  name="heroicons:information-circle"
                  class="w-4 h-4 text-blue-600"
                />
                <h4 class="font-bold text-blue-800 text-xs uppercase">
                  Tugas SPI
                </h4>
              </div>
              <ul class="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Verifikasi kesesuaian antara TOR dan RAB</li>
                <li>Pastikan rincian biaya masuk akal dan efisien</li>
                <li>Periksa kelengkapan administrasi dokumen</li>
                <li>Berikan rekomendasi persetujuan atau perbaikan</li>
              </ul>
            </div>

            <div>
              <label class="text-sm font-semibold text-slate-700 block mb-1.5">
                Catatan / Alasan
                <span class="font-normal text-slate-400"
                  >(wajib untuk revisi & tolak)</span
                >
              </label>
              <textarea
                v-model="actionCatatan"
                rows="4"
                class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988] resize-none"
                placeholder="Tuliskan catatan atau alasan keputusan..."
              ></textarea>
            </div>

            <div class="space-y-2">
              <button
                @click="openActionModal('setuju')"
                :disabled="persetujuanStore.loading"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-md"
              >
                <Icon name="heroicons:check-circle" class="w-5 h-5" />
                Setujui Pengajuan
              </button>
              <button
                @click="openActionModal('revisi')"
                :disabled="persetujuanStore.loading || !actionCatatan.trim()"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-sm"
              >
                <Icon name="heroicons:arrow-path" class="w-5 h-5" />
                Minta Revisi
              </button>
              <button
                @click="openActionModal('tolak')"
                :disabled="persetujuanStore.loading || !actionCatatan.trim()"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-sm"
              >
                <Icon name="heroicons:x-circle" class="w-5 h-5" />
                Tolak Pengajuan
              </button>
            </div>

            <p
              v-if="persetujuanStore.loading"
              class="text-center text-xs text-slate-400 animate-pulse"
            >
              Memproses keputusan...
            </p>
            <p v-if="actionError" class="text-center text-xs text-red-500">
              {{ actionError }}
            </p>
          </div>
        </div>

        <!-- Keputusan sudah diberikan -->
        <div
          v-else-if="rab.status !== 'waiting_spi'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
        >
          <div class="flex items-center gap-2 text-slate-500 text-sm">
            <Icon name="heroicons:information-circle" class="w-5 h-5" />
            <span>Keputusan telah diberikan untuk pengajuan ini.</span>
          </div>
        </div>

        <!-- Informasi Tugas SPI (untuk non-waiting_spi) -->
        <div
          v-if="rab.status !== 'waiting_spi'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100 bg-blue-50/30">
            <div class="flex items-center gap-2">
              <Icon
                name="heroicons:information-circle"
                class="w-5 h-5 text-blue-600"
              />
              <h3 class="font-bold text-slate-800 text-sm">
                Informasi Pengajuan
              </h3>
            </div>
          </div>
          <div class="p-5">
            <p class="text-sm text-slate-600">
              Pengajuan ini saat ini dalam status
              <span
                class="font-semibold"
                :class="getStatusTextColor(rab.status)"
                >{{ formatStatus(rab.status) }}</span
              >. Tidak diperlukan tindakan dari SPI saat ini.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Action Modal (Konfirmasi) -->
    <div
      v-if="showActionModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showActionModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center text-white',
              actionType === 'setuju'
                ? 'bg-emerald-500'
                : actionType === 'tolak'
                  ? 'bg-red-500'
                  : 'bg-amber-500',
            ]"
          >
            <Icon
              :name="
                actionType === 'setuju'
                  ? 'heroicons:check'
                  : actionType === 'tolak'
                    ? 'heroicons:x-mark'
                    : 'heroicons:arrow-path'
              "
              class="w-5 h-5"
            />
          </div>
          <h3 class="text-xl font-bold text-slate-900">
            {{
              actionType === "setuju"
                ? "Setujui Pengajuan"
                : actionType === "tolak"
                  ? "Tolak Pengajuan"
                  : "Minta Revisi"
            }}
          </h3>
        </div>

        <p class="text-sm text-slate-600 mb-6">
          {{
            actionType === "setuju"
              ? "Anda akan menyetujui dokumen RAB dan TOR ini. Pastikan semua rincian telah diperiksa."
              : "Berikan catatan spesifik mengapa dokumen ini dikembalikan atau ditolak agar pengaju dapat memperbaikinya."
          }}
        </p>

        <div v-if="actionType !== 'setuju'" class="mb-6">
          <div
            class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700"
          >
            <span class="font-semibold">Catatan yang akan diberikan:</span>
            <p class="mt-1">{{ actionCatatan || "(Belum diisi)" }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="showActionModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
          >
            Batal
          </button>
          <button
            @click="submitAction"
            :disabled="persetujuanStore.loading"
            :class="[
              'px-4 py-2 rounded-xl text-white transition-all font-medium disabled:opacity-50 flex items-center gap-2',
              actionType === 'setuju'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : actionType === 'tolak'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-500 hover:bg-amber-600',
            ]"
          >
            <Icon
              v-if="persetujuanStore.loading"
              name="heroicons:arrow-path"
              class="w-4 h-4 animate-spin"
            />
            {{ persetujuanStore.loading ? "Memproses..." : "Konfirmasi" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useSpiRabDetailStore } from "~/stores/spi/rabDetail";
  import { useSpiApprovalLogStore } from "~/stores/spi/approvalLog";
  import { useSpiPersetujuanStore } from "~/stores/spi/persetujuanRab";
  import { storeToRefs } from "pinia";

  const route = useRoute();
  const router = useRouter();
  const detailStore = useSpiRabDetailStore();
  const approveLogStore = useSpiApprovalLogStore();
  const persetujuanStore = useSpiPersetujuanStore();

  const { logs: approvalLogs } = storeToRefs(approveLogStore);
  const rab = computed(() => detailStore.rabDetail);

  const activeDocumentTab = ref<"rab" | "tor">("rab");
  const currentFileObjectUrl = computed(() =>
    activeDocumentTab.value === "rab"
      ? detailStore.fileRabObjectUrl
      : detailStore.fileTorObjectUrl,
  );

  // Action State
  const showActionModal = ref(false);
  const actionType = ref<"setuju" | "tolak" | "revisi">("setuju");
  const actionCatatan = ref("");
  const actionError = ref("");

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const reloadData = async () => {
    const id = Number(route.params.id);
    if (id) {
      await Promise.all([
        detailStore.fetchFullDetail(id),
        approveLogStore.fetchApprovalLogs(id),
      ]);
    }
  };

  const openActionModal = (type: "setuju" | "tolak" | "revisi") => {
    actionType.value = type;
    actionError.value = "";
    showActionModal.value = true;
  };

  const submitAction = async () => {
    if (
      (actionType.value === "tolak" || actionType.value === "revisi") &&
      !actionCatatan.value.trim()
    ) {
      actionError.value = "Catatan wajib diisi untuk revisi atau tolak.";
      return;
    }

    const res = await persetujuanStore.processAction(
      rab.value.id,
      actionType.value,
      actionCatatan.value,
    );

    if (res.success) {
      showActionModal.value = false;
      actionCatatan.value = "";
      await reloadData();
    } else {
      actionError.value = res.message || "Gagal memproses keputusan.";
    }
  };

  const goBack = () => router.back();

  const openDocument = () => {
    if (currentFileObjectUrl.value) {
      window.open(currentFileObjectUrl.value, "_blank");
    }
  };

  // Helper Functions
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRupiah = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(num);
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = {
      draft: "Draft",
      waiting_kaprodi: "Menunggu Kaprodi",
      revisi_kaprodi: "Revisi Kaprodi",
      waiting_ppk: "Menunggu PPK",
      revisi_ppk: "Revisi PPK",
      waiting_spi: "Menunggu SPI",
      ditolak_spi: "Ditolak SPI",
      revisi_spi: "Revisi SPI",
      disetujui: "Disetujui",
      lunas_ppk: "Lunas (PPK)",
      selesai_spi: "Selesai",
    };
    return map[status] || status || "-";
  };

  const statusClass = (status?: string) => {
    const map: Record<string, string> = {
      waiting_kaprodi: "bg-amber-100 text-amber-700",
      revisi_kaprodi: "bg-orange-100 text-orange-700",
      waiting_ppk: "bg-blue-100 text-blue-700",
      revisi_ppk: "bg-orange-100 text-orange-700",
      waiting_spi: "bg-blue-100 text-blue-700",
      disetujui: "bg-emerald-100 text-emerald-700",
      lunas_ppk: "bg-emerald-100 text-emerald-700",
      selesai_spi: "bg-emerald-100 text-emerald-700",
      selesai: "bg-emerald-100 text-emerald-700",
      ditolak_spi: "bg-red-100 text-red-700",
      revisi_spi: "bg-orange-100 text-orange-700",
      draft: "bg-slate-100 text-slate-600",
    };
    return map[status || ""] || "bg-slate-100 text-slate-600";
  };

  const getStatusTextColor = (status: string) => {
    const map: Record<string, string> = {
      disetujui: "text-emerald-600",
      selesai_spi: "text-emerald-600",
      ditolak_spi: "text-red-600",
      revisi_spi: "text-amber-600",
      waiting_spi: "text-blue-600",
    };
    return map[status] || "text-slate-600";
  };

  // Timeline helpers
  const timelineSteps = computed(() => {
    const status = rab.value?.status || "draft";
    const statusToStepMap: Record<string, number> = {
      draft: 0,
      waiting_kaprodi: 1,
      revisi_kaprodi: 1,
      waiting_ppk: 2,
      revisi_ppk: 2,
      waiting_spi: 3,
      ditolak_spi: 3,
      revisi_spi: 3,
      disetujui: 4,
      lunas_ppk: 4,
      selesai_spi: 4,
    };
    const currentStepIndex = statusToStepMap[status] ?? 0;
    const isRevisi = status.includes("revisi") || status === "ditolak_spi";

    const steps = [
      {
        title: "Pengajuan",
        description: "Dokumen RAB & TOR diajukan",
        date: formatDate(rab.value?.createdAt),
      },
      { title: "Review Kaprodi", description: "Verifikasi oleh Ketua Prodi" },
      { title: "Review PPK", description: "Verifikasi anggaran oleh PPK" },
      { title: "Review SPI", description: "Audit oleh Satuan SPI" },
      { title: "Selesai", description: "Pengajuan disetujui" },
    ];

    return steps.map((step, index) => ({
      ...step,
      isActive: index === currentStepIndex,
      isCompleted:
        index < currentStepIndex ||
        (index === 4 && (status === "disetujui" || status === "selesai_spi")),
      isError: index === currentStepIndex && isRevisi,
    }));
  });

  const stepCircleClass = (step: any) => {
    if (step.isCompleted) return "bg-emerald-500 ring-4 ring-emerald-100";
    if (step.isError) return "bg-amber-500 ring-4 ring-amber-100";
    if (step.isActive) return "bg-[#3b5988] ring-4 ring-[#3b5988]/20";
    return "bg-white border-2 border-slate-300";
  };

  const stepTextClass = (step: any) => {
    if (step.isActive) return "text-[#3b5988]";
    if (step.isCompleted) return "text-slate-900";
    if (step.isError) return "text-amber-600";
    return "text-slate-500";
  };

  const progressPercentage = computed(() => {
    const status = rab.value?.status || "draft";
    const stepIndex: Record<string, number> = {
      draft: 0,
      waiting_kaprodi: 1,
      revisi_kaprodi: 1,
      waiting_ppk: 2,
      revisi_ppk: 2,
      waiting_spi: 3,
      ditolak_spi: 3,
      revisi_spi: 3,
      disetujui: 4,
      lunas_ppk: 4,
      selesai_spi: 4,
    };
    return ((stepIndex[status] || 0) / 4) * 100;
  });

  const getCurrentStepLabel = () => {
    const status = rab.value?.status || "draft";
    const map: Record<string, string> = {
      draft: "Draft Awal",
      waiting_kaprodi: "Menunggu Review Kaprodi",
      revisi_kaprodi: "Revisi diperlukan",
      waiting_ppk: "Menunggu Review PPK",
      revisi_ppk: "Revisi diperlukan",
      waiting_spi: "Review SPI (Saat Ini)",
      ditolak_spi: "Ditolak SPI",
      revisi_spi: "Revisi diperlukan",
      disetujui: "Disetujui",
      lunas_ppk: "Dana Cair",
      selesai_spi: "Selesai",
    };
    return map[status] || status;
  };

  const getCurrentStatusDescription = () => {
    const status = rab.value?.status || "draft";
    const map: Record<string, string> = {
      waiting_spi:
        "Dokumen sedang dalam proses audit oleh Satuan Pengawasan Internal",
      revisi_spi: "Dokumen perlu diperbaiki sesuai catatan SPI",
      ditolak_spi: "Dokumen ditolak oleh SPI, periksa catatan untuk detailnya",
      disetujui: "Semua dokumen telah disetujui, menunggu pencairan",
    };
    return map[status] || "Proses pengajuan berjalan";
  };

  // Log helpers
  const logIcon = (action?: string) => {
    const map: Record<string, string> = {
      setuju: "heroicons:check-circle",
      disetujui: "heroicons:check-circle",
      revisi: "heroicons:arrow-path",
      tolak: "heroicons:x-circle",
      submit: "heroicons:arrow-up-tray",
    };
    return map[action || ""] || "heroicons:ellipsis-horizontal-circle";
  };

  const logIconClass = (action?: string) => {
    const map: Record<string, string> = {
      setuju: "bg-emerald-100 text-emerald-600",
      disetujui: "bg-emerald-100 text-emerald-600",
      revisi: "bg-amber-100 text-amber-600",
      tolak: "bg-red-100 text-red-600",
    };
    return map[action || ""] || "bg-slate-100 text-slate-500";
  };

  const logLabel = (log: any) => {
    const action = log.action;
    const role = log.actor?.role?.toUpperCase() || "";
    if (action === "setuju" || action === "disetujui")
      return `Disetujui oleh ${role}`;
    if (action === "revisi") return `Diminta revisi oleh ${role}`;
    if (action === "tolak") return `Ditolak oleh ${role}`;
    return action || "-";
  };

  onMounted(async () => {
    await reloadData();
  });

  onBeforeUnmount(() => {
    detailStore.cleanupFileUrls();
    approveLogStore.clearLogs();
  });
</script>

<style scoped>
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
