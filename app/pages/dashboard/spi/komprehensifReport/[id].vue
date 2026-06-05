<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/spi/komprehensifReport"
            class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
          </NuxtLink>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{
            reportStore.detail?.rab?.nomorPengajuan
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
      v-if="reportStore.loading && !reportStore.detail"
      class="flex items-center justify-center py-32"
    >
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-sm">Memuat detail laporan...</p>
      </div>
    </div>

    <!-- Content -->
    <main
      v-else-if="reportStore.detail"
      class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- LEFT COLUMN: Main Info & PDF Viewer -->
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
                {{ reportStore.detail.rab?.judulKegiatan }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ reportStore.detail.rab?.ormawa?.nama }} ·
                {{ reportStore.detail.rab?.ormawa?.kode }}
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex text-xs font-semibold px-3 py-1 rounded-full"
                :class="statusClass(reportStore.detail.rab?.status)"
              >
                {{ formatStatus(reportStore.detail.rab?.status) }}
              </span>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Diajukan Oleh
              </p>
              <p class="font-medium text-slate-800">
                {{ reportStore.detail.rab?.pengaju?.nama || "-" }}
              </p>
              <p class="text-xs text-slate-500">
                {{ reportStore.detail.rab?.pengaju?.email || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Organisasi
              </p>
              <p class="font-medium text-slate-800">
                {{ reportStore.detail.rab?.ormawa?.nama || "-" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Tanggal Kegiatan
              </p>
              <p class="font-medium text-slate-800">
                {{ formatDate(reportStore.detail.rab?.tanggalMulai) }}
                <span
                  v-if="
                    reportStore.detail.rab?.tanggalSelesai &&
                    reportStore.detail.rab?.tanggalSelesai !==
                      reportStore.detail.rab?.tanggalMulai
                  "
                >
                  — {{ formatDate(reportStore.detail.rab?.tanggalSelesai) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Total Anggaran
              </p>
              <p class="font-bold text-[#3b5988] text-lg">
                {{ formatRupiah(reportStore.detail.rab?.totalAnggaran) }}
              </p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-semibold uppercase text-slate-400 mb-1">
                Status Realisasi
              </p>
              <p class="text-slate-700 text-sm leading-relaxed">
                {{
                  reportStore.detail.kegiatan?.statusKegiatan ||
                  "TAHAP PERENCANAAN"
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Document Viewer Section -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div class="p-4 sm:p-6 border-b border-slate-100">
            <h3
              class="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"
            >
              <Icon
                name="heroicons:document-duplicate"
                class="w-5 h-5 text-[#d1a82a]"
              />
              Arsip Dokumen Utama
            </h3>

            <div class="flex gap-2 p-1 bg-slate-100 rounded-xl inline-flex">
              <button
                v-for="tab in ['rab', 'tor', 'lpg']"
                :key="tab"
                @click="activeDocTab = tab as any"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 capitalize',
                  activeDocTab === tab
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                <Icon
                  :name="
                    tab === 'rab'
                      ? 'heroicons:calculator'
                      : tab === 'tor'
                        ? 'heroicons:document-duplicate'
                        : 'heroicons:clipboard-document-list'
                  "
                  class="w-4 h-4"
                />
                {{ tab.toUpperCase() }}
              </button>
            </div>
          </div>

          <div class="p-6">
            <div
              v-if="docLoading"
              class="flex items-center justify-center py-32"
            >
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <div
                  class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                ></div>
                <p class="text-sm">Memuat dokumen...</p>
              </div>
            </div>

            <div
              v-else-if="!currentDocUrl"
              class="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center"
            >
              <div
                class="w-20 h-20 rounded-2xl bg-[#3b5988]/10 flex items-center justify-center mb-4"
              >
                <Icon
                  name="heroicons:document-minus"
                  class="w-10 h-10 text-[#3b5988]"
                />
              </div>
              <h4 class="text-lg font-semibold text-slate-900 mb-2">
                Dokumen Tidak Tersedia
              </h4>
              <p class="text-sm text-slate-500 mb-4 max-w-sm">
                Belum ada file yang diunggah untuk kategori ini pada kegiatan
                ini.
              </p>
            </div>

            <div v-else class="w-full">
              <iframe
                :src="currentDocUrl"
                class="w-full h-[600px] rounded-xl border border-slate-200"
                frameborder="0"
              ></iframe>
              <div class="flex justify-center gap-3 mt-4">
                <button
                  @click="openFullPreview"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition-all"
                >
                  <Icon name="heroicons:arrows-pointing-out" class="w-5 h-5" />
                  Buka di Tab Baru
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Catatan Akhir SPI (LPG) -->
        <div
          v-if="reportStore.detail.lpg"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon
              name="heroicons:chat-bubble-left-right"
              class="w-5 h-5 text-[#d1a82a]"
            />
            <h3 class="font-bold text-slate-800">Catatan Akhir SPI</h3>
          </div>
          <div class="p-6">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p class="text-sm text-amber-800 leading-relaxed">
                "{{
                  reportStore.detail.lpg.spiNotes || "Disetujui tanpa catatan."
                }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Documentation Section -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-6 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:camera" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">
              Dokumentasi & Bukti Transaksi
            </h3>
            <span
              class="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold"
            >
              {{ reportStore.detail.documentationList?.length || 0 }} berkas
            </span>
          </div>

          <div class="p-6">
            <div
              v-if="reportStore.detail.documentationList?.length === 0"
              class="text-center py-12 text-slate-400"
            >
              <Icon
                name="heroicons:photo"
                class="w-12 h-12 mx-auto mb-3 text-slate-300"
              />
              <p class="text-sm">Tidak ada dokumentasi tambahan.</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="doc in reportStore.detail.documentationList"
                :key="doc.realId"
                class="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
              >
                <div class="flex-1">
                  <p class="font-medium text-slate-800 text-sm">
                    {{ doc.deskripsi || doc.namaPenerima }}
                  </p>
                  <div class="flex flex-wrap items-center gap-3 mt-1.5">
                    <span
                      class="inline-flex text-xs px-2 py-0.5 rounded-full"
                      :class="getTipeDocumenBadgeClass(doc.tipeDokumen)"
                    >
                      {{ doc.tipeDokumen }}
                    </span>
                    <span
                      class="inline-flex text-xs px-2 py-0.5 rounded-full"
                      :class="getDocStatusBadgeClass(doc.status, doc.tipeData)"
                    >
                      {{ doc.status }}
                    </span>
                    <span v-if="doc.tokoNama" class="text-xs text-slate-500">{{
                      doc.tokoNama
                    }}</span>
                    <span
                      v-if="doc.nominal"
                      class="text-xs font-semibold text-[#3b5988]"
                      >{{ formatRupiah(doc.nominal) }}</span
                    >
                  </div>
                  <p class="text-xs text-slate-400 mt-2">
                    {{ formatDate(doc.createdAt) }}
                  </p>
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button
                    @click="viewDocumentation(doc)"
                    class="p-2 rounded-lg bg-[#3b5988]/10 text-[#3b5988] hover:bg-[#3b5988] hover:text-white transition-all"
                    title="Lihat Berkas & Detail"
                  >
                    <Icon name="heroicons:eye" class="w-4 h-4" />
                  </button>
                  <button
                    v-if="
                      doc.tipeData === 'TAGIHAN' && hasPaymentProof(doc.realId)
                    "
                    @click="viewPaymentProof(doc.realId)"
                    class="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                    title="Lihat Bukti Bayar PPK"
                  >
                    <Icon name="heroicons:credit-card" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Metadata & Logs -->
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
                {{ formatRupiah(reportStore.detail.rab?.totalAnggaran) }}
              </p>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Pengaju</span>
                <span
                  class="font-medium text-slate-800 text-right max-w-[60%]"
                  >{{ reportStore.detail.rab?.pengaju?.nama || "-" }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal Upload</span>
                <span class="font-medium text-slate-800">{{
                  formatDate(reportStore.detail.rab?.createdAt)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Masa Kegiatan</span>
                <span class="font-medium text-slate-800 text-right">
                  {{ formatDate(reportStore.detail.rab?.tanggalMulai) }}
                  <span v-if="reportStore.detail.rab?.tanggalSelesai"
                    ><br />—
                    {{
                      formatDate(reportStore.detail.rab?.tanggalSelesai)
                    }}</span
                  >
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Status Realisasi</span>
                <span class="font-medium text-slate-800">{{
                  reportStore.detail.kegiatan?.statusKegiatan ||
                  "TAHAP PERENCANAAN"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Riwayat Persetujuan dengan Tab -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-5 py-4 border-b border-slate-100"
          >
            <Icon name="heroicons:clock" class="w-5 h-5 text-[#d1a82a]" />
            <h3 class="font-bold text-slate-800">Riwayat Persetujuan</h3>
          </div>

          <div class="p-5">
            <div class="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                @click="activeLogTab = 'rab'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeLogTab === 'rab'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                Log RAB
              </button>
              <button
                @click="activeLogTab = 'lpg'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeLogTab === 'lpg'
                    ? 'bg-white text-[#3b5988] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                ]"
              >
                Log LPG
              </button>
            </div>

            <div
              class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
            >
              <template v-if="activeLogTab === 'rab'">
                <!-- Upload pertama -->
                <div class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div
                      class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                    </div>
                    <div
                      v-if="reportStore.detail.rabLogs?.length"
                      class="w-0.5 flex-1 bg-slate-200 mt-2"
                    ></div>
                  </div>
                  <div class="pb-4">
                    <p class="text-sm font-semibold text-slate-800">
                      Pengajuan diunggah
                    </p>
                    <p class="text-xs text-slate-500 mt-0.5">
                      oleh {{ reportStore.detail.rab?.pengaju?.nama }} ·
                      {{ formatDateTime(reportStore.detail.rab?.createdAt) }}
                    </p>
                  </div>
                </div>

                <!-- Riwayat approval RAB -->
                <div
                  v-for="(log, i) in reportStore.detail.rabLogs"
                  :key="'rab-' + log.id"
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
                      v-if="i < reportStore.detail.rabLogs.length - 1"
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
                      oleh {{ log.actor?.fullName || log.actor?.nama }} ({{
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

                <div
                  v-if="!reportStore.detail.rabLogs?.length"
                  class="text-center py-8 text-slate-400"
                >
                  <p class="text-sm">Tidak ada riwayat persetujuan RAB</p>
                </div>
              </template>

              <template v-else>
                <!-- Riwayat approval LPG -->
                <div
                  v-for="(log, i) in reportStore.detail.lpgLogs"
                  :key="'lpg-' + log.id"
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      :class="logIconClass(log.action || 'revisi')"
                    >
                      <Icon
                        :name="logIcon(log.action || 'revisi')"
                        class="w-4 h-4"
                      />
                    </div>
                    <div
                      v-if="i < reportStore.detail.lpgLogs.length - 1"
                      class="w-0.5 flex-1 bg-slate-200 mt-2"
                    ></div>
                  </div>
                  <div class="pb-4 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-sm font-semibold text-slate-800">
                        Revisi oleh SPI
                      </p>
                      <span class="text-xs text-slate-400 whitespace-nowrap">{{
                        formatDateTime(log.createdAt)
                      }}</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">
                      oleh {{ log.actor?.fullName || log.actor?.nama }} ({{
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

                <div
                  v-if="!reportStore.detail.lpgLogs?.length"
                  class="text-center py-8 text-slate-400"
                >
                  <p class="text-sm">Tidak ada riwayat revisi LPG</p>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Dokumentasi -->
    <div
      v-if="showDocModal"
      class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeDocModal"
    >
      <div
        class="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Modal Header -->
        <div
          class="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-[#3b5988]/10 text-[#3b5988] flex items-center justify-center"
            >
              <Icon
                :name="
                  selectedDoc?.tipeData === 'TAGIHAN'
                    ? 'heroicons:banknotes'
                    : 'heroicons:photo'
                "
                class="w-5 h-5"
              />
            </div>
            <div>
              <h3 class="font-bold text-slate-800">
                {{ selectedDoc?.deskripsi || selectedDoc?.namaPenerima }}
              </h3>
              <p class="text-xs text-slate-500">
                Berkas Pelaksanaan · {{ formatDate(selectedDoc?.createdAt) }}
              </p>
            </div>
          </div>
          <button
            @click="closeDocModal"
            class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Info Sidebar -->
            <div class="lg:col-span-1 space-y-4">
              <div class="bg-slate-50 rounded-xl p-4 space-y-4">
                <h4
                  class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Informasi Rinci
                </h4>

                <div
                  v-if="selectedDoc?.tipeData === 'TAGIHAN'"
                  class="space-y-3"
                >
                  <div v-if="selectedDoc.tokoNama">
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase"
                    >
                      Nama Toko / Vendor
                    </p>
                    <p class="text-sm font-medium text-slate-800">
                      {{ selectedDoc.tokoNama }}
                    </p>
                  </div>
                  <div v-if="selectedDoc.namaPenerima">
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase"
                    >
                      Nama Penerima
                    </p>
                    <p class="text-sm font-medium text-slate-800">
                      {{ selectedDoc.namaPenerima }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase"
                    >
                      Nominal Transaksi
                    </p>
                    <p class="text-lg font-bold text-[#3b5988]">
                      {{ formatRupiah(selectedDoc.nominal) }}
                    </p>
                  </div>
                  <div class="pt-2 border-t border-slate-200">
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase mb-1"
                    >
                      Rekening Tujuan
                    </p>
                    <div
                      class="bg-white rounded-lg p-2 border border-slate-200"
                    >
                      <p class="text-xs font-medium text-slate-800">
                        {{ selectedDoc.bankPenerima || "-" }}
                      </p>
                      <p class="text-xs font-mono text-slate-500">
                        {{ selectedDoc.rekeningPenerima || "-" }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-else>
                  <div>
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase"
                    >
                      Deskripsi
                    </p>
                    <p class="text-sm text-slate-700">
                      {{ selectedDoc?.deskripsi || "-" }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-semibold text-slate-400 uppercase"
                    >
                      Kategori
                    </p>
                    <span
                      class="inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                      :class="
                        getTipeDocumenBadgeClass(selectedDoc?.tipeDokumen)
                      "
                    >
                      {{ selectedDoc?.tipeDokumen }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Catatan Review -->
              <div class="bg-slate-50 rounded-xl p-4">
                <h4
                  class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"
                >
                  <Icon
                    name="heroicons:chat-bubble-left-right"
                    class="w-4 h-4"
                  />
                  Catatan & Review
                </h4>

                <div v-if="fetchingLogs" class="flex justify-center py-6">
                  <div
                    class="w-5 h-5 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                  ></div>
                </div>

                <div v-else-if="docLogs.length === 0" class="text-center py-6">
                  <p class="text-xs text-slate-400 italic">
                    Belum ada catatan review
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="log in docLogs"
                    :key="log.id"
                    class="bg-white rounded-lg p-3 border border-slate-100"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span
                        class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        :class="getActionColor(log.action)"
                      >
                        {{ log.action }}
                      </span>
                      <span class="text-[9px] text-slate-400">{{
                        formatDateTime(log.createdAt)
                      }}</span>
                    </div>
                    <p class="text-xs font-medium text-slate-800">
                      {{ log.user?.fullname }}
                    </p>
                    <p class="text-[11px] text-slate-500 mt-1 italic">
                      "{{ log.komentar }}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- File Previews -->
            <div class="lg:col-span-2">
              <h4
                class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"
              >
                <Icon
                  name="heroicons:paper-clip"
                  class="w-4 h-4 text-[#d1a82a]"
                />
                Lampiran Berkas ({{ attachedFiles.length }})
              </h4>

              <div
                v-if="fetchingFiles"
                class="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl"
              >
                <div
                  class="w-8 h-8 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                ></div>
                <p class="text-xs text-slate-400 mt-2">Memuat berkas...</p>
              </div>

              <div
                v-else-if="attachedFiles.length === 0"
                class="text-center py-20 bg-slate-50 rounded-xl"
              >
                <Icon
                  name="heroicons:document-minus"
                  class="w-12 h-12 text-slate-300 mx-auto mb-2"
                />
                <p class="text-sm text-slate-400">Tidak ada lampiran berkas</p>
              </div>

              <div v-else class="grid grid-cols-2 gap-4">
                <div
                  v-for="file in attachedFiles"
                  :key="file.url"
                  class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                  @click="openExternal(file.url)"
                >
                  <div
                    class="aspect-video bg-slate-100 relative flex items-center justify-center"
                  >
                    <img
                      v-if="isImage(file.type)"
                      :src="file.url"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="flex flex-col items-center gap-2">
                      <div
                        class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center"
                      >
                        <Icon
                          name="heroicons:document-text"
                          class="w-6 h-6 text-[#3b5988]"
                        />
                      </div>
                      <span class="text-[10px] font-medium text-slate-400">{{
                        file.type?.split("/")[1]?.toUpperCase() || "FILE"
                      }}</span>
                    </div>
                  </div>
                  <div class="p-3 border-t border-slate-100">
                    <p class="text-xs font-medium text-slate-700 truncate">
                      {{ file.label }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 border-t border-slate-100 bg-white flex justify-end">
          <button
            @click="closeDocModal"
            class="px-6 py-2.5 bg-[#3b5988] text-white rounded-xl font-medium hover:bg-[#2d4570] transition-all"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSpiKomprehensifReportStore } from "~/stores/spi/komprehensifReport";
  import { ref, onMounted, watch } from "vue";

  const route = useRoute();
  const reportStore = useSpiKomprehensifReportStore();
  const rabId = Number(route.params.id);

  // UI Tabs State
  const activeDocTab = ref<"rab" | "tor" | "lpg">("rab");
  const activeLogTab = ref<"rab" | "lpg">("rab");

  // Document Viewer State
  const currentDocUrl = ref<string | null>(null);
  const docLoading = ref(false);

  // Documentation Modal State
  const showDocModal = ref(false);
  const selectedDoc = ref<any>(null);
  const attachedFiles = ref<any[]>([]);
  const docLogs = ref<any[]>([]);
  const fetchingFiles = ref(false);
  const fetchingLogs = ref(false);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  onMounted(async () => {
    await reportStore.fetchReportDetail(rabId);
    updateDocViewer();
  });

  watch(activeDocTab, () => {
    updateDocViewer();
  });

  const updateDocViewer = async () => {
    if (!reportStore.detail) return;

    docLoading.value = true;
    currentDocUrl.value = null;

    try {
      let type: string = activeDocTab.value;
      let endpoint = "/api/spi/rab/file";
      let body: any = { rabId: Number(rabId), documentType: type };

      if (type === "lpg") {
        if (!reportStore.detail.lpg) {
          docLoading.value = false;
          return;
        }
        const res: any = await $fetch("/api/spi/lpg/getFile", {
          method: "POST",
          body: { lpgId: reportStore.detail.lpg.id },
        });
        if (res.success && res.data.length > 0) {
          currentDocUrl.value = res.data[0].url;
        }
      } else {
        const blobRes = await $fetch(endpoint, {
          method: "POST",
          body: body,
          responseType: "blob",
        });
        if (blobRes) {
          currentDocUrl.value = URL.createObjectURL(blobRes as Blob);
        }
      }
    } catch (e) {
      console.error("Error loading document:", e);
    } finally {
      docLoading.value = false;
    }
  };

  const openFullPreview = () => {
    if (currentDocUrl.value) {
      window.open(currentDocUrl.value, "_blank");
    }
  };

  const viewDocumentation = async (doc: any) => {
    selectedDoc.value = doc;
    showDocModal.value = true;
    fetchingFiles.value = true;
    fetchingLogs.value = true;
    attachedFiles.value = [];
    docLogs.value = [];

    try {
      const docId =
        doc.tipeData === "TAGIHAN"
          ? `tagihan_${doc.realId}`
          : `doc_${doc.realId}`;

      const [fileRes, logRes]: any = await Promise.all([
        $fetch("/api/ormawa/dokumentasi/getFiles", {
          method: "POST",
          body: { id: docId },
        }),
        $fetch("/api/ormawa/dokumentasi/getLogs", {
          method: "POST",
          body: { id: docId, limit: 10 },
        }),
      ]);

      if (fileRes.success) attachedFiles.value = fileRes.data;
      if (logRes.success) docLogs.value = logRes.data;
    } catch (e) {
      console.error("Error fetching doc details:", e);
    } finally {
      fetchingFiles.value = false;
      fetchingLogs.value = false;
    }
  };

  const closeDocModal = () => {
    showDocModal.value = false;
    selectedDoc.value = null;
    attachedFiles.value = [];
    docLogs.value = [];
  };

  const hasPaymentProof = (tagihanId: number) => {
    return reportStore.detail?.paymentProofs?.some(
      (p: any) => p.tagihanId === tagihanId,
    );
  };

  const viewPaymentProof = async (tagihanId: number) => {
    const payment = reportStore.detail?.paymentProofs?.find(
      (p: any) => p.tagihanId === tagihanId,
    );
    if (payment) {
      try {
        const res: any = await $fetch("/api/ormawa/dokumentasi/fileView", {
          method: "POST",
          body: { id: `pembayaran_${payment.id}` },
          responseType: "blob",
        });
        const url = URL.createObjectURL(res as Blob);
        window.open(url, "_blank");
      } catch (e) {
        alert("Gagal memuat bukti pembayaran.");
      }
    }
  };

  // Helper Functions
  const formatDate = (dateStr: string | null, withTime = false) => {
    if (!dateStr) return "-";
    const opt: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    if (withTime) {
      opt.hour = "2-digit";
      opt.minute = "2-digit";
    }
    return new Date(dateStr).toLocaleDateString("id-ID", opt);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRupiah = (amount: string | number) => {
    if (!amount) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(Number(amount));
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = {
      disetujui: "Disetujui",
      lunas_ppk: "Dana Cair",
      selesai_spi: "Selesai",
      waiting_kaprodi: "Menunggu Kaprodi",
      waiting_ppk: "Menunggu PPK",
      waiting_spi: "Menunggu SPI",
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
    };
    return map[status || ""] || "bg-slate-100 text-slate-600";
  };

  const getTipeDocumenBadgeClass = (tipe?: string) => {
    if (!tipe) return "bg-slate-100 text-slate-600";
    const t = tipe.toUpperCase();
    if (t === "BARANG") return "bg-blue-100 text-blue-700";
    if (t === "JASA") return "bg-purple-100 text-purple-700";
    return "bg-amber-100 text-amber-700";
  };

  const getDocStatusBadgeClass = (status?: string, type?: string) => {
    if (type === "TAGIHAN") {
      if (status === "SELESAI") return "bg-emerald-100 text-emerald-700";
      return "bg-amber-100 text-amber-700";
    }
    if (status === "DITERIMA") return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-500";
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

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "approve":
        return "bg-emerald-100 text-emerald-700";
      case "reject":
        return "bg-red-100 text-red-700";
      case "revisi":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const isImage = (type: string) => type?.startsWith("image/");
  const openExternal = (url: string) => window.open(url, "_blank");
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

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }
</style>
