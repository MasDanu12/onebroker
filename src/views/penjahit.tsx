import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { Button, EmptyState, Page, PageHead } from "@/components/ui"
import { angka, rupiah, tgl } from "@/lib/format"
import { profilPenjahit } from "@/lib/profil-penjahit"
import type { ProfilPenjahit } from "@/lib/profil-penjahit"
import { useBuku } from "@/lib/store"

const TH = "px-3 py-2 text-left text-xs font-semibold text-muted"
const THR = "px-3 py-2 text-right text-xs font-semibold text-muted"
const TD = "px-3 py-2"
const TDR = "px-3 py-2 text-right tabular-nums"

export function PenjahitPage() {
  const data = useBuku()
  const rows = useMemo(() => profilPenjahit(data), [data])
  const [buka, setBuka] = useState<string | null>(null)
  const jumlah = (f: (r: ProfilPenjahit) => number) => rows.reduce((a, r) => a + f(r), 0)

  return (
    <Page>
      <PageHead
        title="Profil penjahit"
        lede="Rekap pekerjaan, perbaikan, dan upah tiap penjahit selama bekerja."
        action={
          <Link to="/data" className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold">
            Data usaha
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada penjahit" body="Tambahkan penjahit lewat Bagi potongan atau Data usaha." />
      ) : (
        <>
          <article className="mb-4 rounded-2xl border border-line bg-surface p-4">
            <h2 className="font-display text-2xl">Semua penjahit</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Kotak label="Penjahit" nilai={angka(rows.length)} />
              <Kotak label="Selesai (pcs)" nilai={angka(jumlah((r) => r.qtySelesai))} />
              <Kotak label="Total upah" nilai={rupiah(jumlah((r) => r.upahTotal))} />
              <Kotak label="Belum dibayar" nilai={rupiah(jumlah((r) => r.upahBelum))} />
            </dl>
          </article>
          <ul className="flex flex-col gap-3">
            {rows.map((r) => {
              const terbuka = buka === r.penjahit.id
              const sub = [r.penjahit.telepon, r.mulai ? `mulai kerja ${tgl(r.mulai)}` : ""].filter(Boolean).join(" · ")
              return (
                <li key={r.penjahit.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-2xl">{r.penjahit.nama}</h2>
                      <p className="text-sm text-muted">{sub || "Belum ada pekerjaan"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-ink-soft px-3 py-1 text-xs font-semibold">
                      {angka(r.jumlahKerja)} pekerjaan
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Kotak label="Dibagi" nilai={`${angka(r.qtyDibagi)} pcs`} />
                    <Kotak label="Selesai" nilai={angka(r.qtySelesai)} />
                    <Kotak label="Sedang dikerjakan" nilai={angka(r.qtyMasih)} />
                    <Kotak label="Rusak / hilang" nilai={angka(r.qtyRusak)} />
                    <Kotak
                      label="Perbaikan"
                      nilai={`${angka(r.qtyPerbaikan)}${r.qtyPerbaikanAktif > 0 ? ` (${angka(r.qtyPerbaikanAktif)} jalan)` : ""}`}
                    />
                    <Kotak label="Total upah" nilai={rupiah(r.upahTotal)} />
                    <Kotak label="Upah belum dibayar" nilai={rupiah(r.upahBelum)} />
                    <Kotak label="Sisa kasbon" nilai={rupiah(r.kasbonSisa)} />
                  </dl>
                  <div className="mt-3">
                    <Button variant="outline" className="px-3" onClick={() => setBuka(terbuka ? null : r.penjahit.id)}>
                      {terbuka ? "Tutup riwayat" : "Lihat riwayat"}
                    </Button>
                  </div>
                  {terbuka ? <Riwayat r={r} /> : null}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Page>
  )
}

function Riwayat({ r }: { r: ProfilPenjahit }) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="mb-3 text-sm text-muted">
        Upah sudah dibayar {rupiah(r.upahDibayar)} · kasbon diberi {rupiah(r.kasbonDiberi)}, dipotong {rupiah(r.kasbonDipotong)}
      </p>
      <h3 className="mb-2 font-semibold">Riwayat pekerjaan</h3>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className={TH}>Tgl bagi</th>
              <th className={TH}>No</th>
              <th className={TH}>Model</th>
              <th className={THR}>Dibagi</th>
              <th className={THR}>Selesai</th>
              <th className={THR}>Rusak</th>
              <th className={THR}>Perbaikan</th>
              <th className={THR}>Upah</th>
              <th className={THR}>Dibayar</th>
            </tr>
          </thead>
          <tbody>
            {r.riwayat.length === 0 ? (
              <tr>
                <td className={TD} colSpan={9}>
                  Belum ada pekerjaan.
                </td>
              </tr>
            ) : (
              r.riwayat.map((k) => (
                <tr key={k.id} className="border-b border-line last:border-0">
                  <td className={TD}>{tgl(k.tanggalBagi)}</td>
                  <td className={TD}>{k.nomor}</td>
                  <td className={TD}>{k.model}</td>
                  <td className={TDR}>{angka(k.qty)}</td>
                  <td className={TDR}>{angka(k.selesai)}</td>
                  <td className={TDR}>{angka(k.rusak)}</td>
                  <td className={TDR}>{angka(k.perbaikan)}</td>
                  <td className={TDR}>{rupiah(k.upahTotal)}</td>
                  <td className={TDR}>{rupiah(k.upahDibayar)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <h3 className="mb-2 mt-4 font-semibold">Riwayat pembayaran upah</h3>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className={TH}>Tanggal</th>
              <th className={TH}>No slip</th>
              <th className={THR}>Upah</th>
              <th className={THR}>Potong kasbon</th>
              <th className={THR}>Diterima</th>
            </tr>
          </thead>
          <tbody>
            {r.pembayaran.length === 0 ? (
              <tr>
                <td className={TD} colSpan={5}>
                  Belum ada pembayaran.
                </td>
              </tr>
            ) : (
              r.pembayaran.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className={TD}>{tgl(b.tanggal)}</td>
                  <td className={TD}>{b.nomor}</td>
                  <td className={TDR}>{rupiah(b.upah)}</td>
                  <td className={TDR}>{rupiah(b.potongKasbon)}</td>
                  <td className={TDR}>{rupiah(b.diterima)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kotak({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-xl bg-ink-soft px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{nilai}</dd>
    </div>
  )
}
