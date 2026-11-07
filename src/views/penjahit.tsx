import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { History, Scissors } from "lucide-react"
import { EmptyState, Page, Select, cn } from "@/components/ui"
import { namaDari, qtyMasihJahit } from "@/lib/calc"
import type { BukuData } from "@/lib/calc"
import { angka } from "@/lib/format"
import { useBuku } from "@/lib/store"
import type { Pekerjaan } from "@/lib/types"

type Perbaikan = { qty: number; qtyKembali: number }

function perbaikanDari(k: Pekerjaan): Perbaikan[] {
  return (k as unknown as { perbaikan?: Perbaikan[] }).perbaikan ?? []
}

type Baris = {
  id: string
  nomor: string
  tanggal: string
  model: string
  qty: number
  harga: number
  jumlah: number
  perbaikan: number
  proses: boolean
  lunas: boolean
}

type Kelompok = { tanggal: string; baris: Baris[] }

function hitung(d: BukuData, id: string) {
  const baris: Baris[] = d.pekerjaan
    .filter((k) => k.penjahitId === id)
    .map((k) => {
      const amb = d.pengambilan.find((x) => x.id === k.pengambilanId)
      const rb = perbaikanDari(k)
      const aktif = rb.reduce((a, r) => a + Math.max(0, r.qty - r.qtyKembali), 0)
      return {
        id: k.id,
        nomor: k.nomor,
        tanggal: k.tanggalBagi,
        model: namaDari(d.model, amb?.modelId ?? ""),
        qty: k.qty,
        harga: k.upahPerPcs,
        jumlah: k.qty * k.upahPerPcs,
        perbaikan: rb.reduce((a, r) => a + r.qty, 0),
        proses: qtyMasihJahit(k) > 0 || aktif > 0,
        lunas: k.qtySelesai > 0 && k.qtyTerbayar >= k.qtySelesai,
      }
    })
  const tanggal = baris.map((b) => b.tanggal).filter(Boolean).sort()
  return { baris, mulai: tanggal[0] ?? "" }
}

function kelompokkan(rows: Baris[]): Kelompok[] {
  const peta = new Map<string, Baris[]>()
  for (const b of rows) peta.set(b.tanggal, [...(peta.get(b.tanggal) ?? []), b])
  return Array.from(peta.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([tanggal, baris]) => ({ tanggal, baris: [...baris].sort((x, y) => x.nomor.localeCompare(y.nomor)) }))
}

