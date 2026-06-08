<!-- FILE: app/pages/dashboard/ppk/detailPengajuan/[id].vue -->
<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <button
          @click="$router.back()"
          class="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Kembali
        </button>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">{{
            detail?.rab.nomorPengajuan
          }}</span>
          <div
            class="bg-[#d1a82a] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm"
          >
            STATUS: {{ detail?.rab.status.toUpperCase().replaceAll("_", " ") }}
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-10 h-10 border-4 border-slate-200 border-t-[#3b5988] rounded-full animate-spin"
        ></div>
        <p class="text-slate-500 font-medium">Memuat rincian pengajuan...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center py-32">
      <div class="text-center text-red-500">
        <Icon
          name="heroicons:exclamation-triangle"
          class="w-12 h-12 mx-auto mb-2"
        />
        <p class="font-bold">Gagal memuat data</p>
        <p class="text-sm opacity-80">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <main
      v-else-if="detail"
      class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8"
    >
      <!-- Title Section -->
      <div
        class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="px-3 py-1 bg-[#3b5988]/10 text-[#3b5988] rounded-lg text-[10px] font-black uppercase tracking-widest"
              >{{ detail.ormawa?.kode }}</span
            >
            <span class="text-slate-400 text-xs font-medium">{{
              formatDate(detail.rab.createdAt)
            }}</span>
          </div>
          <h1 class="text-3xl font-extrabold text-slate-900 leading-tight">
            {{ detail.rab.judulKegiatan }}
          </h1>
          <p class="text-slate-500 text-sm max-w-2xl">
            {{ detail.rab.deskripsi || "Tidak ada deskripsi kegiatan." }}
          </p>
        </div>
        <div
          class="bg-[#3b5988] text-white rounded-2xl p-6 min-w-[240px] flex flex-col justify-center shadow-lg shadow-[#3b5988]/20"
        >
          <p
            class="text-xs font-bold opacity-60 uppercase tracking-widest mb-1"
          >
            Total Anggaran
          </p>
          <p class="text-3xl font-black">
            {{ formatRp(detail.rab.totalAnggaran) }}
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex flex-wrap gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="activeTab = t.key"
          :class="[
            'px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
            activeTab === t.key
              ? 'bg-white text-[#3b5988] shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          ]"
        >
          <Icon :name="t.icon" class="w-5 h-5" />
          {{ t.label }}
          <span
            v-if="t.count !== undefined"
            class="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px]"
            >{{ t.count }}</span
          >
        </button>
      </div>

      <!-- TAB CONTENT: DOKUMEN (RAB & TOR) -->
      <div
        v-if="activeTab === 'dokumen'"
        class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300"
      >
        <!-- RAB Preview -->
        <div
          class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-amber-100 text-[#d1a82a] flex items-center justify-center"
              >
                <Icon name="heroicons:calculator" class="w-6 h-6" />
              </div>
              <h3 class="font-black text-slate-800">Dokumen RAB</h3>
            </div>
            <button
              @click="openFile(detail.rab.fileRabUrl)"
              class="p-2 rounded-lg hover:bg-slate-200 transition text-[#3b5988]"
            >
              <Icon
                name="heroicons:arrow-top-right-on-square"
                class="w-5 h-5"
              />
            </button>
          </div>
          <div class="flex-1 bg-slate-100 aspect-[3/4] p-4">
            <iframe
              :src="getFileUrl(detail.rab.fileRabUrl)"
              class="w-full h-full rounded-2xl border border-slate-200 shadow-inner"
              frameborder="0"
            ></iframe>
          </div>
        </div>

        <!-- TOR Preview -->
        <div
          class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
        >
          <div
            class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"
              >
                <Icon name="heroicons:document-duplicate" class="w-6 h-6" />
              </div>
              <h3 class="font-black text-slate-800">Dokumen TOR</h3>
            </div>
            <button
              @click="openFile(detail.rab.fileTorUrl)"
              class="p-2 rounded-lg hover:bg-slate-200 transition text-[#3b5988]"
            >
              <Icon
                name="heroicons:arrow-top-right-on-square"
                class="w-5 h-5"
              />
            </button>
          </div>
          <div class="flex-1 bg-slate-100 aspect-[3/4] p-4">
            <iframe
              :src="getFileUrl(detail.rab.fileTorUrl)"
              class="w-full h-full rounded-2xl border border-slate-200 shadow-inner"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>

      <!-- TAB CONTENT: DOKUMENTASI -->
      <div
        v-if="activeTab === 'dokumentasi'"
        class="animate-in slide-in-from-bottom-4 duration-300"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            v-for="doc in detail.dokumentasi"
            :key="doc.id"
            class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
          >
            <div class="aspect-square bg-slate-100 relative overflow-hidden">
              <img
                :src="getFileUrl(doc.fileUrl)"
                class="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <button
                  @click="selectedImg = doc.fileUrl"
                  class="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl"
                >
                  Zoom
                </button>
              </div>
            </div>
            <div class="p-5 space-y-3">
              <div class="flex justify-between items-start">
                <span
                  class="px-2 py-0.5 bg-amber-50 text-[#d1a82a] rounded-md text-[10px] font-black uppercase tracking-tighter"
                  >{{ doc.tipeDokumen }}</span
                >
                <span class="text-[10px] text-slate-400 font-mono">{{
                  formatDate(doc.createdAt)
                }}</span>
              </div>
              <p
                class="text-sm text-slate-700 font-medium line-clamp-2 leading-relaxed"
              >
                {{ doc.deskripsi || "Foto bukti kegiatan lapangan." }}
              </p>
              <button
                @click="selectedImg = doc.fileUrl"
                class="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase border border-slate-100 hover:bg-slate-100 transition"
              >
                Detail Foto
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="detail.dokumentasi.length === 0"
          class="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200"
        >
          <Icon
            name="heroicons:photo"
            class="w-16 h-16 mx-auto mb-4 text-slate-300"
          />
          <p class="font-bold text-slate-400">
            Belum ada dokumentasi kegiatan yang diunggah.
          </p>
        </div>
      </div>

      <!-- TAB CONTENT: TAGIHAN & PEMBAYARAN -->
      <div
        v-if="activeTab === 'tagihan'"
        class="animate-in slide-in-from-bottom-4 duration-300"
      >
        <div
          class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"
          >
            <h3 class="font-black text-slate-800">
              Daftar Tagihan & Status Pencairan
            </h3>
            <span
              class="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >{{ detail.tagihan.length }} Tagihan Terdeteksi</span
            >
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-slate-400">
                <tr>
                  <th
                    class="text-left py-4 px-6 font-black uppercase tracking-tighter"
                  >
                    Penerima Dana
                  </th>
                  <th
                    class="text-left py-4 px-6 font-black uppercase tracking-tighter"
                  >
                    Tipe Tagihan
                  </th>
                  <th
                    class="text-right py-4 px-6 font-black uppercase tracking-tighter"
                  >
                    Nominal
                  </th>
                  <th
                    class="text-center py-4 px-6 font-black uppercase tracking-tighter"
                  >
                    Status
                  </th>
                  <th
                    class="text-center py-4 px-6 font-black uppercase tracking-tighter"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="t in detail.tagihan"
                  :key="t.id"
                  class="hover:bg-slate-50/50 transition"
                >
                  <td class="py-5 px-6">
                    <p class="font-black text-slate-800">
                      {{ t.namaPenerima }}
                    </p>
                    <p class="text-[11px] text-slate-500 font-bold uppercase">
                      {{ t.bankPenerima }} • {{ t.rekeningPenerima }}
                    </p>
                  </td>
                  <td class="py-5 px-6">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-black uppercase',
                        t.tipeTagihan === 'BARANG'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-emerald-50 text-emerald-600',
                      ]"
                    >
                      {{ t.tipeTagihan }}
                    </span>
                    <p class="text-slate-700 mt-1 font-medium">
                      {{
                        t.tipeTagihan === "BARANG"
                          ? t.tokoNama
                          : t.skNomor || "Biaya Jasa/Honor"
                      }}
                    </p>
                  </td>
                  <td
                    class="py-5 px-6 text-right font-black text-slate-900 text-base"
                  >
                    {{ formatRp(t.nominal) }}
                  </td>
                  <td class="py-5 px-6 text-center">
                    <div class="flex flex-col items-center gap-1.5">
                      <span
                        :class="[
                          'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                          tagihanStatusClass(t.statusTagihan),
                        ]"
                      >
                        {{ t.statusTagihan.replaceAll("_", " ") }}
                      </span>
                      <p
                        v-if="t.infoPembayaran"
                        class="text-[9px] text-slate-400 font-bold italic"
                      >
                        Oleh: {{ t.infoPembayaran.ppkNama }}
                      </p>
                    </div>
                  </td>
                  <td class="py-5 px-6 text-center">
                    <button
                      @click="selectedTagihan = t"
                      class="px-5 py-2 bg-[#3b5988] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2d4570] transition shadow-md shadow-[#3b5988]/10"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="detail.tagihan.length === 0"
            class="py-20 text-center text-slate-400 font-medium"
          >
            <Icon
              name="heroicons:banknotes"
              class="w-12 h-12 mx-auto mb-2 opacity-20"
            />
            <p>Belum ada rincian tagihan yang diajukan ormawa.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Image Zoom -->
    <div
      v-if="selectedImg"
      class="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6"
      @click="selectedImg = ''"
    >
      <img
        :src="
          selectedImg.startsWith('http') || selectedImg.startsWith('/')
            ? selectedImg
            : getFileUrl(selectedImg)
        "
        class="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
      />
      <button
        class="absolute top-8 right-8 text-white hover:scale-110 transition"
      >
        <Icon name="heroicons:x-mark" class="w-12 h-12" />
      </button>
    </div>

    <!-- Modal Tagihan Detail -->
    <div
      v-if="selectedTagihan"
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-8"
      @click.self="selectedTagihan = null"
    >
      <div
        class="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
      >
        <div class="p-8 lg:p-12 space-y-10">
          <div
            class="flex justify-between items-start border-b border-slate-100 pb-8"
          >
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span
                  class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >{{ selectedTagihan.tipeTagihan }}</span
                >
                <span
                  :class="[
                    'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest',
                    tagihanStatusClass(selectedTagihan.statusTagihan),
                  ]"
                  >{{ selectedTagihan.statusTagihan }}</span
                >
              </div>
              <h3 class="text-3xl font-black text-slate-900">
                Rincian Tagihan & Bukti
              </h3>
              <p class="text-slate-500 font-medium">
                Informasi pembayaran dana kegiatan ormawa
              </p>
            </div>
            <button
              @click="selectedTagihan = null"
              class="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <Icon name="heroicons:x-mark" class="w-10 h-10 text-slate-300" />
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <!-- COL 1: Data Dasar -->
            <div class="space-y-8">
              <div class="space-y-4">
                <h4
                  class="flex items-center gap-2 font-black text-slate-900 uppercase text-xs tracking-widest"
                >
                  <Icon name="heroicons:user" class="w-4 h-4 text-[#d1a82a]" />
                  Data Penerima
                </h4>
                <div
                  class="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4"
                >
                  <div>
                    <p
                      class="text-slate-400 text-[10px] font-black uppercase mb-1"
                    >
                      Nama Lengkap
                    </p>
                    <p class="font-black text-slate-800 text-lg">
                      {{ selectedTagihan.namaPenerima }}
                    </p>
                  </div>
                  <div class="pt-4 border-t border-slate-200/60">
                    <p
                      class="text-slate-400 text-[10px] font-black uppercase mb-1"
                    >
                      Bank & No. Rekening
                    </p>
                    <p class="font-bold text-slate-800 uppercase">
                      {{ selectedTagihan.bankPenerima }}
                    </p>
                    <p class="font-black text-[#3b5988] text-xl tracking-tight">
                      {{ selectedTagihan.rekeningPenerima }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h4
                  class="flex items-center gap-2 font-black text-slate-900 uppercase text-xs tracking-widest"
                >
                  <Icon
                    name="heroicons:shopping-cart"
                    class="w-4 h-4 text-[#d1a82a]"
                  />
                  Rincian Transaksi
                </h4>
                <div
                  class="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 text-sm font-medium"
                >
                  <div v-if="selectedTagihan.tipeTagihan === 'BARANG'">
                    <p
                      class="text-slate-400 text-[10px] font-black uppercase mb-1"
                    >
                      Nama Toko
                    </p>
                    <p class="font-bold text-slate-800 text-base">
                      {{ selectedTagihan.tokoNama }}
                    </p>
                    <p class="text-slate-500 mt-1 leading-relaxed">
                      {{ selectedTagihan.tokoAlamat }}
                    </p>
                  </div>
                  <div v-else>
                    <p
                      class="text-slate-400 text-[10px] font-black uppercase mb-1"
                    >
                      Nomor SK / Dasar Pembayaran
                    </p>
                    <p class="font-bold text-slate-800 text-base">
                      {{ selectedTagihan.skNomor || "Pemberian Jasa/Honor" }}
                    </p>
                    <div class="mt-3 space-y-1">
                      <p
                        v-if="selectedTagihan.npwpNomor"
                        class="text-xs text-slate-500 font-bold uppercase tracking-tighter"
                      >
                        NPWP: {{ selectedTagihan.npwpNomor }}
                      </p>
                      <p
                        v-if="selectedTagihan.ktpNomor"
                        class="text-xs text-slate-500 font-bold uppercase tracking-tighter"
                      >
                        KTP: {{ selectedTagihan.ktpNomor }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- COL 2: Lampiran Ormawa -->
            <div class="space-y-4">
              <h4
                class="flex items-center gap-2 font-black text-slate-900 uppercase text-xs tracking-widest"
              >
                <Icon
                  name="heroicons:paper-clip"
                  class="w-4 h-4 text-[#d1a82a]"
                />
                Lampiran Ormawa
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Struk/Nota -->
                <div v-if="selectedTagihan.strukFileUrl" class="space-y-2">
                  <p
                    class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                  >
                    Nota / Struk
                  </p>
                  <div
                    class="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 cursor-pointer shadow-sm hover:border-[#d1a82a] transition"
                    @click="selectedImg = selectedTagihan.strukFileUrl"
                  >
                    <img
                      :src="getFileUrl(selectedTagihan.strukFileUrl)"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <!-- Foto Barang -->
                <div v-if="selectedTagihan.fotoBarangUrl" class="space-y-2">
                  <p
                    class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                  >
                    Bukti Barang
                  </p>
                  <div
                    class="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 cursor-pointer shadow-sm hover:border-[#d1a82a] transition"
                    @click="selectedImg = selectedTagihan.fotoBarangUrl"
                  >
                    <img
                      :src="getFileUrl(selectedTagihan.fotoBarangUrl)"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <!-- Buku Rekening (Jasa) -->
                <div
                  v-if="selectedTagihan.bukuRekeningFileUrl"
                  class="space-y-2 col-span-full"
                >
                  <p
                    class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                  >
                    Buku Rekening Penerima
                  </p>
                  <div
                    class="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 cursor-pointer shadow-sm hover:border-[#d1a82a] transition"
                    @click="selectedImg = selectedTagihan.bukuRekeningFileUrl"
                  >
                    <img
                      :src="getFileUrl(selectedTagihan.bukuRekeningFileUrl)"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <!-- SK (Jasa) -->
                <div
                  v-if="selectedTagihan.skFileUrl"
                  class="space-y-2 col-span-full"
                >
                  <p
                    class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                  >
                    Dokumen SK / Pendukung
                  </p>
                  <button
                    @click="openFile(selectedTagihan.skFileUrl)"
                    class="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[#3b5988] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition"
                  >
                    <Icon name="heroicons:document-text" class="w-6 h-6" />
                    Lihat Dokumen
                  </button>
                </div>
              </div>
            </div>

            <!-- COL 3: BUKTI PEMBAYARAN PPK -->
            <div class="space-y-4">
              <h4
                class="flex items-center gap-2 font-black text-slate-900 uppercase text-xs tracking-widest"
              >
                <Icon
                  name="heroicons:check-badge"
                  class="w-4 h-4 text-[#d1a82a]"
                />
                Konfirmasi PPK
              </h4>

              <div
                v-if="selectedTagihan.infoPembayaran"
                class="bg-[#3b5988] text-white p-8 rounded-[2rem] space-y-6 shadow-xl shadow-[#3b5988]/20"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Icon name="heroicons:banknotes" class="w-7 h-7" />
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-black uppercase opacity-60 tracking-wider"
                    >
                      Status Dana
                    </p>
                    <p class="text-lg font-black uppercase tracking-tighter">
                      TELAH DICAIRKAN
                    </p>
                  </div>
                </div>

                <div class="space-y-4 text-sm font-medium">
                  <div
                    class="flex justify-between items-center pb-3 border-b border-white/10"
                  >
                    <span class="opacity-60 text-xs">PPK Pemroses</span>
                    <span class="font-black">{{
                      selectedTagihan.infoPembayaran.ppkNama
                    }}</span>
                  </div>
                  <div
                    class="flex justify-between items-center pb-3 border-b border-white/10"
                  >
                    <span class="opacity-60 text-xs">Tanggal Transaksi</span>
                    <span class="font-black">{{
                      formatDate(selectedTagihan.infoPembayaran.tanggal)
                    }}</span>
                  </div>
                </div>

                <div class="space-y-3">
                  <p
                    class="text-[10px] font-black uppercase opacity-60 tracking-wider"
                  >
                    Bukti Transfer Asli
                  </p>
                  <div
                    class="aspect-video rounded-2xl overflow-hidden border-2 border-white/20 cursor-pointer relative group bg-black/20"
                    @click="
                      selectedImg = selectedTagihan.infoPembayaran.buktiUrl
                    "
                  >
                    <img
                      :src="selectedTagihan.infoPembayaran.buktiUrl"
                      class="w-full h-full object-cover"
                    />
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Icon
                        name="heroicons:magnifying-glass-plus"
                        class="w-10 h-10"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="selectedTagihan.infoPembayaran.catatan"
                  class="p-4 bg-white/5 rounded-2xl text-xs font-medium border border-white/5 italic opacity-80"
                >
                  "{{ selectedTagihan.infoPembayaran.catatan }}"
                </div>
              </div>

              <div
                v-else
                class="h-[400px] flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400"
              >
                <Icon
                  name="heroicons:clock"
                  class="w-16 h-16 mb-4 opacity-10"
                />
                <p
                  class="text-xs font-black uppercase tracking-[0.2em] text-center leading-loose"
                >
                  Menunggu<br />Proses Pencairan<br />Oleh Bendahara / PPK
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { usePpkDetailStore } from "~/stores/ppk/DetailPengajuan";
  import { storeToRefs } from "pinia";

  const route = useRoute();
  const id = route.params.id as string;
  const store = usePpkDetailStore();

  const { detail, loading, error } = storeToRefs(store);
  const { fetchFullData, getFileUrl } = store;

  const activeTab = ref("tagihan"); // Fokus utama ke tagihan/pencairan
  const selectedImg = ref("");
  const selectedTagihan = ref<any>(null);

  const tabs = computed(() => [
    {
      key: "tagihan",
      label: "Pencairan & Pembayaran",
      icon: "heroicons:banknotes",
      count: detail.value?.tagihan.length,
    },
    {
      key: "dokumen",
      label: "Berkas RAB/TOR",
      icon: "heroicons:document-text",
    },
    {
      key: "dokumentasi",
      label: "Dokumentasi Lapangan",
      icon: "heroicons:photo",
      count: detail.value?.dokumentasi.length,
    },
  ]);

  const formatRp = (n?: number | string) =>
    "Rp " +
    new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
      Number(n) || 0,
    );

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  const tagihanStatusClass = (status: string) => {
    switch (status) {
      case "SELESAI":
        return "bg-emerald-500 text-white shadow-sm";
      case "WAITING_PEMBAYARAN":
        return "bg-amber-100 text-amber-700";
      case "TERVERIFIKASI":
        return "bg-blue-100 text-blue-700";
      case "DITOLAK":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const openFile = (path: string) => {
    if (path) window.open(getFileUrl(path), "_blank");
  };

  onMounted(() => {
    if (id) fetchFullData(id);
  });
</script>

<style scoped>
  .animate-in {
    animation-duration: 0.3s;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
