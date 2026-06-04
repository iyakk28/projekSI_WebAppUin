<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div
      v-if="reportStore.loading && !reportStore.detail"
      class="flex flex-col items-center justify-center py-32"
    >
      <div
        class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"
      ></div>
      <p class="text-slate-500 text-sm font-medium">Memuat detail laporan...</p>
    </div>

    <div v-else-if="reportStore.detail" class="max-w-[95rem] mx-auto space-y-8">
      <!-- Formal Header -->
      <div
        class="flex items-center justify-between bg-white p-6 border border-slate-200 rounded-2xl shadow-sm"
      >
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/dashboard/spi/komprehensifReport"
            class="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 leading-tight">
              Detail Komprehensif Kegiatan
            </h1>
            <p
              class="text-sm text-slate-500 font-medium mt-0.5 tracking-wide uppercase"
            >
              {{ reportStore.detail.rab.nomorPengajuan }} •
              {{ reportStore.detail.rab.judulKegiatan }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest shadow-sm"
            :class="getStatusBadgeClass(reportStore.detail.rab.status)"
          >
            {{ formatStatus(reportStore.detail.rab.status) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- LEFT COLUMN: Main Info & PDF Viewer -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Document Viewer Section -->
          <div
            class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[850px] flex flex-col transition-all"
          >
            <div
              class="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4"
            >
              <div class="flex items-center gap-3">
                <Icon
                  name="heroicons:document-duplicate"
                  class="w-6 h-6 text-blue-600"
                />
                <h3
                  class="text-sm font-bold text-slate-900 uppercase tracking-wider"
                >
                  Arsip Dokumen Utama
                </h3>
              </div>
              <div
                class="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-inner"
              >
                <button
                  v-for="tab in ['rab', 'tor', 'lpg']"
                  :key="tab"
                  @click="activeDocTab = tab as any"
                  :class="[
                    'px-6 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest',
                    activeDocTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50',
                  ]"
                >
                  {{ tab }}
                </button>
              </div>
            </div>

            <div class="flex-1 bg-slate-100 relative">
              <div
                v-if="docLoading"
                class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"
              >
                <div
                  class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                ></div>
              </div>

              <div
                v-if="!currentDocUrl && !docLoading"
                class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white"
              >
                <div
                  class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"
                >
                  <Icon
                    name="heroicons:document-minus"
                    class="w-10 h-10 text-slate-300"
                  />
                </div>
                <p class="text-slate-900 font-bold text-lg">
                  Dokumen Tidak Tersedia
                </p>
                <p class="text-slate-500 text-sm max-w-xs mt-2">
                  Belum ada file yang diunggah untuk kategori ini pada kegiatan
                  ini.
                </p>
              </div>

              <iframe
                v-else-if="currentDocUrl"
                :src="currentDocUrl"
                class="w-full h-full border-none shadow-inner"
              ></iframe>
            </div>

            <div
              v-if="currentDocUrl"
              class="p-3 border-t border-slate-100 bg-white flex justify-center"
            >
              <button
                @click="openFullPreview"
                class="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                <Icon name="heroicons:arrows-pointing-out" class="w-4 h-4" />
                Buka di Tab Baru
              </button>
            </div>
          </div>

          <!-- Documentation Section -->
          <div class="space-y-6">
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"
                >
                  <Icon
                    name="heroicons:camera"
                    class="w-6 h-6 text-emerald-600"
                  />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-900">
                    Dokumentasi & Bukti Transaksi
                  </h3>
                  <p class="text-sm text-slate-500">
                    Seluruh berkas yang diunggah selama pelaksanaan kegiatan.
                  </p>
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th
                      class="px-6 py-4 text-xs font-bold text-slate-500 uppercase"
                    >
                      Dokumen / Detail
                    </th>
                    <th
                      class="px-6 py-4 text-xs font-bold text-slate-500 uppercase"
                    >
                      Tipe
                    </th>
                    <th
                      class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center"
                    >
                      Status
                    </th>
                    <th
                      class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="doc in reportStore.detail.documentationList"
                    :key="doc.realId"
                    class="hover:bg-slate-50 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <p class="text-sm font-bold text-slate-900">
                        {{ doc.deskripsi || doc.namaPenerima }}
                      </p>
                      <p
                        v-if="doc.tokoNama"
                        class="text-[11px] text-blue-600 font-bold mt-0.5 uppercase tracking-wide"
                      >
                        {{ doc.tokoNama }} • {{ formatRupiah(doc.nominal) }}
                      </p>
                      <p
                        v-else-if="doc.nominal && doc.tipeData === 'TAGIHAN'"
                        class="text-[11px] text-purple-600 font-bold mt-0.5 uppercase tracking-wide"
                      >
                        {{ doc.namaPenerima }} • {{ formatRupiah(doc.nominal) }}
                      </p>
                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">
                        {{ formatDate(doc.createdAt) }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        :class="[
                          'px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase',
                          getTipeDocumenBadgeClass(doc.tipeDokumen),
                        ]"
                      >
                        {{ doc.tipeDokumen }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span
                        :class="[
                          'px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase',
                          getDocStatusBadgeClass(doc.status, doc.tipeData),
                        ]"
                      >
                        {{ doc.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          @click="viewDocumentation(doc)"
                          class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Lihat Berkas & Detail"
                        >
                          <Icon name="heroicons:eye" class="w-4.5 h-4.5" />
                        </button>
                        <button
                          v-if="
                            doc.tipeData === 'TAGIHAN' &&
                            hasPaymentProof(doc.realId)
                          "
                          @click="viewPaymentProof(doc.realId)"
                          class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Lihat Bukti Bayar PPK"
                        >
                          <Icon
                            name="heroicons:credit-card"
                            class="w-4.5 h-4.5"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="reportStore.detail.documentationList.length === 0">
                    <td
                      colspan="4"
                      class="px-6 py-12 text-center text-slate-400 italic text-sm"
                    >
                      Tidak ada dokumentasi tambahan.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Metadata & Logs -->
        <div class="lg:col-span-4 space-y-8">
          <!-- Activity Summary Card -->
          <div
            class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6"
          >
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div
                class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"
              >
                <Icon name="heroicons:information-circle" class="w-6 h-6" />
              </div>
              <h3
                class="font-bold text-slate-900 uppercase tracking-wider text-sm"
              >
                Informasi Pelaksanaan
              </h3>
            </div>

            <div class="grid grid-cols-1 gap-5">
              <div>
                <p
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
                >
                  Masa Kegiatan
                </p>
                <div
                  class="flex items-center gap-2 text-sm font-bold text-slate-900"
                >
                  <Icon
                    name="heroicons:calendar-days"
                    class="w-4 h-4 text-slate-400"
                  />
                  {{ formatDate(reportStore.detail.rab.tanggalMulai) }} —
                  {{ formatDate(reportStore.detail.rab.tanggalSelesai) }}
                </div>
              </div>

              <div>
                <p
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
                >
                  Total Anggaran (RAB)
                </p>
                <div class="text-xl font-extrabold text-blue-600 font-mono">
                  {{ formatRupiah(reportStore.detail.rab.totalAnggaran) }}
                </div>
              </div>

              <div>
                <p
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
                >
                  Status Realisasi
                </p>
                <div class="text-sm font-bold text-slate-900">
                  {{
                    reportStore.detail.kegiatan?.statusKegiatan ||
                    "TAHAP PERENCANAAN"
                  }}
                </div>
              </div>
            </div>

            <div
              v-if="reportStore.detail.lpg"
              class="pt-4 border-t border-slate-100 space-y-3"
            >
              <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
              >
                Catatan Akhir SPI (LPG)
              </p>
              <div
                class="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl"
              >
                <p
                  class="text-xs text-emerald-800 leading-relaxed italic font-medium"
                >
                  "{{
                    reportStore.detail.lpg.spiNotes ||
                    "Disetujui tanpa catatan."
                  }}"
                </p>
              </div>
            </div>
          </div>

          <!-- Chronological Logs with TABS -->
          <div class="space-y-4">
            <div
              class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div
                class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100"
              >
                <h3
                  class="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"
                >
                  <Icon name="heroicons:clock" class="w-4 h-4 text-slate-400" />
                  Riwayat Persetujuan
                </h3>
              </div>

              <div class="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  @click="activeLogTab = 'rab'"
                  :class="[
                    'flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all',
                    activeLogTab === 'rab'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  ]"
                >
                  Log RAB
                </button>
                <button
                  @click="activeLogTab = 'lpg'"
                  :class="[
                    'flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all',
                    activeLogTab === 'lpg'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  ]"
                >
                  Log LPG
                </button>
              </div>

              <div
                class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
              >
                <!-- Dynamic Log List -->
                <template v-if="activeLogTab === 'rab'">
                  <div
                    v-for="log in reportStore.detail.rabLogs"
                    :key="'rab-' + log.id"
                    class="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <span
                        class="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase"
                        >Aksi: {{ log.action }}</span
                      >
                      <span class="text-[9px] text-slate-400 font-medium">{{
                        formatDate(log.createdAt, true)
                      }}</span>
                    </div>
                    <p class="text-xs font-bold text-slate-900">
                      {{ log.actor.fullName }}
                      <span class="font-medium text-slate-500"
                        >({{ log.actor.role.toUpperCase() }})</span
                      >
                    </p>
                    <p class="text-xs text-slate-600 mt-2 font-medium italic">
                      "{{ log.catatanRevisi }}"
                    </p>
                  </div>
                  <div
                    v-if="reportStore.detail.rabLogs.length === 0"
                    class="text-center py-10"
                  >
                    <p class="text-slate-400 text-xs italic">
                      Tidak ada riwayat RAB.
                    </p>
                  </div>
                </template>

                <template v-else>
                  <div
                    v-for="log in reportStore.detail.lpgLogs"
                    :key="'lpg-' + log.id"
                    class="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <span
                        class="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase"
                        >Revisi SPI</span
                      >
                      <span class="text-[9px] text-slate-400 font-medium">{{
                        formatDate(log.createdAt, true)
                      }}</span>
                    </div>
                    <p class="text-xs font-bold text-slate-900">
                      {{ log.actor.fullName }}
                      <span class="font-medium text-slate-500"
                        >({{ log.actor.role.toUpperCase() }})</span
                      >
                    </p>
                    <p class="text-xs text-slate-600 mt-2 font-medium italic">
                      "{{ log.catatanRevisi }}"
                    </p>
                  </div>
                  <div
                    v-if="reportStore.detail.lpgLogs.length === 0"
                    class="text-center py-10"
                  >
                    <p class="text-slate-400 text-xs italic">
                      Tidak ada riwayat LPG.
                    </p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Documentation Detail (ENHANCED) -->
    <div
      v-if="showDocModal"
      class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      @click.self="closeDocModal"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        <!-- Modal Header -->
        <div
          class="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10"
        >
          <div class="flex items-center gap-4">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center',
                getTipeDocumenBadgeClass(selectedDoc?.tipeDokumen, true),
              ]"
            >
              <Icon
                :name="
                  selectedDoc?.tipeData === 'TAGIHAN'
                    ? 'heroicons:banknotes'
                    : 'heroicons:photo'
                "
                class="w-7 h-7"
              />
            </div>
            <div>
              <h3
                class="text-xl font-bold text-slate-900 uppercase tracking-tight"
              >
                {{ selectedDoc?.deskripsi || selectedDoc?.namaPenerima }}
              </h3>
              <p class="text-sm text-slate-500 font-medium">
                Berkas Pelaksanaan • {{ formatDate(selectedDoc?.createdAt) }}
              </p>
            </div>
          </div>
          <button
            @click="closeDocModal"
            class="p-2 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Icon
              name="heroicons:x-mark"
              class="w-6 h-6 text-slate-400 group-hover:text-slate-900"
            />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 bg-slate-50/20">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- INFO SIDEBAR -->
            <div class="lg:col-span-4 space-y-6">
              <div
                class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5"
              >
                <h4
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2"
                >
                  Informasi Rinci
                </h4>

                <div
                  v-if="selectedDoc?.tipeData === 'TAGIHAN'"
                  class="space-y-4"
                >
                  <div v-if="selectedDoc.tokoNama">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Nama Toko / Vendor
                    </p>
                    <p class="text-sm font-bold text-slate-900">
                      {{ selectedDoc.tokoNama }}
                    </p>
                  </div>
                  <div v-if="selectedDoc.tokoAlamat">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Alamat
                    </p>
                    <p class="text-xs text-slate-600 font-medium">
                      {{ selectedDoc.tokoAlamat }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Nama Penerima
                    </p>
                    <p class="text-sm font-bold text-slate-900">
                      {{ selectedDoc.namaPenerima }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Nominal Transaksi
                    </p>
                    <p class="text-lg font-extrabold text-blue-600 font-mono">
                      {{ formatRupiah(selectedDoc.nominal) }}
                    </p>
                  </div>
                  <div class="pt-3 border-t border-slate-50">
                    <p
                      class="text-[10px] font-bold text-slate-400 uppercase mb-2"
                    >
                      Rekening Tujuan
                    </p>
                    <div
                      class="p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <p class="text-xs font-bold text-slate-900">
                        {{ selectedDoc.bankPenerima }}
                      </p>
                      <p class="text-xs font-mono text-slate-600 mt-1">
                        {{ selectedDoc.rekeningPenerima }}
                      </p>
                    </div>
                  </div>
                  <div v-if="selectedDoc.skNomor">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Nomor SK / Kontrak
                    </p>
                    <p class="text-xs font-bold text-slate-900">
                      {{ selectedDoc.skNomor }}
                    </p>
                  </div>
                </div>

                <div v-else class="space-y-4">
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Deskripsi Kegiatan
                    </p>
                    <p
                      class="text-sm font-medium text-slate-800 leading-relaxed"
                    >
                      {{ selectedDoc.deskripsi }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Kategori Dokumentasi
                    </p>
                    <span
                      class="inline-block mt-1 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-bold"
                      >{{ selectedDoc.tipeDokumen }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- DOC LOGS SECTION -->
              <div
                class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <h4
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2"
                >
                  <Icon
                    name="heroicons:chat-bubble-left-right"
                    class="w-4 h-4"
                  />
                  Catatan & Review Berkas
                </h4>

                <div v-if="fetchingLogs" class="flex justify-center py-6">
                  <Icon
                    name="heroicons:arrow-path"
                    class="w-5 h-5 animate-spin text-slate-300"
                  />
                </div>

                <div v-else-if="docLogs.length === 0" class="py-6 text-center">
                  <p class="text-[11px] text-slate-400 italic">
                    Belum ada catatan review untuk berkas ini.
                  </p>
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="log in docLogs"
                    :key="log.id"
                    class="p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div class="flex justify-between items-center mb-1">
                      <span
                        class="text-[9px] font-bold uppercase"
                        :class="getActionColor(log.action)"
                        >{{ log.action }}</span
                      >
                      <span class="text-[8px] text-slate-400 font-medium">{{
                        formatDate(log.createdAt, true)
                      }}</span>
                    </div>
                    <p class="text-[10px] font-bold text-slate-900">
                      {{ log.user.fullname }}
                    </p>
                    <p
                      class="text-[10px] text-slate-600 mt-1 italic leading-snug"
                    >
                      "{{ log.komentar }}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- FILES PREVIEW -->
            <div class="lg:col-span-8 space-y-6">
              <div
                class="flex items-center justify-between border-b border-slate-100 pb-3"
              >
                <h4
                  class="text-sm font-bold text-slate-900 uppercase tracking-widest"
                >
                  Lampiran Berkas ({{ attachedFiles.length }})
                </h4>
              </div>

              <div
                v-if="fetchingFiles"
                class="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 border-dashed"
              >
                <div
                  class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"
                ></div>
                <p class="text-slate-500 text-sm font-medium">
                  Menghubungkan ke server file...
                </p>
              </div>

              <div
                v-else-if="attachedFiles.length === 0"
                class="text-center py-32 bg-white rounded-3xl border border-slate-200 border-dashed"
              >
                <Icon
                  name="heroicons:document-minus"
                  class="w-16 h-16 text-slate-100 mx-auto mb-4"
                />
                <p class="text-slate-400 font-medium">
                  Tidak ada lampiran berkas yang ditemukan.
                </p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <div
                  v-for="file in attachedFiles"
                  :key="file.url"
                  class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div
                    class="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center"
                  >
                    <img
                      v-if="isImage(file.type)"
                      :src="file.url"
                      class="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div v-else class="flex flex-col items-center gap-3">
                      <div
                        class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center"
                      >
                        <Icon
                          name="heroicons:document-text"
                          class="w-8 h-8 text-blue-500"
                        />
                      </div>
                      <span
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >{{ file.type.split("/")[1] }} Document</span
                      >
                    </div>
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                    >
                      <button
                        @click="openExternal(file.url)"
                        class="px-5 py-2.5 bg-white rounded-xl text-xs font-bold shadow-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Icon name="heroicons:eye" class="w-4 h-4" />
                        Buka Berkas
                      </button>
                    </div>
                  </div>
                  <div class="p-4 border-t border-slate-50 bg-slate-50/30">
                    <p class="text-xs font-bold text-slate-700 truncate">
                      {{ file.label }}
                    </p>
                    <p class="text-[9px] text-slate-400 mt-1 uppercase">
                      {{ file.type }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10"
        >
          <button
            @click="closeDocModal"
            class="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
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

      // Parallel fetch for files and logs
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
    return reportStore.detail.paymentProofs.some(
      (p: any) => p.tagihanId === tagihanId,
    );
  };

  const viewPaymentProof = async (tagihanId: number) => {
    const payment = reportStore.detail.paymentProofs.find(
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

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "approve":
        return "text-emerald-600 bg-emerald-50";
      case "reject":
        return "text-rose-600 bg-rose-50";
      case "revisi":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const formatDate = (dateStr: string | null, withTime = false) => {
    if (!dateStr) return "-";
    const opt: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    if (withTime) {
      opt.hour = "2-digit";
      opt.minute = "2-digit";
    }
    return new Date(dateStr).toLocaleDateString("id-ID", opt);
  };

  const formatRupiah = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = {
      disetujui: "RAB Disetujui",
      lunas_ppk: "Dana Cair",
      selesai_spi: "Selesai",
    };
    return map[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "selesai_spi":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "lunas_ppk":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "disetujui":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTipeDocumenBadgeClass = (tipe: string, isLight = false) => {
    if (!tipe) return "bg-slate-50 text-slate-500 border-slate-100";
    const t = tipe.toUpperCase();
    if (t === "BARANG")
      return isLight
        ? "bg-blue-100 text-blue-700"
        : "bg-blue-50 text-blue-600 border-blue-100";
    if (t === "JASA")
      return isLight
        ? "bg-purple-100 text-purple-700"
        : "bg-purple-50 text-purple-600 border-purple-100";
    return isLight
      ? "bg-amber-100 text-amber-700"
      : "bg-amber-50 text-amber-600 border-amber-100";
  };

  const getDocStatusBadgeClass = (status: string, type: string) => {
    if (type === "TAGIHAN") {
      if (status === "SELESAI")
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      return "bg-amber-50 text-amber-600 border-amber-100";
    }
    if (status === "DITERIMA")
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-slate-50 text-slate-400 border-slate-100";
  };

  const isImage = (type: string) => type.startsWith("image/");
  const openExternal = (url: string) => window.open(url, "_blank");
</script>

<style scoped>
  iframe {
    background-color: white;
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
