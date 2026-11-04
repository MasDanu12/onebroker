const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const BULAN_PANJANG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

export const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

export function weekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function nextPay(hari: number, today = jakartaToday()) {
  const delta = (hari - weekday(today) + 7) % 7
  return { tanggal: addDays(today, delta), hariIni: delta === 0 }
}

export function tgl(iso: string, panjang = false): string {
  if (!iso) return "—"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const nama = (panjang ? BULAN_PANJANG : BULAN)[Number(m[2]) - 1] ?? m[2]
  return `${Number(m[3])} ${nama} ${m[1]}`
}

export function bulanLabel(ym: string): string {
  const [y, m] = ym.split("-")
  const nama = BULAN_PANJANG[Number(m) - 1] ?? m
  return `${nama} ${y}`
}

export function angka(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0)
  const sign = v < 0 ? "−" : ""
  return sign + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function rupiah(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0)
  const sign = v < 0 ? "−" : ""
  const digits = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${sign}Rp ${digits}`
}

export function parseAngka(raw: string): number {
  const n = Number(String(raw).replace(/[^\d]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function nextNo(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, "0")}`
}

export function teks(s: string, max = 400): string {
  return s.trim().slice(0, max)
}
