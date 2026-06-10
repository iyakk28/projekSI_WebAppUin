<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between gap-4">
        <button
          @click="$router.back()"
          class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali
        </button>
        <h2 class="text-lg font-bold text-slate-900">
          Detail Berkas Dokumentasi
        </h2>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8" v-if="doc">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Content Area -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Status Banner for Processed Docs -->
          <div
            v-if="isProcessed"
            class="p-4 rounded-2xl border"
            :class="processedBannerClass"
          >
            <div class="flex items-center gap-3">
              <Icon :name="processedIcon" class="w-6 h-6" />
              <div>
                <p class="font-bold text-sm">{{ processedTitle }}</p>
                <p class="text-xs opacity-80">{{ processedSubtitle }}</p>
              </div>
            </div>
          </div>

          <div
            class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              class="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between"
            >
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">
                  Tipe Berkas
                </p>
                <p class="font-bold text-slate-700">
                  {{
                    type === "foto"
                      ? "Dokumentasi Foto"
                      : "Tagihan " + doc.tipeTagihan
                  }}
                </p>
              </div>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold uppercase"
                :class="statusClass(doc.statusTagihan || doc.status)"
              >
                {{ doc.statusTagihan || doc.status }}
              </span>
            </div>

            <div class="p-8">
              <!-- Photo Gallery -->
              <h3 class="text-sm font-bold text-slate-400 uppercase mb-4">
                Berkas Visual
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="img in visualFiles"
                  :key="img.field"
                  class="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition hover:border-[#3b5988]/30"
                >
                  <template v-if="blobUrls[img.field]">
                    <img
                      :src="blobUrls[img.field]"
                      class="w-full h-full object-contain"
                    />
                  </template>
                  <div v-else class="flex items-center justify-center h-full">
                    <div
                      class="w-6 h-6 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                    ></div>
                  </div>

                  <div
                    v-if="blobUrls[img.field]"
                    class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2"
                  >
                    <a
                      :href="blobUrls[img.field]"
                      target="_blank"
                      class="px-4 py-2 bg-white rounded-lg text-xs font-bold text-slate-800 shadow-xl hover:scale-105 transition"
                      >Buka Berkas</a
                    >
                  </div>
                  <div
                    class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold backdrop-blur-sm"
                  >
                    {{ img.label }}
                  </div>
                </div>
              </div>

              <!-- Information Details -->
              <div class="mt-12 space-y-12">
                <!-- Tagihan Details (Barang / Jasa) -->
                <div v-if="type === 'tagihan'">
                  <!-- Data Penerima -->
                  <div class="mb-8">
                    <h3
                      class="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2"
                    >
                      <Icon
                        name="heroicons:user"
                        class="w-4 h-4 text-slate-400"
                      />
                      Data Penerima
                    </h3>
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <div>
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          Nama Penerima
                        </p>
                        <p class="font-bold text-slate-700 text-sm">
                          {{ doc.namaPenerima }}
                        </p>
                      </div>
                      <div>
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          Bank / Rekening
                        </p>
                        <p class="font-bold text-slate-700 text-sm">
                          {{ doc.bankPenerima }} - {{ doc.rekeningPenerima }}
                        </p>
                      </div>
                      <div
                        class="sm:col-span-2 pt-4 border-t border-slate-200/50"
                      >
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          Nominal Tagihan
                        </p>
                        <p class="font-black text-2xl text-[#d1a82a]">
                          {{ formatRp(doc.nominal) }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Detail Barang (Jika ada) -->
                  <div v-if="doc.tokoNama || doc.tokoAlamat" class="mb-8">
                    <h3
                      class="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2"
                    >
                      <Icon
                        name="heroicons:shopping-bag"
                        class="w-4 h-4 text-slate-400"
                      />
                      Rincian Toko / Penyedia
                    </h3>
                    <div
                      class="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
                    >
                      <div v-if="doc.tokoNama">
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          Nama Toko
                        </p>
                        <p class="font-semibold text-slate-700 text-sm">
                          {{ doc.tokoNama }}
                        </p>
                      </div>
                      <div v-if="doc.tokoAlamat">
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          Alamat Toko
                        </p>
                        <p
                          class="font-medium text-slate-600 text-sm leading-relaxed"
                        >
                          {{ doc.tokoAlamat }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Foto Deskripsi -->
                <div v-if="type === 'foto'">
                  <h3 class="text-sm font-bold text-slate-800 uppercase mb-4">
                    Deskripsi Dokumentasi
                  </h3>
                  <div
                    class="p-6 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <p class="text-slate-700 leading-relaxed">
                      {{ doc.deskripsi || "Tidak ada deskripsi" }}
                    </p>
                  </div>
                </div>

                <!-- Dokumen Pendukung (Always for tagihan) -->
                <div v-if="type === 'tagihan'">
                  <h3
                    class="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2"
                  >
                    <Icon
                      name="heroicons:document-duplicate"
                      class="w-4 h-4 text-slate-400"
                    />
                    Dokumen Pendukung
                  </h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div
                      v-for="file in supportingFiles"
                      :key="file.label"
                      class="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <p
                          class="text-[10px] font-bold text-slate-400 uppercase mb-1"
                        >
                          {{ file.label }}
                        </p>
                        <p
                          class="text-[10px] text-slate-600 font-bold truncate mb-3"
                          :class="
                            file.value
                              ? 'text-slate-800'
                              : 'text-slate-400 italic'
                          "
                        >
                          {{ file.value || "Tidak ada data" }}
                        </p>
                      </div>

                      <!-- Kondisi 1: File sudah di-load dan memiliki blob URL -->
                      <a
                        v-if="blobUrls[file.field]"
                        :href="blobUrls[file.field]"
                        target="_blank"
                        class="text-[10px] font-bold text-[#3b5988] flex items-center gap-1.5 px-3 py-1.5 bg-[#3b5988]/5 rounded-lg hover:bg-[#3b5988]/10 transition"
                      >
                        <Icon
                          name="heroicons:arrow-top-right-on-square"
                          class="w-3.5 h-3.5"
                        />
                        Lihat Berkas
                      </a>

                      <!-- Kondisi 2: File sedang loading -->
                      <div
                        v-else-if="file.originalUrl && !blobUrls[file.field]"
                        class="text-[10px] text-slate-400 flex items-center gap-2"
                      >
                        <div
                          class="w-3 h-3 border-2 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
                        ></div>
                        Loading...
                      </div>

                      <!-- Kondisi 3: File tidak diunggah -->
                      <p v-else class="text-[10px] text-slate-400 italic">
                        Berkas tidak diunggah
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Info Pembayaran PPK (If Paid) -->
                <div
                  v-if="type === 'tagihan' && doc.infoPembayaran"
                  class="pt-8 border-t border-slate-200"
                >
                  <h3
                    class="text-sm font-bold text-emerald-700 uppercase mb-4 flex items-center gap-2"
                  >
                    <Icon name="heroicons:credit-card" class="w-5 h-5" />
                    Informasi Realisasi Pembayaran
                  </h3>
                  <div
                    class="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row gap-8"
                  >
                    <div class="flex-1 space-y-4">
                      <div>
                        <p
                          class="text-[10px] font-bold text-emerald-600 uppercase mb-1"
                        >
                          Tanggal Bayar
                        </p>
                        <p class="font-bold text-slate-800 text-sm">
                          {{ formatDate(doc.infoPembayaran.tanggal) }}
                        </p>
                      </div>
                      <div>
                        <p
                          class="text-[10px] font-bold text-emerald-600 uppercase mb-1"
                        >
                          Catatan PPK
                        </p>
                        <p class="font-medium text-slate-700 text-sm italic">
                          "{{ doc.infoPembayaran.catatan }}"
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="blobUrls['paymentProof']"
                      class="w-full sm:w-48 aspect-video sm:aspect-square bg-white rounded-xl border border-emerald-200 overflow-hidden relative group"
                    >
                      <img
                        :src="blobUrls['paymentProof']"
                        class="w-full h-full object-cover"
                      />
                      <a
                        :href="blobUrls['paymentProof']"
                        target="_blank"
                        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-white uppercase"
                        >Buka Bukti Bayar</a
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Sidebar -->
        <div class="space-y-6">
          <div
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24"
          >
            <h3 class="text-sm font-bold text-slate-800 uppercase mb-6">
              Aksi Verifikasi PPK
            </h3>

            <div v-if="!isProcessed" class="space-y-4">
              <!-- Action Selection Buttons -->
              <button
                @click="setSelection('terima')"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="
                  selectedAction === 'terima'
                    ? 'border-[#3b5988] bg-[#3b5988]/5'
                    : 'border-slate-100 hover:border-slate-300'
                "
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Icon name="heroicons:check-badge" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm"
                    >Terima / Valid</span
                  >
                </div>
                <Icon
                  name="heroicons:chevron-right"
                  class="w-4 h-4 text-slate-300"
                />
              </button>

              <button
                @click="setSelection('revisi')"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="
                  selectedAction === 'revisi'
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-slate-100 hover:border-slate-300'
                "
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Icon name="heroicons:arrow-path" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm"
                    >Minta Revisi</span
                  >
                </div>
                <Icon
                  name="heroicons:chevron-right"
                  class="w-4 h-4 text-slate-300"
                />
              </button>

              <button
                v-if="type === 'tagihan'"
                @click="setSelection('bayar')"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition group"
                :class="
                  selectedAction === 'bayar'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-100 hover:border-slate-300'
                "
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Icon name="heroicons:banknotes" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-slate-700 text-sm">Bayarkan</span>
                </div>
                <Icon
                  name="heroicons:chevron-right"
                  class="w-4 h-4 text-slate-300"
                />
              </button>

              <!-- Action Form -->
              <div
                v-if="selectedAction"
                class="mt-8 pt-6 border-t border-slate-100 space-y-6"
              >
                <!-- Confirmation State (Custom UI No Alert) -->
                <div
                  v-if="showConfirmation"
                  class="p-4 bg-slate-900 rounded-xl text-white space-y-4 animate-in fade-in slide-in-from-top-2"
                >
                  <div class="flex gap-3">
                    <Icon
                      name="heroicons:question-mark-circle"
                      class="w-5 h-5 text-amber-400 flex-shrink-0"
                    />
                    <div>
                      <p class="text-sm font-bold">Konfirmasi Aksi?</p>
                      <p class="text-[10px] opacity-70">
                        Apakah Anda yakin data ini sudah benar dan ingin
                        memprosesnya?
                      </p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="showConfirmation = false"
                      class="flex-1 py-2 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20"
                    >
                      Batal
                    </button>
                    <button
                      @click="submitFinalAction"
                      class="flex-1 py-2 rounded-lg bg-emerald-500 text-xs font-bold hover:bg-emerald-600"
                    >
                      Ya, Proses
                    </button>
                  </div>
                </div>

                <div v-else class="space-y-4">
                  <div v-if="selectedAction === 'revisi'">
                    <label
                      class="text-xs font-bold text-slate-500 uppercase mb-2 block"
                      >Komentar Revisi</label
                    >
                    <textarea
                      v-model="actionPayload.komentar"
                      rows="4"
                      class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                      placeholder="Jelaskan bagian mana yang perlu direvisi..."
                    ></textarea>
                  </div>

                  <div v-if="selectedAction === 'bayar'">
                    <label
                      class="text-xs font-bold text-slate-500 uppercase mb-2 block"
                      >Unggah Bukti Pembayaran</label
                    >
                    <div
                      class="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition"
                    >
                      <input
                        type="file"
                        @change="handleFileChange"
                        class="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                      <div class="space-y-2">
                        <Icon
                          name="heroicons:cloud-arrow-up"
                          class="w-8 h-8 mx-auto text-slate-300 group-hover:text-emerald-500"
                        />
                        <p class="text-xs text-slate-500">
                          {{ fileName || "Pilih foto bukti transfer" }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div v-if="selectedAction === 'terima'">
                    <p class="text-xs text-slate-500 italic">
                      Dokumen akan ditandai sebagai valid dan diterima.
                    </p>
                  </div>

                  <button
                    @click="handlePreSubmit"
                    :disabled="
                      loading ||
                      (selectedAction === 'revisi' &&
                        !actionPayload.komentar) ||
                      (selectedAction === 'bayar' && !actionPayload.fotoBukti)
                    "
                    class="w-full py-3 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50"
                    :class="actionBtnClass"
                  >
                    {{ loading ? "Memproses..." : "Lanjutkan Aksi" }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Lock Message -->
            <div v-else class="p-6 text-center space-y-4">
              <div
                class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100"
              >
                <Icon
                  :name="
                    isSuccessAction
                      ? 'heroicons:check-badge'
                      : 'heroicons:lock-closed'
                  "
                  class="w-8 h-8"
                  :class="
                    isSuccessAction ? 'text-emerald-500' : 'text-slate-300'
                  "
                />
              </div>
              <div>
                <p class="font-bold text-slate-800 text-sm">
                  {{
                    isSuccessAction
                      ? "Berkas Berhasil Diproses"
                      : "Berkas Dikembalikan"
                  }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  Aksi untuk berkas ini sudah dikunci karena statusnya sudah
                  final di tahap Anda.
                </p>
              </div>
            </div>
          </div>

          <!-- Feedback Messages -->
          <div
            v-if="successMsg"
            class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-800 animate-in fade-in"
          >
            <Icon name="heroicons:check-circle" class="w-5 h-5 flex-shrink-0" />
            <p class="text-sm font-medium">{{ successMsg }}</p>
          </div>
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-800 animate-in shake"
          >
            <Icon
              name="heroicons:exclamation-circle"
              class="w-5 h-5 flex-shrink-0"
            />
            <p class="text-sm font-medium">{{ error }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Skeleton Loading -->
    <div v-else class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <div
          class="w-8 h-8 border-2 border-slate-200 border-t-[#d1a82a] rounded-full animate-spin"
        ></div>
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
  const type = route.query.type as "foto" | "tagihan";

  const store = usePpkDocDetailStore();
  const { doc, loading, error, successMsg } = storeToRefs(store);
  const { fetchDocDetail, performAction, getFileBlob } = store;

  const selectedAction = ref("");
  const showConfirmation = ref(false);
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

  const loadAllBlobs = async () => {
    if (!doc.value) return;

    const fieldsToLoad =
      type === "foto"
        ? ["fileUrl"]
        : [
            "strukFileUrl",
            "fotoBarangUrl",
            "skFileUrl",
            "npwpFileUrl",
            "ktpFileUrl",
            "spmtFileUrl",
            "amprahFileUrl",
            "bukuRekeningFileUrl",
          ];

    for (const field of fieldsToLoad) {
      if (doc.value[field]) {
        const url = await getFileBlob(docId, type, field);
        if (url) blobUrls[field] = url;
      }
    }

    // Load payment proof if it exists in doc.infoPembayaran
    if (type === "tagihan" && doc.value.infoPembayaran) {
      const url = await getFileBlob(docId, type, "PAYMENT_PROOF");
      if (url) blobUrls["paymentProof"] = url;
    }
  };

  const visualFiles = computed(() => {
    if (!doc.value) return [];
    if (type === "foto")
      return [
        {
          label: "Foto Dokumentasi",
          field: "fileUrl",
          originalUrl: doc.value.fileUrl,
        },
      ];

    const files = [
      {
        label: "Struk Belanja",
        field: "strukFileUrl",
        originalUrl: doc.value.strukFileUrl,
      },
      {
        label:
          doc.value.tipeTagihan === "Jasa"
            ? "Foto Dokumentasi Jasa"
            : "Foto Barang",
        field: "fotoBarangUrl",
        originalUrl: doc.value.fotoBarangUrl,
      },
    ];

    if (doc.value.infoPembayaran) {
      files.push({
        label: "Bukti Pembayaran PPK",
        field: "paymentProof",
        originalUrl: doc.value.infoPembayaran.buktiUrl,
      });
    }

    return files.filter((f) => f.originalUrl);
  });

  const supportingFiles = computed(() => {
    if (type !== "tagihan" || !doc.value) return [];
    return [
      {
        label: "SK / Penugasan",
        value: doc.value.skNomor,
        field: "skFileUrl",
        originalUrl: doc.value.skFileUrl,
      },
      {
        label: "NPWP Penerima",
        value: doc.value.npwpNomor,
        field: "npwpFileUrl",
        originalUrl: doc.value.npwpFileUrl,
      },
      {
        label: "KTP Penerima",
        value: doc.value.ktpNomor,
        field: "ktpFileUrl",
        originalUrl: doc.value.ktpFileUrl,
      },
      {
        label: "SPMT",
        value: doc.value.spmtNomor,
        field: "spmtFileUrl",
        originalUrl: doc.value.spmtFileUrl,
      },
      {
        label: "Amprah",
        value: doc.value.amprahNomor,
        field: "amprahFileUrl",
        originalUrl: doc.value.amprahFileUrl,
      },
      {
        label: "Buku Rekening",
        value: "Terlampir",
        field: "bukuRekeningFileUrl",
        originalUrl: doc.value.bukuRekeningFileUrl,
      },
    ];
  });

  // Logical Constraints
  const isProcessed = computed(() => {
    if (!doc.value) return false;
    if (type === "foto")
      return (
        doc.value.status === "DITERIMA" ||
        doc.value.status === "DITOLAK" ||
        doc.value.status === "REVISI"
      );
    return (
      doc.value.statusTagihan === "SELESAI" ||
      doc.value.statusTagihan === "DITOLAK" ||
      doc.value.statusTagihan === "DIKEMBALIKAN"
    );
  });

  const isSuccessAction = computed(() => {
    if (!doc.value) return false;
    return (
      doc.value.status === "DITERIMA" ||
      doc.value.statusTagihan === "SELESAI" ||
      doc.value.statusTagihan === "TERVERIFIKASI"
    );
  });

  // Banner Metadata
  const processedBannerClass = computed(() => {
    if (isSuccessAction.value)
      return "bg-emerald-50 border-emerald-100 text-emerald-800";
    return "bg-orange-50 border-orange-100 text-orange-800";
  });

  const processedIcon = computed(() => {
    return isSuccessAction.value
      ? "heroicons:check-circle"
      : "heroicons:exclamation-triangle";
  });

  const processedTitle = computed(() => {
    if (type === "tagihan" && doc.value?.statusTagihan === "SELESAI")
      return "Tagihan Telah Dibayarkan";
    if (isSuccessAction.value) return "Berkas Telah Diterima";
    return "Berkas Membutuhkan Revisi / Dikembalikan";
  });

  const processedSubtitle = computed(() => {
    if (type === "tagihan" && doc.value?.statusTagihan === "SELESAI")
      return "Status pembayaran sudah final dan tercatat di sistem.";
    if (isSuccessAction.value)
      return "Berkas ini telah divalidasi dan tidak memerlukan aksi lebih lanjut.";
    return "Menunggu pembaruan data dari pihak ormawa/pengaju.";
  });

  const setSelection = (val: string) => {
    selectedAction.value = val;
    showConfirmation.value = false;
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      actionPayload.fotoBukti = file;
      fileName.value = file.name;
    }
  };

  const handlePreSubmit = () => {
    showConfirmation.value = true;
  };

  const submitFinalAction = async () => {
    showConfirmation.value = false;
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
      loadAllBlobs();
    }
  };

  const actionBtnClass = computed(() => {
    if (selectedAction.value === "revisi")
      return "bg-orange-500 hover:bg-orange-600 shadow-orange-200";
    if (selectedAction.value === "terima")
      return "bg-blue-600 hover:bg-blue-700 shadow-blue-200";
    if (selectedAction.value === "bayar")
      return "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200";
    return "bg-slate-800";
  });

  const formatRp = (val: any) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

<style scoped>
  .animate-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-4px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(4px, 0, 0);
    }
  }
</style>
