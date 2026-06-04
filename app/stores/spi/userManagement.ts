import { defineStore } from "pinia";
import { ref } from "vue";

export interface UserListItem {
  id: number;
  email: string;
  users_id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  fakultasName: string | null;
  prodiName: string | null;
  ormawaName: string | null;
}

export const useSpiUserManagementStore = defineStore("spi-user-management", () => {
  const users = ref<UserListItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filter state
  const filters = ref({
    role: "all",
    fakultasId: "",
    prodiId: "",
    ormawaId: "",
    search: "",
  });

  // Pagination state
  const page = ref(1);
  const limit = ref(10);
  const total = ref(0);

  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const query: any = {
        page: page.value,
        limit: limit.value,
        role: filters.value.role === "all" ? undefined : filters.value.role,
        fakultasId: filters.value.fakultasId || undefined,
        prodiId: filters.value.prodiId || undefined,
        ormawaId: filters.value.ormawaId || undefined,
        search: filters.value.search || undefined,
      };

      const response = await $fetch<any>("/api/spi/management/users", { query });
      if (response.success) {
        users.value = response.data;
        total.value = response.meta.total;
      } else {
        error.value = response.message;
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || "Gagal mengambil data user";
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value = {
      role: "all",
      fakultasId: "",
      prodiId: "",
      ormawaId: "",
      search: "",
    };
    page.value = 1;
    fetchUsers();
  };

  const changePage = (newPage: number) => {
    page.value = newPage;
    fetchUsers();
  };

  return {
    users,
    loading,
    error,
    filters,
    page,
    limit,
    total,
    fetchUsers,
    resetFilters,
    changePage,
  };
});
