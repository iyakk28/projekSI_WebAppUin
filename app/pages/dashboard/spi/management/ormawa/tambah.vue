<template>
  <div class="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <NuxtLink to="/dashboard/spi/management/ormawa" class="text-sm text-[#c41e3a] hover:underline flex items-center gap-1 mb-2">
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
            Kembali ke Daftar Ormawa
          </NuxtLink>
          <h1 class="text-2xl font-bold text-slate-900">Manajemen Ormawa</h1>
          <p class="text-slate-500 text-sm">Tambah data Organisasi Mahasiswa baru</p>
        </div>
      </div>

      <!-- Form Tambah -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Tambah Ormawa Baru</h2>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <Icon name="heroicons:exclamation-circle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-red-800">Kesalahan Input</p>
            <p class="text-sm opacity-90">{{ errorMessage }}</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Nama Ormawa</label>
              <input
                v-model="form.nama"
                @input="errorMessage = ''"
                type="text"
                placeholder="Contoh: Himpunan Mahasiswa Teknik"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#c41e3a]/20 focus:border-[#c41e3a] outline-none transition-all"
                :class="{ 'border-red-300 bg-red-50/30': errorMessage && !form.nama }"
                required
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Kode Ormawa</label>
              <input
                v-model="form.kode"
                @input="errorMessage = ''"
                type="text"
                placeholder="Contoh: HMTI"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#c41e3a]/20 focus:border-[#c41e3a] outline-none transition-all"
                :class="{ 'border-red-300 bg-red-50/30': errorMessage && (errorMessage.includes('Kode') || errorMessage.includes('Ormawa')) }"
                required
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Pilih Fakultas</label>
              <select
                v-model="selectedFakultasId"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#c41e3a]/20 focus:border-[#c41e3a] outline-none transition-all"
                required
              >
                <option value="" disabled>Pilih Fakultas...</option>
                <option v-for="f in fakultasStore.fakultas" :key="f.id" :value="f.id">
                  {{ f.nama }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Pilih Program Studi (Opsional)</label>
              <select
                v-model="form.prodiId"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#c41e3a]/20 focus:border-[#c41e3a] outline-none transition-all"
                :disabled="!selectedFakultasId"
              >
                <option value="">Pilih Prodi (Kosongkan jika Ormawa Fakultas)</option>
                <option v-for="p in filteredProdi" :key="p.id" :value="p.id">
                  {{ p.nama }}
                </option>
              </select>
            </div>
            <div class="space-y-1 md:col-span-2">
              <label class="text-sm font-medium text-slate-700">Total Anggaran Tahunan (Rp)</label>
              <input
                v-model="form.totalAnggaran"
                type="number"
                placeholder="Contoh: 10000000"
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#c41e3a]/20 focus:border-[#c41e3a] outline-none transition-all"
                required
              />
            </div>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="store.loading"
              class="px-6 py-2 bg-[#c41e3a] text-white rounded-lg font-semibold hover:bg-[#a01830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon v-if="store.loading" name="line-md:loading-twotone-loop" class="w-5 h-5" />
              Simpan Ormawa
            </button>
          </div>
        </form>
      </div>

      <!-- Info Card -->
      <div class="bg-blue-50 rounded-2xl border border-blue-100 p-6 flex items-start gap-4">
        <Icon name="heroicons:information-circle" class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold text-blue-900 mb-1">Panduan Pengisian</h3>
          <ul class="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li><strong>Ormawa Fakultas:</strong> Pilih Fakultas, namun kosongkan pilihan Program Studi.</li>
            <li><strong>Ormawa Prodi:</strong> Pilih Fakultas terlebih dahulu, kemudian pilih Program Studi yang sesuai.</li>
            <li><strong>Anggaran:</strong> Masukkan total pagu anggaran yang dialokasikan untuk satu tahun anggaran.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpiOrmawaStore } from '~/stores/spi/ormawa';
import { useSpiFakultasStore } from '~/stores/spi/fakultas';
import { useSpiProdiStore } from '~/stores/spi/prodi';

const store = useSpiOrmawaStore();
const fakultasStore = useSpiFakultasStore();
const prodiStore = useSpiProdiStore();

const errorMessage = ref('');
const selectedFakultasId = ref('');
const form = ref({
  nama: '',
  kode: '',
  totalAnggaran: 0,
  prodiId: '' as any
});

const filteredProdi = computed(() => {
  if (!selectedFakultasId.value) return [];
  return prodiStore.prodi.filter(p => p.fakultasId === Number(selectedFakultasId.value));
});

onMounted(() => {
  store.fetchOrmawa();
  fakultasStore.fetchFakultas();
  prodiStore.fetchProdi();
});

const formatRp = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const handleSubmit = async () => {
  errorMessage.value = '';
  const res = await store.addOrmawa({ 
    nama: form.value.nama,
    kode: form.value.kode,
    totalAnggaran: Number(form.value.totalAnggaran),
    fakultasId: Number(selectedFakultasId.value),
    prodiId: form.value.prodiId ? Number(form.value.prodiId) : null
  });
  
  if (res.success) {
    form.value = { nama: '', kode: '', totalAnggaran: 0, prodiId: '' };
    selectedFakultasId.value = '';
    alert('Ormawa berhasil ditambahkan!');
  } else {
    errorMessage.value = res.message || 'Gagal menambahkan ormawa';
  }
};
</script>
