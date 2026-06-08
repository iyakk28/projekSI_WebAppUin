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
            rabData?.nomorPengajuan
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
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat data pengajuan...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center py-32">
      <div class="text-center text-slate-400">
        <Icon
          name="heroicons:exclamation-circle"
          class="w-12 h-12 mx-auto mb-2 text-red-300"
        />
        <p class="font-medium text-red-500">Gagal memuat data</p>
        <p class="text-sm mt-1">{{ error }}</p>
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
      v-else-if="rabData"
      class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- LEFT: Info + Progress + Dokumen + Riwayat -->
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
                {{ rabData.judulKegiatan }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ rabData.ormawaName }} ·
                {{ rabData.ormawaKode }}
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
                :class="statusClass(rabData.status)"
              >
                {{ formatStatus(rabData.status) }}
              </span>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Diajukan Oleh
              </p>
              <p class="font-medium text-slate-800">
                {{ rabData.userName || "-" }}
              </p>
              <p class="text-xs text-slate-500">
                {{ rabData.userEmail || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Organisasi
              </p>
              <p class="font-medium text-slate-800">
                {{ rabData.ormawaName || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Tanggal Kegiatan
              </p>
              <p class="font-medium text-slate-800">
                {{ formatDate(rabData.tanggalMulai) }}
                <span
                  v-if="
                    rabData.tanggalSelesai &&
                    rabData.tanggalSelesai !== rabData.tanggalMulai
                  "
                >
                  — {{ formatDate(rabData.tanggalSelesai) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Anggaran
              </p>
              <p class="font-bold text-[#3b5988] text-lg">
                Rp {{ formatCurrency(rabData.totalAnggaran) }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Deskripsi
              </p>
              <p class="text-slate-700 text-sm leading-relaxed">
                {{ rabData.deskripsi || "-" }}
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
                    :style="{ animationDelay: `${index * 0.05}s` }"
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
                      {{ formatDate(rabData?.updatedAt) }}</span
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
                v-if="isPdf"
                :src="currentFileObjectUrl"
                class="w-full h-[600px] rounded-xl border border-slate-200"
                frameborder="0"
              ></iframe>
              <div v-else class="text-center py-12">
                <Icon
                  name="heroicons:document"
                  class="w-16 h-16 text-slate-400 mx-auto mb-4"
                />
                <p class="text-slate-600 mb-4">
                  Preview tidak tersedia untuk tipe file ini.
                </p>
                <button
                  @click="downloadDocument"
                  class="px-4 py-2 bg-[#3b5988] text-white rounded-lg"
                >
                  Download {{ activeDocumentTab.toUpperCase() }}
                </button>
              </div>
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
              v-if="totalLogs"
              class="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold"
            >
              {{ totalLogs }} entri
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
                  v-if="approvalLogs?.length"
                  class="w-0.5 flex-1 bg-slate-200 mt-2"
                ></div>
              </div>
              <div class="pb-4">
                <p class="text-sm font-semibold text-slate-800">
                  Pengajuan diunggah
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  oleh {{ ormawaData?.fullName || ormawaData?.nama }} ·
                  {{ formatDateTime(rabData?.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Riwayat approval -->
            <div v-if="approvalLogs?.length" class="space-y-0">
              <div
                v-for="(log, i) in approvalLogs"
                :key="log.approvalLog.id"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="logIconClass(log.approvalLog.action)"
                  >
                    <Icon
                      :name="logIcon(log.approvalLog.action)"
                      class="w-4 h-4"
                    />
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
                      formatDateTime(log.approvalLog.createdAt)
                    }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    oleh {{ log.actor?.fullname || log.actor?.nama }} ({{
                      log.actor?.role
                    }})
                  </p>
                  <div
                    v-if="log.approvalLog.catatanRevisi"
                    class="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800"
                  >
                    <span class="font-semibold">Catatan:</span>
                    {{ log.approvalLog.catatanRevisi }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="hasMoreLogs" class="flex justify-center mt-6 pt-2">
              <button
                @click="loadMoreLogs"
                :disabled="loadingLogs"
                class="flex items-center gap-2 px-6 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#3b5988] transition-all disabled:opacity-50"
              >
                <Icon
                  v-if="loadingLogs"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin"
                />
                Lihat lebih banyak
              </button>
            </div>

            <div
              v-if="!approvalLogs?.length && !loadingLogs"
              class="text-center py-6 text-slate-400"
            >
              <p class="text-sm">Belum ada riwayat persetujuan</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Ringkasan + Aksi -->
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
                Rp {{ formatCurrency(rabData.totalAnggaran) }}
              </p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Pengaju</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ ormawaData?.fullName || ormawaData?.nama || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal Upload</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(rabData.createdAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Terakhir Update</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(rabData.updatedAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Jadwal Acara</span>
                <span class="font-medium text-slate-800 text-right">
                  {{ formatDate(rabData.tanggalMulai)
                  }}<br
                    v-if="
                      rabData.tanggalSelesai &&
                      rabData.tanggalSelesai !== rabData.tanggalMulai
                    "
                  />
                  <span
                    v-if="
                      rabData.tanggalSelesai &&
                      rabData.tanggalSelesai !== rabData.tanggalMulai
                    "
                    >— {{ formatDate(rabData.tanggalSelesai) }}</span
                  >
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Status Saat Ini</span>
                <span
                  class="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="statusClass(rabData.status)"
                >
                  {{ formatStatus(rabData.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aksi Ormawa -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Aksi Pengajuan</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Kelola pengajuan RAB & TOR Anda
            </p>
          </div>
          <div class="p-5 space-y-3">
            <!-- Tombol Ajukan (untuk draft) -->
            <button
              v-if="rabData.status === 'draft'"
              @click="showAjukanModal = true"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition text-sm shadow-md"
            >
              <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
              Ajukan Pengajuan
            </button>

            <!-- Tombol Edit (untuk draft dan revisi) -->
            <button
              v-if="
                [
                  'draft',
                  'revisi_kaprodi',
                  'revisi_ppk',
                  'revisi_spi',
                ].includes(rabData.status)
              "
              @click="openEditModal"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3b5988] hover:bg-[#2d4570] text-white rounded-xl font-semibold transition text-sm shadow-md"
            >
              <Icon name="heroicons:pencil-square" class="w-5 h-5" />
              Edit Data & Dokumen
            </button>

            <!-- Tombol Hapus Draft (khusus draft) -->
            <button
              v-if="rabData.status === 'draft'"
              @click="showDeleteModal = true"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:border-red-300 hover:bg-red-50 transition text-sm"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
              Hapus Draft
            </button>

            <!-- Informasi jika status sudah diajukan -->
            <div
              v-if="
                rabData.status !== 'draft' &&
                !['revisi_kaprodi', 'revisi_ppk', 'revisi_spi'].includes(
                  rabData.status,
                )
              "
              class="text-center py-3"
            >
              <div
                class="flex items-center justify-center gap-2 text-slate-500 text-sm"
              >
                <Icon name="heroicons:information-circle" class="w-5 h-5" />
                <span>Pengajuan sedang dalam proses review</span>
              </div>
            </div>

            <!-- Informasi revisi -->
            <div
              v-if="
                ['revisi_kaprodi', 'revisi_ppk', 'revisi_spi'].includes(
                  rabData.status,
                )
              "
              class="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200"
            >
              <div class="flex items-center gap-2 text-amber-700 text-xs">
                <Icon
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin"
                />
                <span class="font-medium">Dokumen perlu direvisi</span>
              </div>
              <p class="text-xs text-amber-600 mt-1">
                Silakan edit data dan upload ulang dokumen yang diperlukan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Ajukan -->
    <div
      v-if="showAjukanModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAjukanModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
          >
            <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
          </div>
          <h3 class="text-xl font-bold text-slate-900">Ajukan RAB & TOR</h3>
        </div>
        <p class="text-slate-600 mb-6">
          Apakah Anda yakin ingin mengajukan RAB & TOR ini? Setelah diajukan,
          dokumen tidak dapat diubah hingga ada permintaan revisi.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="showAjukanModal = false"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            @click="submitRab"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {{ isSubmitting ? "Mengajukan..." : "Ya, Ajukan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Edit -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showEditModal = false"
    >
      <div
        class="bg-white rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-full bg-[#3b5988] text-white flex items-center justify-center"
          >
            <Icon name="heroicons:pencil-square" class="w-5 h-5" />
          </div>
          <h3 class="text-xl font-bold text-slate-900">Edit Pengajuan</h3>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5"
              >Judul Kegiatan</label
            >
            <input
              type="text"
              v-model="editJudul"
              class="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988]"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                >Tanggal Mulai</label
              >
              <input
                type="date"
                v-model="editTanggalMulai"
                class="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988]"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5"
                >Tanggal Selesai</label
              >
              <input
                type="date"
                v-model="editTanggalSelesai"
                class="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988]"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5"
              >Total Anggaran</label
            >
            <div class="relative">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium"
                >Rp</span
              >
              <input
                type="text"
                :value="formatCurrency(anggaranBaru)"
                @input="
                  (e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    anggaranBaru = raw ? Number(raw) : 0;
                  }
                "
                placeholder="0"
                class="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5988]/30 focus:border-[#3b5988]"
              />
            </div>
          </div>

          <hr class="border-slate-100 my-2" />

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5"
              >Upload File RAB Baru
              <span class="text-xs font-normal text-slate-400"
                >(Opsional)</span
              ></label
            >
            <input
              type="file"
              @change="(e) => handleEditFile(e, 'rab')"
              accept=".pdf"
              class="w-full border border-slate-200 rounded-xl p-2 text-sm"
            />
            <p class="text-xs text-slate-400 mt-1">
              Biarkan kosong jika tidak ingin mengubah file RAB (PDF, maks 10MB)
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5"
              >Upload File TOR Baru
              <span class="text-xs font-normal text-slate-400"
                >(Opsional)</span
              ></label
            >
            <input
              type="file"
              @change="(e) => handleEditFile(e, 'tor')"
              accept=".pdf"
              class="w-full border border-slate-200 rounded-xl p-2 text-sm"
            />
            <p class="text-xs text-slate-400 mt-1">
              Biarkan kosong jika tidak ingin mengubah file TOR (PDF, maks 10MB)
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            @click="closeEditModal"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            @click="saveEdit"
            :disabled="isEditing"
            class="px-4 py-2 rounded-xl bg-[#3b5988] text-white hover:bg-[#2d4570] disabled:opacity-50 transition"
          >
            {{ isEditing ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Hapus -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"
          >
            <Icon name="heroicons:trash" class="w-5 h-5" />
          </div>
          <h3 class="text-xl font-bold text-slate-900">Hapus Draft</h3>
        </div>
        <p class="text-slate-600 mb-6">
          Apakah Anda yakin ingin menghapus draft RAB ini? Tindakan ini tidak
          dapat dibatalkan.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            @click="deleteDraft"
            class="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from "vue";
  import { useRabStore } from "~/stores/ormawa/DetailRab";
  import { useAuthStore } from "~/stores/auth";
  import { useApproveLog } from "~/stores/ormawa/approveLogRab";
  import { storeToRefs } from "pinia";

  const route = useRoute();
  const rabStore = useRabStore();
  const authStore = useAuthStore();
  const approveLogStore = useApproveLog();

  // State dari store RAB
  const rabData = computed(() => rabStore.detail);
  const loading = computed(() => rabStore.loading);
  const error = computed(() => rabStore.error);

  // Multi-document State
  const activeDocumentTab = ref("rab");
  const fileRabObjectUrl = computed(() => rabStore.fileRabObjectUrl);
  const fileTorObjectUrl = computed(() => rabStore.fileTorObjectUrl);
  const currentFileObjectUrl = computed(() =>
    activeDocumentTab.value === "rab"
      ? fileRabObjectUrl.value
      : fileTorObjectUrl.value,
  );

  // State dari store Approval Log
  const {
    logs: approvalLogs,
    loading: loadingLogs,
    hasMore: hasMoreLogs,
    total: totalLogs,
  } = storeToRefs(approveLogStore);

  const loadMoreLogs = async () => {
    const id = route.params.id;
    await approveLogStore.fetchApprovalLogs(id, true);
  };

  // UI state lokal
  const showAjukanModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteModal = ref(false);
  const isSubmitting = ref(false);
  const isEditing = ref(false);

  // Edit Form State
  const editFileRab = ref(null);
  const editFileTor = ref(null);
  const editJudul = ref("");
  const editTanggalMulai = ref("");
  const editTanggalSelesai = ref("");
  const anggaranBaru = ref(0);

  const ormawaData = computed(() => authStore.user);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Helper functions
  const formatForInputDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().split("T")[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("id-ID").format(parseFloat(value));
  };

  const formatStatus = (status) => {
    const map = {
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
      selesai_spi: "Selesai (SPI)",
      selesai: "Selesai",
    };
    return map[status] || status || "-";
  };

  const statusClass = (status) => {
    const map = {
      draft: "bg-slate-100 text-slate-600",
      waiting_kaprodi: "bg-amber-100 text-amber-700",
      revisi_kaprodi: "bg-orange-100 text-orange-700",
      waiting_ppk: "bg-blue-100 text-blue-700",
      revisi_ppk: "bg-orange-100 text-orange-700",
      waiting_spi: "bg-blue-100 text-blue-700",
      ditolak_spi: "bg-red-100 text-red-700",
      revisi_spi: "bg-orange-100 text-orange-700",
      disetujui: "bg-emerald-100 text-emerald-700",
      lunas_ppk: "bg-emerald-100 text-emerald-700",
      selesai_spi: "bg-emerald-100 text-emerald-700",
      selesai: "bg-emerald-100 text-emerald-700",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  // File info untuk deteksi tipe
  const fileInfo = computed(() => {
    const activeBlob =
      activeDocumentTab.value === "rab"
        ? rabStore.fileRabBlob
        : rabStore.fileTorBlob;
    const activeUrl =
      activeDocumentTab.value === "rab"
        ? rabData.value?.fileRabUrl
        : rabData.value?.fileTorUrl;

    if (activeBlob) {
      let name = `dokumen_${activeDocumentTab.value}`;
      if (activeUrl) {
        const urlParts = activeUrl.split("/");
        name = urlParts.pop() || name;
      }
      return {
        name,
        size: activeBlob.size,
        type: activeBlob.type || "application/pdf",
      };
    }
    return { name: null, size: null, type: null };
  });

  const isPdf = computed(() => {
    const type = fileInfo.value.type;
    const url =
      activeDocumentTab.value === "rab"
        ? rabData.value?.fileRabUrl
        : rabData.value?.fileTorUrl;
    return (
      type === "application/pdf" || (url || "").toLowerCase().endsWith(".pdf")
    );
  });

  // Timeline steps
  const timelineSteps = computed(() => {
    const status = rabData.value?.status || "draft";
    const statusToStepMap = {
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
      selesai: 4,
    };
    const currentStepIndex = statusToStepMap[status] ?? 0;
    const isRevisi = status.includes("revisi") || status === "ditolak_spi";

    const steps = [
      {
        title: "Pengajuan Draft",
        description: "RAB & TOR dibuat dan disimpan sebagai draft",
        date: formatDate(rabData.value?.createdAt),
      },
      {
        title: "Review Kaprodi",
        description: "Verifikasi oleh Ketua Program Studi",
      },
      {
        title: "Review PPK",
        description: "Verifikasi anggaran oleh Pejabat Pembuat Komitmen",
      },
      {
        title: "Review SPI",
        description: "Audit oleh Satuan Pengawasan Internal",
      },
      {
        title: "Pencairan Dana",
        description: "Anggaran disetujui dan siap dicairkan",
      },
    ];

    return steps.map((step, index) => {
      const isActuallyCompleted =
        index < currentStepIndex ||
        (index === 4 &&
          ["disetujui", "lunas_ppk", "selesai_spi", "selesai"].includes(
            status,
          ));
      return {
        ...step,
        isActive: index === currentStepIndex,
        isCompleted: isActuallyCompleted,
        isError: index === currentStepIndex && isRevisi,
      };
    });
  });

  const stepCircleClass = (step) => {
    if (step.isCompleted) return "bg-emerald-500 ring-4 ring-emerald-100";
    if (step.isError) return "bg-amber-500 ring-4 ring-amber-100";
    if (step.isActive) return "bg-[#3b5988] ring-4 ring-[#3b5988]/20";
    return "bg-white border-2 border-slate-300";
  };

  const stepTextClass = (step) => {
    if (step.isActive) return "text-[#3b5988]";
    if (step.isCompleted) return "text-slate-900";
    if (step.isError) return "text-amber-600";
    return "text-slate-500";
  };

  const progressPercentage = computed(() => {
    const status = rabData.value?.status || "draft";
    const stepIndex = {
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
      selesai: 4,
    };
    const currentStep = stepIndex[status] || 0;
    return (currentStep / 4) * 100;
  });

  const getCurrentStepLabel = () => {
    const status = rabData.value?.status || "draft";
    const stepMap = {
      draft: "Draft Awal",
      waiting_kaprodi: "Menunggu Review Kaprodi",
      revisi_kaprodi: "Revisi diperlukan",
      waiting_ppk: "Menunggu Review PPK",
      revisi_ppk: "Revisi diperlukan",
      waiting_spi: "Menunggu Review SPI",
      ditolak_spi: "Ditolak SPI",
      revisi_spi: "Revisi diperlukan",
      disetujui: "Disetujui",
      lunas_ppk: "Dana Cair",
      selesai_spi: "Selesai Audit",
      selesai: "Selesai",
    };
    return stepMap[status] || status;
  };

  const getCurrentStatusDescription = () => {
    const status = rabData.value?.status || "draft";
    const descMap = {
      draft: "Draft sedang disiapkan, dokumen belum diajukan",
      waiting_kaprodi: "Menunggu persetujuan dari Ketua Program Studi",
      revisi_kaprodi: "Dokumen perlu diperbaiki sesuai catatan Kaprodi",
      waiting_ppk: "Menunggu verifikasi anggaran dari Pejabat Pembuat Komitmen",
      revisi_ppk: "Anggaran perlu disesuaikan dengan catatan PPK",
      waiting_spi: "Sedang dalam proses audit oleh Satuan Pengawasan Internal",
      revisi_spi: "Dokumen perlu diperbaiki sesuai temuan SPI",
      ditolak_spi: "Dokumen ditolak oleh SPI, periksa catatan untuk detailnya",
      disetujui: "Semua dokumen telah disetujui, menunggu pencairan",
      lunas_ppk: "Dana anggaran telah berhasil dicairkan",
      selesai_spi: "Seluruh rangkaian audit SPI telah selesai",
      selesai: "Proses pengajuan selesai",
    };
    return descMap[status] || "Proses pengajuan berjalan";
  };

  // Log helpers
  const logIcon = (action) => {
    const map = {
      setuju: "heroicons:check-circle",
      revisi: "heroicons:arrow-path",
      tolak: "heroicons:x-circle",
      submit: "heroicons:arrow-up-tray",
    };
    return map[action] || "heroicons:ellipsis-horizontal-circle";
  };

  const logIconClass = (action) => {
    const map = {
      setuju: "bg-emerald-100 text-emerald-600",
      revisi: "bg-amber-100 text-amber-600",
      tolak: "bg-red-100 text-red-600",
    };
    return map[action] || "bg-slate-100 text-slate-500";
  };

  const logLabel = (log) => {
    const action = log.approvalLog.action;
    const role = log.actor?.role?.toUpperCase() || "";
    if (action === "setuju")
      return `Disetujui oleh ${role} — diteruskan ke tahap berikutnya`;
    if (action === "revisi") return `Diminta revisi oleh ${role}`;
    if (action === "tolak") return `Ditolak oleh ${role}`;
    return action || "-";
  };

  const goBack = () => navigateTo("/dashboard");

  const reloadData = async () => {
    const id = route.params.id;
    await rabStore.fetchFullRabData(id);
    await approveLogStore.fetchApprovalLogs(id);
  };

  const openDocument = () => {
    if (currentFileObjectUrl.value) {
      window.open(currentFileObjectUrl.value, "_blank");
    }
  };

  const downloadDocument = () => {
    if (currentFileObjectUrl.value) {
      const link = document.createElement("a");
      link.href = currentFileObjectUrl.value;
      link.download =
        fileInfo.value.name || `dokumen_${activeDocumentTab.value}.pdf`;
      link.click();
    }
  };

  const submitRab = async () => {
    isSubmitting.value = true;
    try {
      await $fetch("/api/ormawa/Rab/PengajuanDraftRab", {
        method: "POST",
        body: { rabId: rabData.value.id },
      });
      await reloadData();
      showAjukanModal.value = false;
    } catch (err) {
      console.error(err);
      alert("Gagal mengajukan dokumen");
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleEditFile = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "rab") editFileRab.value = file;
      if (type === "tor") editFileTor.value = file;
    }
  };

  const openEditModal = () => {
    if (rabData.value) {
      editJudul.value = rabData.value.judulKegiatan;
      anggaranBaru.value = rabData.value.totalAnggaran;
      editTanggalMulai.value = formatForInputDate(rabData.value.tanggalMulai);
      editTanggalSelesai.value = formatForInputDate(
        rabData.value.tanggalSelesai,
      );
    }
    showEditModal.value = true;
  };

  const closeEditModal = () => {
    showEditModal.value = false;
    editFileRab.value = null;
    editFileTor.value = null;
  };

  const saveEdit = async () => {
    isEditing.value = true;
    try {
      const formData = new FormData();
      formData.append("rabId", rabData.value.id);
      formData.append("anggaranBaru", anggaranBaru.value);
      formData.append(
        "editJudul",
        editJudul.value || rabData.value.judulKegiatan,
      );
      formData.append("tanggalMulai", editTanggalMulai.value);
      formData.append("tanggalSelesai", editTanggalSelesai.value);

      if (editFileRab.value) formData.append("fileRab", editFileRab.value);
      if (editFileTor.value) formData.append("fileTor", editFileTor.value);

      await $fetch("/api/ormawa/Rab/updateRab", {
        method: "patch",
        body: formData,
      });

      await reloadData();
      closeEditModal();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan");
    } finally {
      isEditing.value = false;
    }
  };

  const deleteDraft = async () => {
    try {
      await $fetch(`/api/ormawa/Rab/hapusDraft`, {
        method: "DELETE",
        body: { rabId: rabData.value.id },
      });
      navigateTo("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus draft");
    }
  };

  onMounted(async () => {
    const id = route.params.id;
    if (id) {
      await reloadData();
    }
  });

  onBeforeUnmount(() => {
    rabStore.cleanupFileUrls();
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

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