const tglPendek = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—")
const namaBulan = (ym: string) =>
  new Date(`${ym}-15T12:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"

const TH = "border border-[#d3c8f3] bg-[#e4dcfa] px-2 py-2.5 text-center text-xs font-bold text-[#2a1f6b]"
const TD = "border border-[#e3dbf7] bg-white px-2.5 py-2.5"
const TDR = `${TD} text-right tabular-nums`
const TDC = `${TD} text-center`

const WARNA = {
  hijau: "bg-[#d7f5df] text-[#166534]",
  biru: "bg-[#dbeafe] text-[#1e40af]",
  kuning: "bg-[#fde9c8] text-[#8a4f00]",
  ungu: "bg-[#ece6ff] text-[#4b2aa8]",
} as const

function Pil({ warna, children }: { warna: keyof typeof WARNA; children: ReactNode }) {
  return (
    <span className={cn("inline-block min-w-6 rounded-full px-3 py-0.5 text-center text-xs font-bold", WARNA[warna])}>
      {children}
    </span>
  )
}

function Tabel({ kelompok, lunas }: { kelompok: Kelompok[]; lunas: boolean }) {
  const jml = (rows: Baris[], f: (b: Baris) => number) => rows.reduce((a, b) => a + f(b), 0)
  const semua = kelompok.flatMap((g) => g.baris)
  const perb = (n: number) => (n > 0 ? <Pil warna="ungu">{n}</Pil> : "—")
  const sisa = lunas ? 2 : 1
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm text-[#1e1747]">
        <thead>
          <tr>
            <th className={TH}>Tgl</th>
            <th className={TH}>No PO</th>
            <th className={TH}>Model</th>
            <th className={TH}>Qty</th>
            <th className={TH}>Harga</th>
            <th className={TH}>Jumlah</th>
            <th className={TH}>Perbaikan</th>
            <th className={TH}>Status</th>
            {lunas ? <th className={TH}>Lunas</th> : null}
          </tr>
        </thead>
        <tbody>
          {kelompok.length === 0 ? (
            <tr>
              <td className={cn(TD, "text-[#6b6397]")} colSpan={lunas ? 9 : 8}>
                Belum ada pekerjaan.
              </td>
            </tr>
          ) : (
            kelompok.map((g, gi) => (
              <GroupRows key={g.tanggal} g={g} pertama={gi === 0} lunas={lunas} sisa={sisa} perb={perb} jml={jml} />
            ))
          )}
          {kelompok.length > 0 ? (
            <tr className="font-bold">
              <td className={cn(TD, "bg-[#e4dcfa]")} colSpan={3}>
                Total keseluruhan
              </td>
              <td className={cn(TDR, "bg-[#e4dcfa]")}>{angka(jml(semua, (b) => b.qty))}</td>
              <td className={cn(TD, "bg-[#e4dcfa]")} />
              <td className={cn(TDR, "bg-[#e4dcfa]")}>{angka(jml(semua, (b) => b.jumlah))}</td>
              <td className={cn(TDR, "bg-[#e4dcfa]")}>{jml(semua, (b) => b.perbaikan) || "—"}</td>
              <td className={cn(TD, "bg-[#e4dcfa]")} colSpan={sisa} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function GroupRows({
  g,
  pertama,
  lunas,
  sisa,
  perb,
  jml,
}: {
  g: Kelompok
  pertama: boolean
  lunas: boolean
  sisa: number
  perb: (n: number) => ReactNode
  jml: (rows: Baris[], f: (b: Baris) => number) => number
}) {
  const garis = pertama ? "" : "border-t-2 border-t-[#b9a8ee]"
  return (
    <>
      {g.baris.map((b, i) => (
        <tr key={b.id} className={i === 0 ? garis : ""}>
          {i === 0 ? (
            <td rowSpan={g.baris.length} className={cn(TD, "bg-[#f6f3ff] text-center align-middle font-bold", garis)}>
              {tglPendek(g.tanggal)}
            </td>
          ) : null}
          <td className={TD}>{b.nomor}</td>
          <td className={TD}>{b.model}</td>
          <td className={TDR}>{angka(b.qty)}</td>
          <td className={TDR}>{angka(b.harga)}</td>
          <td className={TDR}>{angka(b.jumlah)}</td>
          <td className={TDR}>{perb(b.perbaikan)}</td>
          <td className={TDC}>
            <Pil warna={b.proses ? "biru" : "hijau"}>{b.proses ? "Proses" : "Selesai"}</Pil>
          </td>
          {lunas ? (
            <td className={TDC}>
              <Pil warna={b.lunas ? "hijau" : "kuning"}>{b.lunas ? "Ya" : "Belum"}</Pil>
            </td>
          ) : null}
        </tr>
      ))}
      <tr className="font-semibold text-[#2a1f6b]">
        <td className={cn(TD, "bg-[#f0ebff]")} colSpan={3}>
          Total
        </td>
        <td className={cn(TDR, "bg-[#f0ebff]")}>{angka(jml(g.baris, (b) => b.qty))}</td>
        <td className={cn(TD, "bg-[#f0ebff]")} />
        <td className={cn(TDR, "bg-[#f0ebff]")}>{angka(jml(g.baris, (b) => b.jumlah))}</td>
        <td className={cn(TDR, "bg-[#f0ebff]")}>{jml(g.baris, (b) => b.perbaikan) || "—"}</td>
        <td className={cn(TD, "bg-[#f0ebff]")} colSpan={sisa} />
      </tr>
    </>
  )
}

function Lembar({ ikon, judul, kanan, children }: { ikon: ReactNode; judul: string; kanan: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_10px_rgba(75,42,168,0.08)]">
      <div className="flex items-center gap-3 bg-[#4b2aa8] px-5 py-3.5 text-white">
        {ikon}
        <h2 className="flex-1 text-xl font-bold sm:text-[22px]">{judul}</h2>
        {kanan}
      </div>
      {children}
    </section>
  )
}

export function PenjahitPage() {
  const data = useBuku()
  const [pilih, setPilih] = useState<string | null>(null)
  const [bulan, setBulan] = useState("semua")
  const daftar = data.penjahit
  const aktif = daftar.find((x) => x.id === pilih) ?? daftar[0]
  const p = useMemo(() => (aktif ? hitung(data, aktif.id) : null), [data, aktif])

  if (!aktif || !p) {
    return (
      <Page>
        <EmptyState title="Belum ada penjahit" body="Tambahkan penjahit lewat Data usaha atau Bagi potongan." />
      </Page>
    )
  }

  const berjalan = kelompokkan(p.baris.filter((b) => b.proses))
  const selesai = p.baris.filter((b) => !b.proses)
  const daftarBulan = Array.from(new Set(selesai.map((b) => b.tanggal.slice(0, 7)).filter(Boolean))).sort().reverse()
  const riwayat = kelompokkan(bulan === "semua" ? selesai : selesai.filter((b) => b.tanggal.startsWith(bulan)))

  return (
    <Page>
      <div className="flex flex-col gap-5 rounded-3xl bg-[#f1edfb] p-3 sm:p-5">
        {daftar.length > 1 ? (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
            {daftar.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setPilih(x.id)
                  setBulan("semua")
                }}
                className={cn(
                  "h-10 shrink-0 rounded-full px-4 text-sm font-semibold",
                  x.id === aktif.id ? "bg-[#4b2aa8] text-white" : "bg-white text-[#2a1f6b]",
                )}
              >
                {x.nama}
              </button>
            ))}
          </div>
        ) : null}

        <section className="flex flex-wrap items-center gap-5 rounded-[20px] bg-white p-5 shadow-[0_2px_10px_rgba(75,42,168,0.08)]">
          <div className="grid size-20 shrink-0 place-items-center rounded-[20px] bg-[#e4dcfa] text-3xl font-bold text-[#4b2aa8]">
            {inisial(aktif.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-3xl font-bold leading-tight text-[#1e1747]">{aktif.nama}</h1>
            <span className="mt-2 inline-block rounded-full bg-[#e4dcfa] px-3.5 py-1 text-xs font-semibold text-[#4b2aa8]">
              {berjalan.length > 0 ? "Penjahit aktif" : "Penjahit"}
            </span>
          </div>
          <div className="text-sm leading-6 text-[#4a4270]">
            <div>{aktif.telepon || "Belum ada telepon"}</div>
            <div>{aktif.alamat || "Belum ada alamat"}</div>
            <div>{p.mulai ? `Mulai kerja ${tglPendek(p.mulai)}` : "Belum ada pekerjaan"}</div>
          </div>
        </section>

        <Lembar
          ikon={<Scissors className="size-6" />}
          judul="Sedang Berjalan / Dikerjakan"
          kanan={
            <Link to="/kerja" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2a1f6b]">
              Lihat Semua →
            </Link>
          }
        >
          <Tabel kelompok={berjalan} lunas={false} />
        </Lembar>

        <Lembar
          ikon={<History className="size-6" />}
          judul="Riwayat Pekerjaan"
          kanan={
            <Select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              aria-label="Filter bulan"
              className="h-9 w-auto min-w-28 rounded-full border-0 bg-white py-0 text-sm font-semibold text-[#2a1f6b]"
            >
              <option value="semua">Semua</option>
              {daftarBulan.map((b) => (
                <option key={b} value={b}>
                  {namaBulan(b)}
                </option>
              ))}
            </Select>
          }
        >
          <Tabel kelompok={riwayat} lunas />
        </Lembar>
      </div>
    </Page>
  )
}
