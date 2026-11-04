export type Profil = {
  nama: string
  pemilik: string
  telepon: string
  alamat: string
  hariBayar: number
}

export type Pabrik = {
  id: string
  nama: string
  telepon: string
  alamat: string
  catatan: string
}

export type Penjahit = {
  id: string
  nama: string
  telepon: string
  alamat: string
  catatan: string
}

export type ModelHijab = {
  id: string
  nama: string
  hargaPabrik: number
  upahJahit: number
}

export type Pengambilan = {
  id: string
  nomor: string
  tanggal: string
  pabrikId: string
  modelId: string
  qty: number
  hargaPerPcs: number
  catatan: string
}

export type Pekerjaan = {
  id: string
  nomor: string
  pengambilanId: string
  penjahitId: string
  tanggalBagi: string
  qty: number
  upahPerPcs: number
  qtySelesai: number
  qtyRusak: number
  tanggalSelesai: string
  qtySetor: number
  tanggalSetor: string
  qtyTertagih: number
  qtyTerbayar: number
  catatan: string
}

export type TagihanItem = {
  pekerjaanId: string
  modelNama: string
  qty: number
  hargaPerPcs: number
}

export type Tagihan = {
  id: string
  nomor: string
  tanggal: string
  pabrikId: string
  items: TagihanItem[]
  catatan: string
}

export type SlipItem = {
  pekerjaanId: string
  modelNama: string
  qty: number
  upahPerPcs: number
}

export type SlipUpah = {
  id: string
  nomor: string
  tanggal: string
  penjahitId: string
  items: SlipItem[]
  potongKasbon: number
  catatan: string
}

export type JenisKas =
  | "modal"
  | "tarik"
  | "terima_pabrik"
  | "muka_pabrik"
  | "bayar_upah"
  | "kasbon_penjahit"

export type ArusKas = {
  id: string
  nomor: string
  tanggal: string
  jenis: JenisKas
  jumlah: number
  pabrikId: string
  penjahitId: string
  tagihanId: string
  slipId: string
  catatan: string
}

export type Seq = {
  amb: number
  krj: number
  inv: number
  slp: number
  kas: number
}

export type DataSlice = {
  profil: Profil
  pabrik: Pabrik[]
  penjahit: Penjahit[]
  model: ModelHijab[]
  pengambilan: Pengambilan[]
  pekerjaan: Pekerjaan[]
  tagihan: Tagihan[]
  slip: SlipUpah[]
  kas: ArusKas[]
  contoh: boolean
  seq: Seq
}

export type Result = { ok: true; id?: string } | { ok: false; error: string }

export type StatusKerja = "berjalan" | "menunggu-setor" | "menunggu-tagih" | "beres"

export const LABEL_KAS: Record<JenisKas, string> = {
  modal: "Uang pribadi masuk",
  tarik: "Tarik ke dompet",
  terima_pabrik: "Terima dari pabrik",
  muka_pabrik: "Pabrik bayar duluan",
  bayar_upah: "Bayar upah",
  kasbon_penjahit: "Kasbon penjahit",
}

export const LABEL_STATUS: Record<StatusKerja, string> = {
  berjalan: "Sedang dijahit",
  "menunggu-setor": "Siap disetor",
  "menunggu-tagih": "Siap ditagih",
  beres: "Beres",
}
