import { create } from "zustand"
import { persist } from "zustand/middleware"
import { qtyBisaBayar, qtyBisaTagih, sisaKasbon, sisaPotongan } from "@/lib/calc"
import { jakartaToday, nextNo, teks, uid } from "@/lib/format"
import { buatContoh, dataKosong } from "@/lib/seed"
import type {
  ArusKas,
  DataSlice,
  JenisKas,
  ModelHijab,
  Pabrik,
  Pekerjaan,
  Penjahit,
  Pengambilan,
  Result,
  SlipItem,
  TagihanItem,
} from "@/lib/types"

export type BukuState = DataSlice & {
  ambilPotongan: (input: {
    id?: string
    tanggal: string
    pabrikId: string
    modelId: string
    qty: number
    hargaPerPcs: number
    catatan: string
  }) => Result
  bagiKerja: (input: {
    pengambilanId: string
    penjahitId: string
    tanggal: string
    qty: number
    upahPerPcs: number
    catatan: string
  }) => Result
  ubahKerja: (
    id: string,
    input: {
      penjahitId: string
      tanggalBagi: string
      qty: number
      upahPerPcs: number
      qtySelesai: number
      qtyRusak: number
      tanggalSelesai: string
      qtySetor: number
      tanggalSetor: string
      catatan: string
    },
  ) => Result
  hapusPengambilan: (id: string) => Result
  hapusKerja: (id: string) => Result
  buatTagihan: (input: {
    pabrikId: string
    tanggal: string
    catatan: string
    lines: { pekerjaanId: string; qty: number }[]
  }) => Result
  hapusTagihan: (id: string) => Result
  terimaPabrik: (input: {
    pabrikId: string
    tanggal: string
    jumlah: number
    jenis: "terima_pabrik" | "muka_pabrik"
    tagihanId: string
    catatan: string
  }) => Result
  bayarUpah: (input: {
    penjahitId: string
    tanggal: string
    catatan: string
    potongKasbon: number
    lines: { pekerjaanId: string; qty: number }[]
  }) => Result
  kasihKasbon: (input: { penjahitId: string; tanggal: string; jumlah: number; catatan: string }) => Result
  uangPribadi: (input: { tanggal: string; jumlah: number; catatan: string; jenis: "modal" | "tarik" }) => Result
  hapusKas: (id: string) => Result
  hapusSlip: (id: string) => Result
  simpanPabrik: (input: Omit<Pabrik, "id"> & { id?: string }) => Result
  simpanPenjahit: (input: Omit<Penjahit, "id"> & { id?: string }) => Result
  simpanModel: (input: Omit<ModelHijab, "id"> & { id?: string }) => Result
  hapusPabrik: (id: string) => Result
  hapusPenjahit: (id: string) => Result
  hapusModel: (id: string) => Result
  simpanProfil: (profil: DataSlice["profil"]) => Result
  kosongkan: () => void
  muatContoh: () => void
  pakaiData: () => void
  impor: (raw: unknown) => Result
}

function fail(error: string): Result {
  return { ok: false, error }
}

function ok(id?: string): Result {
  return { ok: true, id }
}

function tanggalOk(t: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(t)
}

