<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b-2 shadow-md"
      :style="{
        background:
          'linear-gradient(135deg, #0f1f3d 0%, #1e3a6e 60%, #2d4f8e 100%)',
        borderBottomColor: 'rgba(201, 162, 39, 0.35)',
      }"
    >
      <nav class="mx-auto flex items-center justify-between px-4 py-3 md:px-8">
        <!-- Logo dan Nama -->
        <div class="flex items-center space-x-2">
          <img
            src="~~/assets/images/logouin.png"
            alt=""
            height="32"
            width="32"
          />
          <span class="text-lg font-bold hidden sm:inline text-white">
            UIN Mahmud Yunus
          </span>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-1">
          <NuxtLink to="/dashboard" class="nav-link"> Dashboard </NuxtLink>
          <template v-if="authStore.user?.role === 'ormawa'">
            <NuxtLink to="/dashboard/ormawa/pengajuanRab" class="nav-link">
              Pengajuan RAB
            </NuxtLink>
            <NuxtLink to="/dashboard/ormawa/monitoring" class="nav-link">
              Kegiatan Saya
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'kaprodi'">
            <NuxtLink to="/dashboard/kaprodi/pengajuan" class="nav-link">
              Verifikasi RAB
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'ppk'">
            <NuxtLink to="/dashboard/ppk/pengajuan" class="nav-link">
              Audit
            </NuxtLink>
            <NuxtLink to="/dashboard/ppk/pencairan" class="nav-link">
              Pencairan
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'spi'">
            <NuxtLink to="/spi/verifikasi" class="nav-link">
              Verifikasi LPJ
            </NuxtLink>
          </template>
        </div>

        <!-- User Dropdown (Desktop) -->
        <div class="hidden md:flex items-center space-x-4">
          <div class="relative" ref="dropdownRef">
            <button
              @click="toggleDropdown"
              class="flex items-center space-x-2 focus:outline-none"
            >
              <div
                class="h-[34px] w-[34px] rounded-lg flex items-center justify-center font-bold text-sm"
                :style="{
                  background: 'rgba(201, 162, 39, 0.2)',
                  border: '1.5px solid rgba(201, 162, 39, 0.5)',
                  color: '#e4c96a',
                }"
              >
                {{ authStore.user?.username?.charAt(0).toUpperCase() || "U" }}
              </div>
              <span class="text-white/90 font-medium text-sm">
                {{ authStore.user?.username }}
              </span>
              <Icon
                name="heroicons:chevron-down"
                class="h-4 w-4 text-white/50"
              />
            </button>
            <div
              v-if="dropdownOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10"
            >
              <div class="px-4 py-3 border-b border-slate-50">
                <p class="text-xs font-semibold text-slate-700">
                  {{ authStore.user?.username }}
                </p>
                <p class="text-[11px] text-slate-400 mt-0.5 capitalize">
                  {{ authStore.user?.role }}
                </p>
              </div>
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Icon
                  name="heroicons:arrow-right-on-rectangle"
                  class="h-4 w-4"
                />
                Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="focus:outline-none text-white"
          >
            <Icon
              v-if="!mobileMenuOpen"
              name="heroicons:bars-3"
              class="h-6 w-6"
            />
            <Icon v-else name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>
      </nav>

      <!-- Mobile Menu Panel -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-black/40 backdrop-blur-md border-t border-white/10 px-4 pb-3 pt-2"
      >
        <div class="space-y-1">
          <NuxtLink
            to="/dashboard"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Dashboard
          </NuxtLink>
          <template v-if="authStore.user?.role === 'ormawa'">
            <NuxtLink
              to="/ormawa/pengajuanRab"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Pengajuan RAB
            </NuxtLink>
            <NuxtLink
              to="/ormawa/kegiatan"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Kegiatan Saya
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'kaprodi'">
            <NuxtLink
              to="/kaprodi/verifikasi"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Verifikasi RAB
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'ppk'">
            <NuxtLink
              to="/ppk/pengajuan"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Audit
            </NuxtLink>
            <NuxtLink
              to="/ppk/pencairan"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Pencairan
            </NuxtLink>
          </template>
          <template v-if="authStore.user?.role === 'spi'">
            <NuxtLink
              to="/spi/verifikasi"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              Verifikasi LPJ
            </NuxtLink>
          </template>
          <hr class="my-2 border-white/10" />
          <div class="pt-2">
            <p class="text-xs text-white/50">
              {{ authStore.user?.username }} ({{ authStore.user?.role }})
            </p>
            <button
              @click="handleLogout"
              class="mt-2 w-full rounded-lg bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1">
      <slot />
    </div>

    <!-- Footer -->
    <footer
      class="text-white border-t-2"
      :style="{
        background:
          'linear-gradient(135deg, #0f1f3d 0%, #1e3a6e 60%, #2d4f8e 100%)',
        borderTopColor: 'rgba(201, 162, 39, 0.35)',
      }"
    >
      <div class="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <!-- Alamat -->
          <div>
            <h3 class="mb-3 text-lg font-semibold text-[#e4c96a]">Alamat</h3>
            <p class="text-sm leading-relaxed text-white/80">
              Jl. Sudirman No.137 Lima Kaum, <br />
              Batusangkar, Tanah Datar, <br />
              Sumatera Barat, Indonesia
            </p>
          </div>

          <!-- Kontak -->
          <div>
            <h3 class="mb-3 text-lg font-semibold text-[#e4c96a]">
              Kontak Kami
            </h3>
            <ul class="space-y-2 text-sm">
              <li class="flex items-center gap-2">
                <Icon name="proicons:phone" class="h-5 w-5 text-[#e4c96a]" />
                <a
                  href="tel:075271150"
                  class="text-white/80 hover:text-white transition"
                >
                  0752-71150
                </a>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="proicons:email" class="h-5 w-5 text-[#e4c96a]" />
                <a
                  href="mailto:info@uinmybatusangkar.ac.id"
                  class="text-white/80 hover:text-white transition"
                >
                  info@uinmybatusangkar.ac.id
                </a>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="proicons:globe" class="h-5 w-5 text-[#e4c96a]" />
                <a
                  href="https://uinmybatusangkar.ac.id"
                  target="_blank"
                  class="text-white/80 hover:text-white transition"
                >
                  uinmybatusangkar.ac.id
                </a>
              </li>
            </ul>
          </div>

          <!-- Sosial Media -->
          <div>
            <h3 class="mb-3 text-lg font-semibold text-[#e4c96a]">
              Ikuti Kami
            </h3>
            <div class="flex space-x-4">
              <a href="https://www.facebook.com/IAINBsk?locale=id_ID" class="social-icon">
                <Icon name="mdi:facebook" class="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/uinmybatusangkar/" class="social-icon">
                <Icon name="mdi:instagram" class="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@uinmybsk" class="social-icon">
                <Icon name="mdi:youtube" class="h-5 w-5" />
              </a>
              <a href="https://twitter.com/uinmybatusangkar" class="social-icon">
                <Icon name="mdi:twitter" class="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div
        class="border-t border-white/15 py-4 text-center text-xs text-white/60"
      >
        <p>
          &copy; {{ new Date().getFullYear() }} Universitas Islam Negeri Mahmud
          Yunus Batusangkar.
          <br class="block sm:hidden" />
          All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import { useAuthStore } from "~/stores/auth";

  const authStore = useAuthStore();
  const dropdownOpen = ref(false);
  const mobileMenuOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

  const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value;
  };

  const handleLogout = async () => {
    await authStore.logout();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      dropdownOpen.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<style scoped>
  @import "tailwindcss";
  /* Nav links desktop */
  .nav-link {
    @apply text-white/70 font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all;
  }
  .nav-link:hover {
    @apply text-white bg-white/10;
  }
  .nav-link.router-link-active {
    @apply text-[#e4c96a] bg-[rgba(201,162,39,0.15)] font-semibold;
  }

  /* Mobile nav links */
  .mobile-nav-link {
    @apply block px-3 py-2 rounded-lg text-white/80 font-medium text-sm transition-all;
  }
  .mobile-nav-link:hover {
    @apply bg-white/10 text-white;
  }
  .mobile-nav-link.router-link-active {
    @apply text-[#e4c96a] bg-[rgba(201,162,39,0.12)];
  }

  /* Social icons */
  .social-icon {
    @apply rounded-full bg-white/10 p-2 inline-flex transition-all hover:bg-[rgba(201,162,39,0.5)];
  }
</style>
