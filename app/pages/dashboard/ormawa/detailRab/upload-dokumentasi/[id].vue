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
                placeholder="Contoh: Dokumentasi pembukaan kegiatan, sesi penyelenggaraan, penutupan, dll."
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
                v-model="barangForm.namaToko"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nomor Rekening Toko <span class="text-red-500">*</span></label
              >
              <input
                v-model="barangForm.nomorRekeningToko"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Pemilik Rekening
                <span class="text-red-500">*</span></label
              >
              <input
                v-model="barangForm.namaPemilikRekening"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Foto Barang <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleBarangFotoChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
              <p class="text-xs text-slate-500 mt-1">Foto barang yang dibeli</p>
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
                v-model="jasaForm.namaPenyedia"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nomor Rekening <span class="text-red-500">*</span></label
              >
              <input
                v-model="jasaForm.nomorRekening"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Nama Pemilik Rekening
                <span class="text-red-500">*</span></label
              >
              <input
                v-model="jasaForm.namaPemilikRekening"
                type="text"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#3b5988] outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload SK <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaSKChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload SPMT <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaSPMTChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload Amprah <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaAmprahChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload NPWP (jika PNS)
                <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaNPWPChange"
                accept="image/*,application/pdf"
                class="w-full border border-slate-200 rounded-xl p-2"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1"
                >Upload KTP <span class="text-red-500">*</span></label
              >
              <input
                type="file"
                @change="handleJasaKTPChange"
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
  import { useKegiatanStore } from "~/stores/ormawa/uploadDokumen";

  const route = useRoute();
  const router = useRouter();
  const kegiatanStore = useKegiatanStore();

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

  // Data dari store (pastikan store memiliki state dan getter yang sesuai)
  const loading = computed(() => kegiatanStore.loading);
  const kegiatan = computed(() => kegiatanStore.kegiatan);
  const dokumentasiList = computed(() => kegiatanStore.dokumentasiList);
  const barangList = computed(() => kegiatanStore.barangList);
  const jasaList = computed(() => kegiatanStore.jasaList);
  const popupVisible = computed(() => kegiatanStore.popupVisible);
  const popupMessage = computed(() => kegiatanStore.popupMessage);
  const dokumentasiUploading = computed(
    () => kegiatanStore.dokumentasiUploading,
  );
  const barangUploading = computed(() => kegiatanStore.barangUploading);
  const jasaUploading = computed(() => kegiatanStore.jasaUploading);

  const allUploads = computed(() => {
    const docs = dokumentasiList.value.map((d) => ({
      ...d,
      jenis: "dokumentasi",
      jenisLabel: "Dokumentasi Kegiatan",
    }));
    const bars = barangList.value.map((b) => ({
      ...b,
      jenis: "barang",
      jenisLabel: "Barang",
    }));
    const jas = jasaList.value.map((j) => ({
      ...j,
      jenis: "jasa",
      jenisLabel: "Jasa",
    }));
    return [...docs, ...bars, ...jas].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  // Form state
  const dokumentasiForm = ref({ deskripsi: "", file: null as File | null });
  const barangForm = ref({
    namaToko: "",
    nomorRekeningToko: "",
    namaPemilikRekening: "",
    fotoBarang: null as File | null,
    fotoStruk: null as File | null,
  });
  const jasaForm = ref({
    namaPenyedia: "",
    nomorRekening: "",
    namaPemilikRekening: "",
    sk: null as File | null,
    spmt: null as File | null,
    amprah: null as File | null,
    npwp: null as File | null,
    ktp: null as File | null,
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
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  // Handler file untuk dokumentasi
  const handleDokumentasiFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    dokumentasiForm.value.file = file;
    console.log("File berhasil dipilih:", file.name, file.size, file.type);
  };

  // Handler file untuk barang
  const handleBarangFotoChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    barangForm.value.fotoBarang = file;
    console.log("Foto Barang dipilih:", file.name, file.size, file.type);
  };

  const handleBarangStrukChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    barangForm.value.fotoStruk = file;
    console.log("Foto Struk dipilih:", file.name, file.size, file.type);
  };

  // Handler file untuk jasa
  const handleJasaSKChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    jasaForm.value.sk = file;
    console.log("File SK dipilih:", file.name, file.size, file.type);
  };

  const handleJasaSPMTChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    jasaForm.value.spmt = file;
    console.log("File SPMT dipilih:", file.name, file.size, file.type);
  };

  const handleJasaAmprahChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    jasaForm.value.amprah = file;
    console.log("File Amprah dipilih:", file.name, file.size, file.type);
  };

  const handleJasaNPWPChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    jasaForm.value.npwp = file;
    console.log("File NPWP dipilih:", file.name, file.size, file.type);
  };

  const handleJasaKTPChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      alert("Tidak ada file yang dipilih");
      return;
    }
    const file = target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      target.value = "";
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      target.value = "";
      return;
    }
    jasaForm.value.ktp = file;
    console.log("File KTP dipilih:", file.name, file.size, file.type);
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
    // Reset input file secara visual
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const submitBarang = async () => {
    if (
      !barangForm.value.namaToko ||
      !barangForm.value.nomorRekeningToko ||
      !barangForm.value.namaPemilikRekening ||
      !barangForm.value.fotoBarang ||
      !barangForm.value.fotoStruk
    ) {
      return alert("Semua field dan file wajib diisi");
    }
    const fd = new FormData();
    fd.append("kegiatanId", String(kegiatanId.value));
    fd.append("namaToko", barangForm.value.namaToko);
    fd.append("nomorRekeningToko", barangForm.value.nomorRekeningToko);
    fd.append("namaPemilikRekening", barangForm.value.namaPemilikRekening);
    fd.append("fotoBarang", barangForm.value.fotoBarang);
    fd.append("fotoStruk", barangForm.value.fotoStruk);
    await kegiatanStore.submitBarang(fd);
    barangForm.value = {
      namaToko: "",
      nomorRekeningToko: "",
      namaPemilikRekening: "",
      fotoBarang: null,
      fotoStruk: null,
    };
    // Reset file inputs
    const fotoBarangInput = document.querySelector(
      'input[accept="image/*,application/pdf"]',
    ) as HTMLInputElement;
    if (fotoBarangInput) fotoBarangInput.value = "";
    const fotoStrukInput = document.querySelectorAll(
      'input[accept="image/*,application/pdf"]',
    )[1] as HTMLInputElement;
    if (fotoStrukInput) fotoStrukInput.value = "";
  };

  const submitJasa = async () => {
    if (
      !jasaForm.value.namaPenyedia ||
      !jasaForm.value.nomorRekening ||
      !jasaForm.value.namaPemilikRekening ||
      !jasaForm.value.sk ||
      !jasaForm.value.spmt ||
      !jasaForm.value.amprah ||
      !jasaForm.value.npwp ||
      !jasaForm.value.ktp
    ) {
      return alert("Semua field dan file wajib diisi");
    }
    const fd = new FormData();
    fd.append("kegiatanId", String(kegiatanId.value));
    fd.append("namaPenyedia", jasaForm.value.namaPenyedia);
    fd.append("nomorRekening", jasaForm.value.nomorRekening);
    fd.append("namaPemilikRekening", jasaForm.value.namaPemilikRekening);
    fd.append("sk", jasaForm.value.sk);
    fd.append("spmt", jasaForm.value.spmt);
    fd.append("amprah", jasaForm.value.amprah);
    fd.append("npwp", jasaForm.value.npwp);
    fd.append("ktp", jasaForm.value.ktp);
    await kegiatanStore.submitJasa(fd);
    jasaForm.value = {
      namaPenyedia: "",
      nomorRekening: "",
      namaPemilikRekening: "",
      sk: null,
      spmt: null,
      amprah: null,
      npwp: null,
      ktp: null,
    };
    // Reset all file inputs (bisa dengan querySelectorAll)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => (input.value = ""));
  };

  // Delete dan helper lainnya
  const deleteUpload = async (item: any) => {
    if (!confirm(`Hapus ${item.jenisLabel} ini?`)) return;
    await kegiatanStore.deleteUpload(item);
  };

  const refreshData = () => {
    if (kegiatanId.value) {
      kegiatanStore.fetchDokumentasi(kegiatanId.value);
      kegiatanStore.fetchBarang(kegiatanId.value);
      kegiatanStore.fetchJasa(kegiatanId.value);
    }
  };

  const closePopup = () => kegiatanStore.closePopup();
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