function num(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

const KEYS: (keyof DataSlice)[] = [
  "profil",
  "pabrik",
  "penjahit",
  "model",
  "pengambilan",
  "pekerjaan",
  "tagihan",
  "slip",
  "kas",
  "contoh",
  "seq",
]

function numField(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

function parseData(raw: unknown): DataSlice | null {
  if (!raw || typeof raw !== "object") return null
  const wrapped = raw as { state?: unknown }
  const src = wrapped.state && typeof wrapped.state === "object" ? wrapped.state : raw
  if (!src || typeof src !== "object") return null
  const o = src as Partial<DataSlice>
  if (!Array.isArray(o.pabrik) || !Array.isArray(o.penjahit) || !Array.isArray(o.pengambilan)) return null
  if (!Array.isArray(o.pekerjaan) || !Array.isArray(o.tagihan) || !Array.isArray(o.slip) || !Array.isArray(o.kas)) {
    return null
  }
  if (!o.profil || typeof o.profil !== "object" || !o.seq) return null
  const kosong = dataKosong()
  const pekerjaan = (o.pekerjaan as Pekerjaan[]).map((k) => ({
    ...k,
    qty: numField(k.qty),
    upahPerPcs: numField(k.upahPerPcs),
    qtySelesai: numField(k.qtySelesai),
    qtyRusak: numField(k.qtyRusak),
    qtySetor: numField(k.qtySetor),
    qtyTertagih: numField(k.qtyTertagih),
    qtyTerbayar: numField(k.qtyTerbayar),
    tanggalSelesai: k.tanggalSelesai ?? "",
    tanggalSetor: k.tanggalSetor ?? "",
    catatan: k.catatan ?? "",
  }))
  return {
    profil: {
      nama: o.profil.nama || kosong.profil.nama,
      pemilik: o.profil.pemilik ?? "",
      telepon: o.profil.telepon ?? "",
      alamat: o.profil.alamat ?? "",
      hariBayar: Number.isFinite(o.profil.hariBayar) ? o.profil.hariBayar : 6,
    },
    pabrik: o.pabrik as Pabrik[],
    penjahit: o.penjahit as Penjahit[],
    model: (o.model as ModelHijab[]) ?? [],
    pengambilan: (o.pengambilan as Pengambilan[]).map((p) => ({
      ...p,
      qty: numField(p.qty),
      hargaPerPcs: numField(p.hargaPerPcs),
      catatan: p.catatan ?? "",
    })),
    pekerjaan,
    tagihan: o.tagihan,
    slip: o.slip,
    kas: o.kas as ArusKas[],
    contoh: Boolean(o.contoh),
    seq: {
      amb: numField(o.seq.amb, 1),
      krj: numField(o.seq.krj, 1),
      inv: numField(o.seq.inv, 1),
      slp: numField(o.seq.slp, 1),
      kas: numField(o.seq.kas, 1),
    },
  }
}

export function ambilData(s: BukuState): DataSlice {
  const out = {} as DataSlice
  for (const key of KEYS) {
    Object.assign(out, { [key]: s[key] })
  }
  return out
}

export const useBuku = create<BukuState>()(
  persist(
    (set, get) => ({
      ...buatContoh(),

      ambilPotongan: (input) => {
        const s = get()
        if (!s.pabrik.some((p) => p.id === input.pabrikId)) return fail("Pilih pabrik.")
        if (!s.model.some((m) => m.id === input.modelId)) return fail("Pilih model.")
        const qty = num(input.qty)
        const harga = num(input.hargaPerPcs)
        if (qty < 1) return fail("Qty minimal 1.")
        if (qty > 100000) return fail("Qty terlalu besar.")
        if (harga < 0 || harga > 100000000) return fail("Harga tidak valid.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        if (input.id) {
          const lama = s.pengambilan.find((p) => p.id === input.id)
          if (!lama) return fail("Pengambilan tidak ditemukan.")
          const bagi = s.pekerjaan.filter((k) => k.pengambilanId === lama.id).reduce((a, k) => a + k.qty, 0)
          if (qty < bagi) return fail(`Qty tidak boleh di bawah yang sudah dibagi (${bagi} pcs).`)
          const sudahTagih = s.pekerjaan.some((k) => k.pengambilanId === lama.id && k.qtyTertagih > 0)
          if (sudahTagih && harga !== lama.hargaPerPcs) return fail("Harga sudah dipakai di tagihan, tidak diubah.")
          const adaKerja = bagi > 0
          set({
            pengambilan: s.pengambilan.map((p) =>
              p.id === lama.id
                ? {
                    ...p,
                    tanggal,
                    qty,
                    hargaPerPcs: harga,
                    catatan: teks(input.catatan),
                    pabrikId: adaKerja ? p.pabrikId : input.pabrikId,
                    modelId: adaKerja ? p.modelId : input.modelId,
                  }
                : p,
            ),
          })
          return ok(lama.id)
        }
        const id = uid("amb")
        const row: Pengambilan = {
          id,
          nomor: nextNo("AMB", s.seq.amb),
          tanggal,
          pabrikId: input.pabrikId,
          modelId: input.modelId,
          qty,
          hargaPerPcs: harga,
          catatan: teks(input.catatan),
        }
        set({ pengambilan: [row, ...s.pengambilan], seq: { ...s.seq, amb: s.seq.amb + 1 } })
        return ok(id)
      },

      bagiKerja: (input) => {
        const s = get()
        const amb = s.pengambilan.find((p) => p.id === input.pengambilanId)
        if (!amb) return fail("Pilih potongan yang diambil.")
        if (!s.penjahit.some((p) => p.id === input.penjahitId)) return fail("Pilih penjahit.")
        const qty = num(input.qty)
        const upah = num(input.upahPerPcs)
        const sisa = sisaPotongan(amb, s.pekerjaan)
        if (qty < 1) return fail("Qty minimal 1.")
        if (qty > sisa) return fail(`Sisa yang belum dibagi hanya ${sisa} pcs.`)
        if (upah < 0) return fail("Upah tidak valid.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        const id = uid("krj")
        const row: Pekerjaan = {
          id,
          nomor: nextNo("KRJ", s.seq.krj),
          pengambilanId: amb.id,
          penjahitId: input.penjahitId,
          tanggalBagi: tanggal,
          qty,
          upahPerPcs: upah,
          qtySelesai: 0,
          qtyRusak: 0,
          tanggalSelesai: "",
          qtySetor: 0,
          tanggalSetor: "",
          qtyTertagih: 0,
          qtyTerbayar: 0,
          catatan: teks(input.catatan),
        }
        set({ pekerjaan: [row, ...s.pekerjaan], seq: { ...s.seq, krj: s.seq.krj + 1 } })
        return ok(id)
      },

      ubahKerja: (id, input) => {
        const s = get()
        const k = s.pekerjaan.find((x) => x.id === id)
        if (!k) return fail("Pekerjaan tidak ditemukan.")
        const amb = s.pengambilan.find((p) => p.id === k.pengambilanId)
        if (!amb) return fail("Potongan asalnya tidak ketemu.")
        if (!s.penjahit.some((p) => p.id === input.penjahitId)) return fail("Pilih penjahit.")
        if (k.qtyTerbayar > 0 && input.penjahitId !== k.penjahitId) {
          return fail("Penjahit tidak bisa diganti karena upahnya sudah masuk slip.")
        }
        const qty = num(input.qty)
        const upah = num(input.upahPerPcs)
        const qtySelesai = num(input.qtySelesai)
        const qtyRusak = num(input.qtyRusak)
        const qtySetor = num(input.qtySetor)
        if (qty < 1) return fail("Qty minimal 1.")
        const lain = s.pekerjaan.filter((x) => x.pengambilanId === amb.id && x.id !== k.id).reduce((a, x) => a + x.qty, 0)
        if (lain + qty > amb.qty) return fail(`Maksimal ${amb.qty - lain} pcs dari potongan ini.`)
        if (qtySelesai < 0 || qtyRusak < 0 || qtySetor < 0) return fail("Angka tidak boleh minus.")
        if (qtySelesai + qtyRusak > qty) return fail("Bagus + rusak tidak boleh lebih dari qty yang dipegang.")
        if (qtySetor > qtySelesai) return fail("Yang disetor tidak boleh lebih dari yang bagus.")
        if (qtySetor < k.qtyTertagih) return fail(`Sudah ditagih ${k.qtyTertagih} pcs. Setoran tidak boleh di bawah itu.`)
        if (qtySelesai < k.qtyTerbayar) return fail(`Sudah dibayar ${k.qtyTerbayar} pcs. Hasil bagus tidak boleh di bawah itu.`)
        if (k.qtyTerbayar > 0 && upah !== k.upahPerPcs) return fail("Upah sudah masuk slip, tidak diubah.")
        if (!tanggalOk(input.tanggalBagi)) return fail("Tanggal bagi tidak valid.")
        const tanggalSelesai = qtySelesai + qtyRusak > 0 ? input.tanggalSelesai || jakartaToday() : ""
        const tanggalSetor = qtySetor > 0 ? input.tanggalSetor || jakartaToday() : ""
        if (tanggalSelesai && !tanggalOk(tanggalSelesai)) return fail("Tanggal selesai tidak valid.")
        if (tanggalSetor && !tanggalOk(tanggalSetor)) return fail("Tanggal setor tidak valid.")
        set({
          pekerjaan: s.pekerjaan.map((x) =>
            x.id === id
              ? {
                  ...x,
                  penjahitId: input.penjahitId,
                  tanggalBagi: input.tanggalBagi,
                  qty,
                  upahPerPcs: upah,
                  qtySelesai,
                  qtyRusak,
                  tanggalSelesai,
                  qtySetor,
                  tanggalSetor,
                  catatan: teks(input.catatan),
                }
              : x,
          ),
        })
        return ok(id)
      },

      hapusPengambilan: (id) => {
        const s = get()
        if (s.pekerjaan.some((k) => k.pengambilanId === id)) {
          return fail("Sudah dibagi ke penjahit. Hapus pekerjaannya dulu.")
        }
        set({ pengambilan: s.pengambilan.filter((p) => p.id !== id) })
        return ok()
      },

      hapusKerja: (id) => {
        const s = get()
        const k = s.pekerjaan.find((x) => x.id === id)
        if (!k) return fail("Pekerjaan tidak ditemukan.")
        if (k.qtyTertagih > 0) return fail("Sudah masuk tagihan. Hapus tagihannya dulu.")
        if (k.qtyTerbayar > 0) return fail("Sudah masuk slip upah. Hapus slipnya dulu.")
        set({ pekerjaan: s.pekerjaan.filter((x) => x.id !== id) })
        return ok()
      },

      buatTagihan: (input) => {
        const s = get()
        if (!s.pabrik.some((p) => p.id === input.pabrikId)) return fail("Pilih pabrik.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        const lines = input.lines.map((l) => ({ ...l, qty: num(l.qty) })).filter((l) => l.qty > 0)
        if (lines.length === 0) return fail("Pilih barang yang ditagih.")
        const items: TagihanItem[] = []
        for (const line of lines) {
          const k = s.pekerjaan.find((x) => x.id === line.pekerjaanId)
          if (!k) return fail("Pekerjaan tidak ditemukan.")
          const amb = s.pengambilan.find((p) => p.id === k.pengambilanId)
          if (!amb || amb.pabrikId !== input.pabrikId) return fail("Pekerjaan ini bukan milik pabrik yang dipilih.")
          if (line.qty > qtyBisaTagih(k)) return fail(`${k.nomor} hanya bisa ditagih ${qtyBisaTagih(k)} pcs.`)
          const model = s.model.find((m) => m.id === amb.modelId)
          items.push({
            pekerjaanId: k.id,
            modelNama: model?.nama ?? "Potongan",
            qty: line.qty,
            hargaPerPcs: amb.hargaPerPcs,
          })
        }
        const id = uid("inv")
        let pekerjaan = s.pekerjaan
        for (const item of items) {
          pekerjaan = pekerjaan.map((k) =>
            k.id === item.pekerjaanId ? { ...k, qtyTertagih: k.qtyTertagih + item.qty } : k,
          )
        }
        set({
          pekerjaan,
          tagihan: [
            {
              id,
              nomor: nextNo("INV", s.seq.inv),
              tanggal,
              pabrikId: input.pabrikId,
              items,
              catatan: teks(input.catatan),
            },
            ...s.tagihan,
          ],
          seq: { ...s.seq, inv: s.seq.inv + 1 },
        })
        return ok(id)
      },

      hapusTagihan: (id) => {
        const s = get()
        const t = s.tagihan.find((x) => x.id === id)
        if (!t) return fail("Tagihan tidak ditemukan.")
        if (s.kas.some((k) => k.tagihanId === id)) {
          return fail("Masih ada uang masuk yang dikaitkan ke tagihan ini. Hapus pembayaran itu dulu.")
        }
        let pekerjaan = s.pekerjaan
        for (const item of t.items) {
          pekerjaan = pekerjaan.map((k) =>
            k.id === item.pekerjaanId ? { ...k, qtyTertagih: Math.max(0, k.qtyTertagih - item.qty) } : k,
          )
        }
        set({ pekerjaan, tagihan: s.tagihan.filter((x) => x.id !== id) })
        return ok()
      },

      terimaPabrik: (input) => {
        const s = get()
        if (!s.pabrik.some((p) => p.id === input.pabrikId)) return fail("Pilih pabrik.")
        const jumlah = num(input.jumlah)
        if (jumlah < 1) return fail("Jumlah minimal Rp 1.")
        if (jumlah > 1_000_000_000_000) return fail("Jumlah terlalu besar.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        let tagihanId = ""
        if (input.jenis === "terima_pabrik" && input.tagihanId) {
          const t = s.tagihan.find((x) => x.id === input.tagihanId)
          if (!t || t.pabrikId !== input.pabrikId) return fail("Tagihan tidak cocok dengan pabrik.")
          tagihanId = t.id
        }
        const id = uid("kas")
        const row: ArusKas = {
          id,
          nomor: nextNo("KAS", s.seq.kas),
          tanggal,
          jenis: input.jenis,
          jumlah,
          pabrikId: input.pabrikId,
          penjahitId: "",
          tagihanId,
          slipId: "",
          catatan: teks(input.catatan),
        }
        set({ kas: [row, ...s.kas], seq: { ...s.seq, kas: s.seq.kas + 1 } })
        return ok(id)
      },

      bayarUpah: (input) => {
        const s = get()
        if (!s.penjahit.some((p) => p.id === input.penjahitId)) return fail("Pilih penjahit.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        const lines = input.lines.map((l) => ({ ...l, qty: num(l.qty) })).filter((l) => l.qty > 0)
        if (lines.length === 0) return fail("Pilih upah yang dibayar.")
        const items: SlipItem[] = []
        for (const line of lines) {
          const k = s.pekerjaan.find((x) => x.id === line.pekerjaanId)
          if (!k || k.penjahitId !== input.penjahitId) return fail("Ada pekerjaan yang bukan milik penjahit ini.")
          if (line.qty > qtyBisaBayar(k)) return fail(`${k.nomor} hanya bisa dibayar ${qtyBisaBayar(k)} pcs.`)
          const amb = s.pengambilan.find((p) => p.id === k.pengambilanId)
          const model = s.model.find((m) => m.id === amb?.modelId)
          items.push({
            pekerjaanId: k.id,
            modelNama: model?.nama ?? "Potongan",
            qty: line.qty,
            upahPerPcs: k.upahPerPcs,
          })
        }
        const bruto = items.reduce((a, i) => a + i.qty * i.upahPerPcs, 0)
        const potong = num(input.potongKasbon)
        const kasbon = sisaKasbon(input.penjahitId, s.kas, s.slip)
        if (potong < 0) return fail("Potongan kasbon tidak valid.")
        if (potong > kasbon) return fail(`Sisa kasbon hanya Rp ${kasbon.toLocaleString("id-ID")}.`)
        if (potong > bruto) return fail("Potongan kasbon tidak boleh lebih dari upah.")
        const tunai = bruto - potong
        const slipId = uid("slp")
        let pekerjaan = s.pekerjaan
        for (const item of items) {
          pekerjaan = pekerjaan.map((k) =>
            k.id === item.pekerjaanId ? { ...k, qtyTerbayar: k.qtyTerbayar + item.qty } : k,
          )
        }
        const kas = [...s.kas]
        let seqKas = s.seq.kas
        if (tunai > 0) {
          kas.unshift({
            id: uid("kas"),
            nomor: nextNo("KAS", seqKas),
            tanggal,
            jenis: "bayar_upah" as JenisKas,
            jumlah: tunai,
            pabrikId: "",
            penjahitId: input.penjahitId,
            tagihanId: "",
            slipId,
            catatan: teks(input.catatan) || "Bayar upah",
          })
          seqKas += 1
        }
        set({
          pekerjaan,
          kas,
          slip: [
            {
              id: slipId,
              nomor: nextNo("SLP", s.seq.slp),
              tanggal,
              penjahitId: input.penjahitId,
              items,
              potongKasbon: potong,
              catatan: teks(input.catatan),
            },
            ...s.slip,
          ],
          seq: { ...s.seq, slp: s.seq.slp + 1, kas: seqKas },
        })
        return ok(slipId)
      },

      kasihKasbon: (input) => {
        const s = get()
        if (!s.penjahit.some((p) => p.id === input.penjahitId)) return fail("Pilih penjahit.")
        const jumlah = num(input.jumlah)
        if (jumlah < 1) return fail("Jumlah minimal Rp 1.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        const id = uid("kas")
        const row: ArusKas = {
          id,
          nomor: nextNo("KAS", s.seq.kas),
          tanggal,
          jenis: "kasbon_penjahit",
          jumlah,
          pabrikId: "",
          penjahitId: input.penjahitId,
          tagihanId: "",
          slipId: "",
          catatan: teks(input.catatan),
        }
        set({ kas: [row, ...s.kas], seq: { ...s.seq, kas: s.seq.kas + 1 } })
        return ok(id)
      },

      uangPribadi: (input) => {
        const s = get()
        const jumlah = num(input.jumlah)
        if (jumlah < 1) return fail("Jumlah minimal Rp 1.")
        const tanggal = input.tanggal || jakartaToday()
        if (!tanggalOk(tanggal)) return fail("Tanggal tidak valid.")
        const id = uid("kas")
        const row: ArusKas = {
          id,
          nomor: nextNo("KAS", s.seq.kas),
          tanggal,
          jenis: input.jenis,
          jumlah,
          pabrikId: "",
          penjahitId: "",
          tagihanId: "",
          slipId: "",
          catatan: teks(input.catatan),
        }
        set({ kas: [row, ...s.kas], seq: { ...s.seq, kas: s.seq.kas + 1 } })
        return ok(id)
      },

      hapusKas: (id) => {
        const s = get()
        const row = s.kas.find((k) => k.id === id)
        if (!row) return fail("Catatan kas tidak ditemukan.")
        if (row.slipId) return fail("Ini bagian dari slip upah. Hapus slipnya supaya upahnya terbuka lagi.")
        if (row.jenis === "kasbon_penjahit") {
          const sisa = sisaKasbon(row.penjahitId, s.kas.filter((k) => k.id !== id), s.slip)
          if (sisa < 0) return fail("Kasbon ini sudah dipotong di slip upah.")
        }
        set({ kas: s.kas.filter((k) => k.id !== id) })
        return ok()
      },

      hapusSlip: (id) => {
        const s = get()
        const slip = s.slip.find((x) => x.id === id)
        if (!slip) return fail("Slip tidak ditemukan.")
        let pekerjaan = s.pekerjaan
        for (const item of slip.items) {
          pekerjaan = pekerjaan.map((k) =>
            k.id === item.pekerjaanId ? { ...k, qtyTerbayar: Math.max(0, k.qtyTerbayar - item.qty) } : k,
          )
        }
        set({
          pekerjaan,
          slip: s.slip.filter((x) => x.id !== id),
          kas: s.kas.filter((k) => k.slipId !== id),
        })
        return ok()
      },

      simpanPabrik: (input) => {
        const nama = teks(input.nama, 80)
        if (!nama) return fail("Nama pabrik wajib diisi.")
        const s = get()
        if (input.id) {
          if (!s.pabrik.some((p) => p.id === input.id)) return fail("Pabrik tidak ditemukan.")
          set({
            pabrik: s.pabrik.map((p) =>
              p.id === input.id
                ? { ...p, nama, telepon: teks(input.telepon, 40), alamat: teks(input.alamat, 160), catatan: teks(input.catatan) }
                : p,
            ),
          })
          return ok(input.id)
        }
        const id = uid("pb")
        set({
          pabrik: [
            { id, nama, telepon: teks(input.telepon, 40), alamat: teks(input.alamat, 160), catatan: teks(input.catatan) },
            ...s.pabrik,
          ],
        })
        return ok(id)
      },

      simpanPenjahit: (input) => {
        const nama = teks(input.nama, 80)
        if (!nama) return fail("Nama penjahit wajib diisi.")
        const s = get()
        if (input.id) {
          if (!s.penjahit.some((p) => p.id === input.id)) return fail("Penjahit tidak ditemukan.")
          set({
            penjahit: s.penjahit.map((p) =>
              p.id === input.id
                ? { ...p, nama, telepon: teks(input.telepon, 40), alamat: teks(input.alamat, 160), catatan: teks(input.catatan) }
                : p,
            ),
          })
          return ok(input.id)
        }
        const id = uid("pj")
        set({
          penjahit: [
            { id, nama, telepon: teks(input.telepon, 40), alamat: teks(input.alamat, 160), catatan: teks(input.catatan) },
            ...s.penjahit,
          ],
        })
        return ok(id)
      },

      simpanModel: (input) => {
        const nama = teks(input.nama, 80)
        if (!nama) return fail("Nama model wajib diisi.")
        const harga = num(input.hargaPabrik)
        const upah = num(input.upahJahit)
        if (harga < 0 || upah < 0) return fail("Harga atau upah tidak valid.")
        const s = get()
        if (input.id) {
          if (!s.model.some((m) => m.id === input.id)) return fail("Model tidak ditemukan.")
          set({
            model: s.model.map((m) => (m.id === input.id ? { ...m, nama, hargaPabrik: harga, upahJahit: upah } : m)),
          })
          return ok(input.id)
        }
        const id = uid("md")
        set({ model: [...s.model, { id, nama, hargaPabrik: harga, upahJahit: upah }] })
        return ok(id)
      },

      hapusPabrik: (id) => {
        const s = get()
        if (s.pengambilan.some((p) => p.pabrikId === id) || s.kas.some((k) => k.pabrikId === id)) {
          return fail("Pabrik masih punya pengambilan atau uang. Tidak bisa dihapus.")
        }
        set({ pabrik: s.pabrik.filter((p) => p.id !== id) })
        return ok()
      },

      hapusPenjahit: (id) => {
        const s = get()
        if (
          s.pekerjaan.some((k) => k.penjahitId === id) ||
          s.slip.some((sl) => sl.penjahitId === id) ||
          s.kas.some((k) => k.penjahitId === id)
        ) {
          return fail("Penjahit masih punya pekerjaan, slip, atau kasbon.")
        }
        set({ penjahit: s.penjahit.filter((p) => p.id !== id) })
        return ok()
      },

      hapusModel: (id) => {
        const s = get()
        if (s.pengambilan.some((p) => p.modelId === id)) return fail("Model masih dipakai di pengambilan.")
        set({ model: s.model.filter((m) => m.id !== id) })
        return ok()
      },

      simpanProfil: (profil) => {
        const nama = teks(profil.nama, 80)
        if (!nama) return fail("Nama usaha wajib diisi.")
        const hari = num(profil.hariBayar)
        if (hari < 0 || hari > 6) return fail("Hari bayar tidak valid.")
        set({
          profil: {
            nama,
            pemilik: teks(profil.pemilik, 80),
            telepon: teks(profil.telepon, 40),
            alamat: teks(profil.alamat, 160),
            hariBayar: hari,
          },
        })
        return ok()
      },

      kosongkan: () => set(dataKosong()),
      muatContoh: () => set(buatContoh()),
      pakaiData: () => set({ contoh: false }),
      impor: (raw) => {
        const data = parseData(raw)
        if (!data) return fail("File ini bukan cadangan Buku Makloon.")
        set(data)
        return ok()
      },
    }),
    {
      name: "buku-makloon-v1",
      skipHydration: true,
      version: 1,
      partialize: (s) => {
        const out: Partial<DataSlice> = {}
        for (const key of KEYS) out[key] = s[key] as never
        return out as BukuState
      },
    },
  ),
)
