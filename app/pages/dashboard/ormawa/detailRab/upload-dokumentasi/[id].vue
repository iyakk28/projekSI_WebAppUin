<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Tombol Kembali & Header -->
      <div class="mb-6 flex items-center gap-3">
        <button
          @click="goBack"
          class="p-2 rounded-lg hover:bg-slate-200 transition"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            Upload Dokumentasi Kegiatan
          </h1>
          <p class="text-sm text-slate-500">
            Kelengkapan acara, bukti belanja, dan bukti jasa
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <Icon
          name="heroicons:arrow-path"
          class="w-8 h-8 animate-spin text-[#3b5988] mx-auto"
        />
        <p class="text-slate-500 mt-2">Memuat data...</p>
      </div>

      <div v-else>
        <!-- Informasi Kegiatan -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6"
        >
          <h2 class="text-lg font-bold text-slate-900 mb-2">
            {{ kegiatan?.judulKegiatan || "Kegiatan" }}
          </h2>
          <div class="flex flex-wrap gap-4 text-sm text-slate-500">
            <span class="flex items-center gap-1">
              <Icon name="heroicons:calendar" class="w-4 h-4" />
              {{ formatTanggal(kegiatan?.tanggalMulai) }} -
              {{ formatTanggal(kegiatan?.tanggalSelesai) }}
            </span>
            <span class="flex items-center gap-1">
              <Icon name="heroicons:document-text" class="w-4 h-4" />
              Status:
              <span :class="statusBadgeClass(kegiatan?.statusKegiatan)">{{
                formatStatusKegiatan(kegiatan?.statusKegiatan)
              }}</span>
            </span>
          </div>
        </div>

        <!-- TAB NAVIGATION -->
        <div class="flex border-b border-slate-200 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-5 py-2.5 text-sm font-medium transition-all duration-200 border-b-2"
            :class="
              activeTab === tab.key
                ? 'border-[#3b5988] text-[#3b5988]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            "
          >
            <Icon :name="tab.icon" class="w-4 h-4 inline mr-1" />
            {{ tab.label }}
          </button>
        </div>

        <!-- ========== TAB DOKUMENTASI KEGIATAN ========== -->
        <div
          v-if="activeTab === 'dokumentasi'"
          class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8"
        >
          <h3
            class="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2"
          >
            <Icon name="heroicons:camera" class="w-5 h-5 text-[#d1a82a]" />
            Dokumentasi Kegiatan
          </h3>
          <form @submit.prevent="submitDokumentasi" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="dokumentasiForm.deskripsi"
                rows="2"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                placeholder="Contoh: Dokumentasi pembukaan kegiatan, sesi penyelenggaraan, dll."
                required
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                File Dokumentasi <span class="text-red-500">*</span>
              </label>
              <input
                type="file"
                @change="handleDokumentasiFileChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
              <p class="text-xs text-slate-500 mt-1">
                Foto atau PDF, maks 10MB
              </p>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="dokumentasiUploading"
                class="px-6 py-2 rounded-xl bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition disabled:opacity-50"
              >
                <Icon
                  v-if="dokumentasiUploading"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin inline mr-1"
                />
                {{
                  dokumentasiUploading ? "Mengupload..." : "Upload Dokumentasi"
                }}
              </button>
            </div>
          </form>
        </div>

        <!-- ========== TAB UPLOAD BARANG ========== -->
        <div
          v-if="activeTab === 'barang'"
          class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8"
        >
          <h3
            class="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2"
          >
            <Icon
              name="heroicons:shopping-bag"
              class="w-5 h-5 text-[#d1a82a]"
            />
            Upload Barang
          </h3>
          <form @submit.prevent="submitBarang" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Toko <span class="text-red-500">*</span></label
              >
              <input
                v-model="barangForm.tokoNama"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Alamat Toko</label
              >
              <textarea
                v-model="barangForm.tokoAlamat"
                rows="2"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
              ></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nomor Rekening Toko
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model="barangForm.rekeningPenerima"
                  type="text"
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Bank Penerima <span class="text-red-500">*</span></label
                >
                <input
                  v-model="barangForm.bankPenerima"
                  type="text"
                  placeholder="Contoh: BNI, Mandiri, BCA"
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Pemilik Rekening
                <span class="text-red-500">*</span></label
              >
              <input
                v-model="barangForm.namaPenerima"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nominal Transaksi (Rp)
                <span class="text-red-500">*</span></label
              >
              <input
                v-model="barangForm.nominal"
                type="number"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Foto Struk Belanja <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleBarangStrukChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
              <p class="text-xs text-slate-500 mt-1">
                Foto atau scan struk belanja
              </p>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="barangUploading"
                class="px-6 py-2 rounded-xl bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition disabled:opacity-50"
              >
                <Icon
                  v-if="barangUploading"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin inline mr-1"
                />
                {{ barangUploading ? "Mengupload..." : "Upload Barang" }}
              </button>
            </div>
          </form>
        </div>

        <!-- ========== TAB UPLOAD JASA ========== -->
        <div
          v-if="activeTab === 'jasa'"
          class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8"
        >
          <h3
            class="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2"
          >
            <Icon name="heroicons:user-group" class="w-5 h-5 text-[#d1a82a]" />
            Upload Jasa (Penyedia Jasa)
          </h3>
          <form @submit.prevent="submitJasa" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Penyedia Jasa <span class="text-red-500">*</span></label
              >
              <input
                v-model="jasaForm.namaPenerima"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Nomor Rekening <span class="text-red-500">*</span></label
                >
                <input
                  v-model="jasaForm.rekeningPenerima"
                  type="text"
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Bank Penerima <span class="text-red-500">*</span></label
                >
                <input
                  v-model="jasaForm.bankPenerima"
                  type="text"
                  placeholder="Contoh: BNI, Mandiri, BCA"
                  class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nominal Transaksi (Rp)
                <span class="text-red-500">*</span></label
              >
              <input
                v-model="jasaForm.nominal"
                type="number"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nomor SK</label
              >
              <input
                v-model="jasaForm.skNomor"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload File SK <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaSKChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="jasaUploading"
                class="px-6 py-2 rounded-xl bg-[#3b5988] text-white font-medium hover:bg-[#2d4570] transition disabled:opacity-50"
              >
                <Icon
                  v-if="jasaUploading"
                  name="heroicons:arrow-path"
                  class="w-4 h-4 animate-spin inline mr-1"
                />
                {{ jasaUploading ? "Mengupload..." : "Upload Jasa" }}
              </button>
            </div>
          </form>
        </div>

        <!-- ========== RIWAYAT UPLOAD (GABUNGAN) ========== -->

        <ormawa-dokumentasi-list-component
          :kegiatan-id="kegiatanId"
        ></ormawa-dokumentasi-list-component>
      </div>
    </div>
  </div>
  <!-- POPUP NOTIFIKASI SUKSES (di tengah) -->
  <Teleport to="body">
    <div
      v-if="popupVisible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300"
      @click.self="closePopup"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 animate-popup"
      >
        <div class="flex flex-col items-center text-center">
          <!-- Ikon sukses animasi -->
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-in"
          >
            <Icon
              name="heroicons:check-circle"
              class="w-10 h-10 text-green-500"
            />
          </div>

          <h3 class="text-xl font-bold text-slate-800 mb-2">Berhasil!</h3>
          <p class="text-slate-600 mb-6">{{ popupMessage }}</p>

          <button
            @click="closePopup"
            class="px-6 py-2 bg-[#3b5988] hover:bg-[#2d4570] text-white rounded-xl font-medium transition duration-200 shadow-md hover:shadow-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useDokumentasiStore } from "~/stores/ormawa/allDokumen";
  import { useKegiatanStore } from "~/stores/ormawa/uploadDokumen";

  const route = useRoute();
  const router = useRouter();
  const kegiatanStore = useKegiatanStore();
  const allDokumenStore = useDokumentasiStore();
  const kegiatanId = computed(() => {
    const id = route.params.id;
    return id ? parseInt(id as string) : null;
  });

  const activeTab = ref("dokumentasi");
  const tabs = [
    {
      key: "dokumentasi",
      label: "Dokumentasi Kegiatan",
      icon: "heroicons:camera",
    },
    { key: "barang", label: "Upload Barang", icon: "heroicons:shopping-bag" },
    { key: "jasa", label: "Upload Jasa", icon: "heroicons:user-group" },
  ];

  const loading = computed(() => kegiatanStore.loading);
  const kegiatan = computed(() => kegiatanStore.kegiatan);
  const popupVisible = computed(() => kegiatanStore.popupVisible);
  const popupMessage = computed(() => kegiatanStore.popupMessage);
  const dokumentasiUploading = computed(
    () => kegiatanStore.dokumentasiUploading,
  );
  const barangUploading = computed(() => kegiatanStore.barangUploading);
  const jasaUploading = computed(() => kegiatanStore.jasaUploading);

  // Form state
  const dokumentasiForm = ref({ deskripsi: "", file: null as File | null });
  const barangForm = ref({
    tokoNama: "",
    tokoAlamat: "",
    rekeningPenerima: "",
    bankPenerima: "",
    namaPenerima: "",
    nominal: "",
    fotoStruk: null as File | null,
  });
  const jasaForm = ref({
    namaPenerima: "",
    rekeningPenerima: "",
    bankPenerima: "",
    nominal: "",
    skNomor: "",
    skFile: null as File | null,
  });

  // Helper functions
  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatusKegiatan = (status: string) => {
    const map: Record<string, string> = {
      belum_mulai: "Belum Mulai",
      berlangsung: "Sedang Berlangsung",
      selesai: "Selesai",
    };
    return map[status] || status;
  };

  const statusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      belum_mulai: "bg-slate-100 text-slate-700",
      berlangsung: "bg-blue-100 text-blue-700",
      selesai: "bg-emerald-100 text-emerald-700",
    };
    return `ml-1 px-2 py-0.5 rounded-full text-xs ${classes[status] || "bg-slate-100"}`;
  };

  const handleDokumentasiFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    dokumentasiForm.value.file = file;
  };

  const handleBarangStrukChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    barangForm.value.fotoStruk = file;
  };

  const handleJasaSKChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    jasaForm.value.skFile = file;
  };

  // Submit functions
  const submitDokumentasi = async () => {
    if (!dokumentasiForm.value.deskripsi || !dokumentasiForm.value.file)
      return alert("Lengkapi deskripsi dan file");
    const fd = new FormData();
    fd.append("kegiatanId", String(kegiatanId.value));
    fd.append("deskripsi", dokumentasiForm.value.deskripsi);
    fd.append("file", dokumentasiForm.value.file);
    await kegiatanStore.submitDokumentasi(fd);
    dokumentasiForm.value = { deskripsi: "", file: null };
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const submitBarang = async () => {
    if (
      !barangForm.value.tokoNama ||
      !barangForm.value.rekeningPenerima ||
      !barangForm.value.namaPenerima ||
      !barangForm.value.bankPenerima ||
      !barangForm.value.nominal ||
      !barangForm.value.fotoStruk
    ) {
      return alert("Field bertanda * wajib diisi");
    }
    const fd = new FormData();
    fd.append("kegiatanId", String(kegiatanId.value));
    fd.append("tokoNama", barangForm.value.tokoNama);
    fd.append("tokoAlamat", barangForm.value.tokoAlamat);
    fd.append("rekeningPenerima", barangForm.value.rekeningPenerima);
    fd.append("bankPenerima", barangForm.value.bankPenerima);
    fd.append("namaPenerima", barangForm.value.namaPenerima);
    fd.append("nominal", String(barangForm.value.nominal));
    fd.append("fotoStruk", barangForm.value.fotoStruk);
    await kegiatanStore.submitBarang(fd);
    barangForm.value = {
      tokoNama: "",
      tokoAlamat: "",
      rekeningPenerima: "",
      bankPenerima: "",
      namaPenerima: "",
      nominal: "",
      fotoStruk: null,
    };
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => (input.value = ""));
  };

  const submitJasa = async () => {
    if (
      !jasaForm.value.namaPenerima ||
      !jasaForm.value.rekeningPenerima ||
      !jasaForm.value.bankPenerima ||
      !jasaForm.value.nominal ||
      !jasaForm.value.skFile
    ) {
      return alert("Field bertanda * wajib diisi");
    }
    const fd = new FormData();
    fd.append("kegiatanId", String(kegiatanId.value));
    fd.append("namaPenerima", jasaForm.value.namaPenerima);
    fd.append("rekeningPenerima", jasaForm.value.rekeningPenerima);
    fd.append("bankPenerima", jasaForm.value.bankPenerima);
    fd.append("nominal", String(jasaForm.value.nominal));
    fd.append("skNomor", jasaForm.value.skNomor);
    fd.append("skFile", jasaForm.value.skFile);
    await kegiatanStore.submitJasa(fd);
    jasaForm.value = {
      namaPenerima: "",
      rekeningPenerima: "",
      bankPenerima: "",
      nominal: "",
      skNomor: "",
      skFile: null,
    };
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => (input.value = ""));
  };

  const closePopup = async () => {
    kegiatanStore.closePopup();
    await allDokumenStore.refreshDokumentasi(Number(kegiatanId.value));
  };
  const goBack = () => router.back();
  onMounted(() => {});
</script>

<style scoped>
  @keyframes popupZoom {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
    80% {
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-popup {
    animation: popupZoom 0.2s ease-out;
  }

  .animate-bounce-in {
    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
</style>
