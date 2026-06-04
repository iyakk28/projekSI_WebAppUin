<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Manajemen User</h1>
          <p class="text-slate-500 mt-1 text-sm font-medium">
            Kelola data pengguna sistem, perbarui informasi, dan atur peran akses.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/spi/management/users/tambah"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Tambah User
          </NuxtLink>
          <NuxtLink
            to="/dashboard/spi"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
            Kembali
          </NuxtLink>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div class="flex items-center gap-2 text-slate-800 font-bold mb-2">
          <Icon name="heroicons:funnel" class="w-5 h-5 text-emerald-600" />
          Filter Data User
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Search -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cari Nama / Email / ID</label>
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="filters.search"
                type="text"
                placeholder="Cari..."
                class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Role Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
            <select
              v-model="filters.role"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="userStore.fetchUsers()"
            >
              <option value="all">Semua Role</option>
              <option value="ormawa">Ormawa</option>
              <option value="kaprodi">Kaprodi</option>
              <option value="ppk">PPK</option>
              <option value="spi">SPI</option>
            </select>
          </div>

          <!-- Fakultas Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fakultas</label>
            <select
              v-model="filters.fakultasId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="onFakultasChange"
            >
              <option value="">Semua Fakultas</option>
              <option v-for="f in fakultasStore.fakultas" :key="f.id" :value="f.id">{{ f.nama }}</option>
            </select>
          </div>

          <!-- Prodi Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Program Studi</label>
            <select
              v-model="filters.prodiId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="onProdiChange"
            >
              <option value="">Semua Prodi</option>
              <option v-for="p in filteredProdi" :key="p.id" :value="p.id">{{ p.nama }}</option>
            </select>
          </div>

          <!-- Ormawa Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unit Kerja / Ormawa</label>
            <select
              v-model="filters.ormawaId"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none cursor-pointer"
              @change="userStore.fetchUsers()"
            >
              <option value="">Semua Ormawa</option>
              <option v-for="o in filteredOrmawa" :key="o.id" :value="o.id">{{ o.nama }}</option>
            </select>
          </div>

          <!-- Reset -->
          <div class="flex items-end pb-0.5">
            <button
              @click="userStore.resetFilters()"
              class="w-full px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Role</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit / Fakultas</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tgl Terdaftar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="userStore.loading" v-for="i in 5" :key="i" class="animate-pulse">
                <td colspan="7" class="px-6 py-4">
                  <div class="h-4 bg-slate-100 rounded w-full"></div>
                </td>
              </tr>
              <tr v-else-if="userStore.users.length === 0">
                <td colspan="7" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Icon name="heroicons:users" class="w-8 h-8 text-slate-300" />
                    </div>
                    <p class="text-slate-500 font-medium">Tidak ada data user yang ditemukan.</p>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="user in userStore.users" :key="user.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-bold text-slate-900">{{ user.users_id }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-bold text-slate-900">{{ user.fullName }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-slate-600">{{ user.email }}</p>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    :class="getRoleBadgeClass(user.role)"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-700">{{ user.ormawaName || user.prodiName || '-' }}</span>
                    <span class="text-[10px] text-slate-500 font-medium">{{ user.fakultasName || 'Universitas' }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span
                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                    :class="user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                  >
                    {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span class="text-xs font-medium text-slate-500">{{ formatDate(user.createdAt) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="userStore.total > 0" class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div class="text-sm text-slate-500 font-medium">
            Menampilkan
            <span class="font-bold text-slate-900">{{ (userStore.page - 1) * userStore.limit + 1 }}</span>
            -
            <span class="font-bold text-slate-900">{{ Math.min(userStore.page * userStore.limit, userStore.total) }}</span>
            dari
            <span class="font-bold text-slate-900">{{ userStore.total }}</span>
            data
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="userStore.changePage(userStore.page - 1)"
              :disabled="userStore.page === 1"
              class="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              <Icon name="heroicons:chevron-left" class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="p in totalPages"
                :key="p"
                @click="userStore.changePage(p)"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                  userStore.page === p
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100',
                ]"
              >
                {{ p }}
              </button>
            </div>
            <button
              @click="userStore.changePage(userStore.page + 1)"
              :disabled="userStore.page === totalPages"
              class="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              <Icon name="heroicons:chevron-right" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSpiUserManagementStore } from '~/stores/spi/userManagement';
import { useSpiFakultasStore } from "~/stores/spi/fakultas";
import { useSpiProdiStore } from "~/stores/spi/prodi";
import { useSpiOrmawaStore } from "~/stores/spi/ormawa";
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";

const userStore = useSpiUserManagementStore();
const fakultasStore = useSpiFakultasStore();
const prodiStore = useSpiProdiStore();
const ormawaStore = useSpiOrmawaStore();

const { filters } = storeToRefs(userStore);

const totalPages = computed(() => Math.ceil(userStore.total / userStore.limit));

const filteredProdi = computed(() => {
  if (!filters.value.fakultasId) return prodiStore.prodi;
  return prodiStore.prodi.filter(
    (p) => p.fakultasId === parseInt(filters.value.fakultasId),
  );
});

const filteredOrmawa = computed(() => {
  if (!filters.value.fakultasId) return ormawaStore.ormawa;
  let list = ormawaStore.ormawa.filter(
    (o) => o.fakultasId === parseInt(filters.value.fakultasId),
  );
  if (filters.value.prodiId) {
    list = list.filter((o) => o.prodiId === parseInt(filters.value.prodiId));
  }
  return list;
});

const onFakultasChange = () => {
  filters.value.prodiId = "";
  filters.value.ormawaId = "";
  userStore.fetchUsers();
};

const onProdiChange = () => {
  filters.value.ormawaId = "";
  userStore.fetchUsers();
};

let searchTimeout: any = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    userStore.fetchUsers();
  }, 500);
};

onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers(),
    fakultasStore.fetchFakultas(),
    prodiStore.fetchProdi(),
    ormawaStore.fetchOrmawa(),
  ]);
});

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'spi': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ppk': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'kaprodi': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ormawa': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
</script>
