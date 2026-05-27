import { defineStore } from "pinia";
import { ref } from "vue";

export const useSpiOrmawaStore = defineStore("spi-ormawa", () => {
  const ormawa = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchOrmawa = async () => {
    loading.value = true;
    try {
      const response = await $fetch<any>("/api/spi/ormawa");
      if (response.success) {
        ormawa.value = response.data;
      }
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    ormawa,
    loading,
    error,
    fetchOrmawa,
  };
});
