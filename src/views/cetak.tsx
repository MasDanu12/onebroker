import type { ReactNode } from "react"
import { namaDari, nilaiSlip, nilaiTagihan, saldoPabrik, terimaTagihan } from "@/lib/calc"
import { angka, rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"

function Kop({ judul, nomor, tanggal }: { judul: string; nomor: string; tanggal: string }) {
  const profil = useBuku((s) => s.profil)
  return (
    <header className="flex items-start justify-between gap-4 border-t-4 border-primary pt-4">
      <div>
        <p className="font-display text-3xl leading-none">{profil.nama || "Usaha Makloon"}</p>
        <p className="mt-2 text-sm text-muted">{profil.pemilik}</p>
        <p className="text-sm text-muted">{[profil.alamat, profil.telepon].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold tracking-wide text-muted">{judul}</p>
        <p className="font-display text-2xl">{nomor}</p>
        <p className="text-sm">{tgl(tanggal, true)}</p>
      </div>
    </header>
  )
}

function Tanda({ kiri, kanan }: { kiri: string; kanan: string }) {
  return (
    <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
      <div>
        <p>{kiri}</p>
        <div className="mt-16 border-t border-line pt-2 text-muted">Tanda tangan</div>
      </div>
      <div>
        <p>{kanan}</p>
        <div className="mt-16 border-t border-line pt-2 text-muted">Tanda tangan</div>
      </div>
    </div>
  )
}

function Kertas({ children }: { children: ReactNode }) {
  return <article className="mx-auto max-w-2xl rounded-2xl bg-surface p-6 print:rounded-none print:p-0">{children}</article>
}

export function CetakAmbil({ id }: { id: string }) {
  const data = useBuku()
  const p = data.pengambilan.find((x) => x.id === id)
  if (!p) return <Kosong />
  const profil = data.profil
  return (
    <Kertas>
      <Kop judul="Nota pengambilan potongan" nomor={p.nomor} tanggal={p.tanggal} />
      <p className="mt-6 text-sm">
        Diterima dari <span className="font-semibold">{namaDari(data.pabrik, p.pabrikId)}</span>
      </p>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 font-medium">Model</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Ongkos / pcs</th>
            <th className="py-2 text-right font-medium">Perkiraan</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-3">{namaDari(data.model, p.modelId)}</td>
            <td className="py-3 text-right tabular-nums">{angka(p.qty)}</td>
            <td className="py-3 text-right tabular-nums">{rupiah(p.hargaPerPcs)}</td>
            <td className="py-3 text-right tabular-nums">{rupiah(p.qty * p.hargaPerPcs)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4 text-sm leading-6 text-muted">
        Ongkos ditagihkan setelah barang jadi disetor. Perkiraan di atas belum menjadi piutang.
        {p.catatan ? ` ${p.catatan}` : ""}
      </p>
      <Tanda kiri={namaDari(data.pabrik, p.pabrikId)} kanan={profil.pemilik || profil.nama} />
    </Kertas>
  )
}

export function CetakTagihan({ id }: { id: string }) {
  const data = useBuku()
  const t = data.tagihan.find((x) => x.id === id)
  if (!t) return <Kosong />
  const total = nilaiTagihan(t)
  const bayar = terimaTagihan(t.id, data.kas)
  const saldo = saldoPabrik(data).find((p) => p.pabrik.id === t.pabrikId)
  return (
    <Kertas>
      <Kop judul="Tagihan ongkos jahit" nomor={t.nomor} tanggal={t.tanggal} />
      <p className="mt-6 text-sm">
        Kepada <span className="font-semibold">{namaDari(data.pabrik, t.pabrikId)}</span>
      </p>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 font-medium">Model</th>
            <th className="py-2 text-right font-medium">Qty setor</th>
            <th className="py-2 text-right font-medium">Ongkos</th>
            <th className="py-2 text-right font-medium">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {t.items.map((item, i) => (
            <tr key={`${item.pekerjaanId}-${i}`} className="border-b border-line">
              <td className="py-3">{item.modelNama}</td>
              <td className="py-3 text-right tabular-nums">{angka(item.qty)}</td>
              <td className="py-3 text-right tabular-nums">{rupiah(item.hargaPerPcs)}</td>
              <td className="py-3 text-right tabular-nums">{rupiah(item.qty * item.hargaPerPcs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 space-y-1 text-sm">
        <Baris label="Total tagihan" nilai={rupiah(total)} tebal />
        <Baris label="Sudah diterima untuk nota ini" nilai={rupiah(bayar)} />
        <Baris label="Sisa nota ini" nilai={rupiah(total - bayar)} tebal />
        {saldo && saldo.sisa < 0 ? <Baris label="Uang muka pabrik yang belum terpakai" nilai={rupiah(-saldo.sisa)} /> : null}
      </dl>
      {t.catatan ? <p className="mt-4 text-sm text-muted">{t.catatan}</p> : null}
      <Tanda kiri={namaDari(data.pabrik, t.pabrikId)} kanan={data.profil.pemilik || data.profil.nama} />
    </Kertas>
  )
}

export function CetakSlip({ id }: { id: string }) {
  const data = useBuku()
  const s = data.slip.find((x) => x.id === id)
  if (!s) return <Kosong />
  const bruto = nilaiSlip(s)
  return (
    <Kertas>
      <Kop judul="Slip upah penjahit" nomor={s.nomor} tanggal={s.tanggal} />
      <p className="mt-6 text-sm">
        Untuk <span className="font-semibold">{namaDari(data.penjahit, s.penjahitId)}</span>
      </p>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 font-medium">Model</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Upah / pcs</th>
            <th className="py-2 text-right font-medium">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {s.items.map((item, i) => (
            <tr key={`${item.pekerjaanId}-${i}`} className="border-b border-line">
              <td className="py-3">{item.modelNama}</td>
              <td className="py-3 text-right tabular-nums">{angka(item.qty)}</td>
              <td className="py-3 text-right tabular-nums">{rupiah(item.upahPerPcs)}</td>
              <td className="py-3 text-right tabular-nums">{rupiah(item.qty * item.upahPerPcs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 space-y-1 text-sm">
        <Baris label="Upah kotor" nilai={rupiah(bruto)} />
        <Baris label="Potong kasbon" nilai={rupiah(s.potongKasbon)} />
        <Baris label="Tunai diterima" nilai={rupiah(bruto - s.potongKasbon)} tebal />
      </dl>
      {s.catatan ? <p className="mt-4 text-sm text-muted">{s.catatan}</p> : null}
      <Tanda kiri={namaDari(data.penjahit, s.penjahitId)} kanan={data.profil.pemilik || data.profil.nama} />
    </Kertas>
  )
}

function Baris({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) {
  return (
    <div className={tebal ? "flex justify-between font-semibold" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{nilai}</dd>
    </div>
  )
}

function Kosong() {
  return <p className="text-center text-sm text-muted">Nota tidak ditemukan.</p>
}
