import { Link } from "@tanstack/react-router"
import { Banknote, Clock, Package, Scissors, Truck, Wallet } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ContohBanner } from "@/components/contoh"
import { AmbilDialog, BagiDialog } from "@/components/forms-barang"
import { BayarDialog, TagihanDialog, TerimaDialog } from "@/components/forms-uang"
import { Button, Page, PageHead, StatCard, StatusBadge } from "@/components/ui"
import {
  chartModel,
  namaDari,
  qtyBisaTagih,
  qtyMasihJahit,
  saldoPenjahit,
  saldoPabrik,
  sisaPotongan,
  statusKerja,
  untungDisetor,
  upahMengambang,
} from "@/lib/calc"
import { HARI, angka, bulanLabel, jakartaToday, nextPay, rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"

export function Dashboard() {
  const data = useBuku()
  const today = jakartaToday()
  const month = today.slice(0, 7)
  const bayar = nextPay(data.profil.hariBayar, today)
  const [ambil, setAmbil] = useState(false)
  const [bagi, setBagi] = useState<string | null>(null)
  const [terima, setTerima] = useState<string | null>(null)
  const [upah, setUpah] = useState<string | null>(null)
  const [tagih, setTagih] = useState(false)

  const belum = data.pengambilan
    .map((p) => ({ ...p, sisa: sisaPotongan(p, data.pekerjaan) }))
    .filter((p) => p.sisa > 0)
  const pcsBelum = belum.reduce((a, p) => a + p.sisa, 0)
  const berjalan = data.pekerjaan.filter((k) => qtyMasihJahit(k) > 0)
  const pcsJahit = berjalan.reduce((a, k) => a + qtyMasihJahit(k), 0)
  const siapSetor = data.pekerjaan.filter((k) => statusKerja(k) === "menunggu-setor")
  const siapTagih = data.pekerjaan.filter((k) => qtyBisaTagih(k) > 0)
  const pcsTagih = siapTagih.reduce((a, k) => a + qtyBisaTagih(k), 0)
  const pabrik = saldoPabrik(data)
  const piutang = pabrik.reduce((a, p) => a + Math.max(0, p.sisa), 0)
  const muka = pabrik.reduce((a, p) => a + Math.max(0, -p.sisa), 0)
  const penjahit = saldoPenjahit(data).filter((p) => p.upahBelum > 0 || p.kasbon > 0 || p.pcsJalan > 0)
  const upahJatuh = saldoPenjahit(data).reduce((a, p) => a + p.upahBelum, 0)
  const hasil = untungDisetor(data, month)
  const kas = data.kas.reduce((a, k) => {
    const masuk = k.jenis === "modal" || k.jenis === "terima_pabrik" || k.jenis === "muka_pabrik"
    return a + (masuk ? k.jumlah : -k.jumlah)
  }, 0)
  const chart = chartModel(data, month)
  const mengambang = upahMengambang(data)

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title={bayar.hariIni ? `Hari ini ${HARI[data.profil.hariBayar]}` : `Bayar ${tgl(bayar.tanggal)}`}
        lede="Ambil potongan, bagi ke penjahit, setor yang jadi, lalu tagih pabrik. Upah biasanya dibereskan di hari bayar."
        action={
          <Button onClick={() => setAmbil(true)}>
            <Package className="size-4" />
            Ambil potongan
          </Button>
        }
      />

      <section
        className={
          kas < 0
            ? "mb-4 rounded-2xl bg-primary px-4 py-4 text-primary-fg"
            : "mb-4 rounded-2xl bg-pine px-4 py-4 text-pine-fg"
        }
      >
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="size-4" />
          Kas sekarang
        </div>
        <p className="mt-1 font-display text-4xl tabular-nums">{rupiah(kas)}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 opacity-90">
          {kas < 0
            ? "Minus ini uang pribadi yang belum kembali. Nanti saat pabrik transfer, catat di terima uang supaya kas naik lagi."
            : muka > 0
              ? `Termasuk uang muka pabrik ${rupiah(muka)} yang belum ketutup tagihan.`
              : "Uang yang ada di kas usaha. Bayar penjahit dari sini, atau catat kalau pakai uang pribadi."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="bg-surface text-fg" onClick={() => setTerima("")}>
            Terima dari pabrik
          </Button>
          <Button variant="outline" className="bg-surface text-fg" onClick={() => setUpah("")}>
            Bayar upah
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard to="/potongan" icon={<Package className="size-4" />} label="Belum dibagi" value={angka(pcsBelum)} hint="pcs belum ada penjahitnya" />
        <StatCard to="/kerja" icon={<Scissors className="size-4" />} label="Sedang dijahit" value={angka(pcsJahit)} hint="pcs masih di penjahit" />
        <StatCard to="/kerja" icon={<Truck className="size-4" />} label="Siap disetor" value={angka(siapSetor.reduce((a, k) => a + (k.qtySelesai - k.qtySetor), 0))} hint="pcs bagus, belum ke pabrik" />
        <StatCard to="/nota" icon={<Banknote className="size-4" />} label="Siap ditagih" value={angka(pcsTagih)} hint="pcs sudah disetor" />
        <StatCard to="/kas" icon={<Banknote className="size-4" />} label="Piutang pabrik" value={rupiah(piutang)} hint="yang belum mereka bayar" />
        <StatCard to="/kas" icon={<Clock className="size-4" />} label="Upah jatuh tempo" value={rupiah(upahJatuh)} hint={`biasanya tiap ${HARI[data.profil.hariBayar]}`} />
      </section>

      {pcsTagih > 0 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-rust-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6">
            <span className="font-semibold tabular-nums">{angka(pcsTagih)} pcs</span> sudah disetor ke pabrik dan belum ditagih.
          </p>
          <Button className="shrink-0" onClick={() => setTagih(true)}>
            Buat tagihan
          </Button>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Belum ada penjahitnya" kosong={belum.length === 0} kosongText="Semua potongan sudah dibagi.">
          {belum.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate font-semibold">{namaDari(data.model, p.modelId)}</p>
                <p className="text-sm text-muted">
                  {namaDari(data.pabrik, p.pabrikId)} · {p.nomor} · {tgl(p.tanggal)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-sm font-semibold">{angka(p.sisa)} pcs</span>
                <Button variant="outline" className="px-3" onClick={() => setBagi(p.id)}>
                  Bagi
                </Button>
              </div>
            </li>
          ))}
        </Panel>

        <Panel title="Pekerjaan yang sedang berjalan" kosong={berjalan.length === 0} kosongText="Tidak ada yang masih dijahit.">
          {berjalan.map((k) => {
            const amb = data.pengambilan.find((p) => p.id === k.pengambilanId)
            return (
              <li key={k.id} className="border-b border-line py-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{namaDari(data.penjahit, k.penjahitId)}</p>
                    <p className="text-sm text-muted">
                      {namaDari(data.model, amb?.modelId ?? "")} · {namaDari(data.pabrik, amb?.pabrikId ?? "")}
                    </p>
                  </div>
                  <StatusBadge status={statusKerja(k)} />
                </div>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  Masih {angka(qtyMasihJahit(k))} dari {angka(k.qty)} pcs · dibagi {tgl(k.tanggalBagi)}
                </p>
              </li>
            )
          })}
        </Panel>
      </section>

      <section className="mt-4">
        <Panel title={`Upah yang perlu dibayar · ${HARI[data.profil.hariBayar]}`} kosong={penjahit.filter((p) => p.upahBelum > 0).length === 0} kosongText="Tidak ada upah jatuh tempo. Upah muncul setelah hasil bagus dicatat.">
          {penjahit
            .filter((p) => p.upahBelum > 0)
            .map((p) => (
              <li key={p.penjahit.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                <div>
                  <p className="font-semibold">{p.penjahit.nama}</p>
                  <p className="text-sm text-muted">
                    Upah {rupiah(p.upahBelum)}
                    {p.kasbon > 0 ? ` · kasbon ${rupiah(p.kasbon)} · tunai ${rupiah(p.net)}` : ""}
                  </p>
                </div>
                <Button variant="outline" className="px-3" onClick={() => setUpah(p.penjahit.id)}>
                  Bayar
                </Button>
              </li>
            ))}
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-display text-2xl">Hasil {bulanLabel(month)}</h2>
          <p className="mt-1 text-sm text-muted">Dihitung dari pcs yang sudah disetor ke pabrik.</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-muted">Pendapatan</dt>
              <dd className="mt-1 font-semibold tabular-nums text-pine">{rupiah(hasil.pendapatan)}</dd>
            </div>
            <div>
              <dt className="text-muted">Upah</dt>
              <dd className="mt-1 font-semibold tabular-nums text-primary">{rupiah(hasil.upah)}</dd>
            </div>
            <div>
              <dt className="text-muted">Selisih</dt>
              <dd className="mt-1 font-semibold tabular-nums">{rupiah(hasil.untung)}</dd>
            </div>
          </dl>
          {mengambang > 0 ? (
            <p className="mt-3 text-sm text-muted">Upah yang sudah jatuh tempo tapi barangnya belum disetor: {rupiah(mengambang)}. Belum masuk selisih.</p>
          ) : null}
          {chart.length > 0 ? (
            <div className="mt-4 h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="nama" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v))} width={48} />
                  <Tooltip
                    formatter={(value) => rupiah(Number(value ?? 0))}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="var(--color-pine)" radius={4} />
                  <Bar dataKey="upah" name="Upah" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Belum ada setoran bulan ini.</p>
          )}
        </article>

        <article className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-display text-2xl">Saldo pabrik</h2>
          <p className="mt-1 text-sm text-muted">Minus berarti pabrik masih harus bayar. Lebih berarti mereka sudah transfer duluan.</p>
          <ul className="mt-3">
            {pabrik.length === 0 ? <li className="text-sm text-muted">Belum ada pabrik.</li> : null}
            {pabrik.map((p) => (
              <li key={p.pabrik.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                <div>
                  <p className="font-semibold">{p.pabrik.nama}</p>
                  <p className="text-sm text-muted">
                    {p.sisa > 0 ? "Masih harus bayar" : p.sisa < 0 ? "Sudah bayar duluan" : "Lunas"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{rupiah(Math.abs(p.sisa))}</p>
                  {p.sisa > 0 ? (
                    <button type="button" className="text-sm font-semibold text-pine" onClick={() => setTerima(p.pabrik.id)}>
                      Catat terima
                    </button>
                  ) : (
                    <Link to="/nota" className="text-sm font-semibold text-pine">
                      Lihat nota
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <AmbilDialog open={ambil} onClose={() => setAmbil(false)} />
      <BagiDialog open={bagi !== null} onClose={() => setBagi(null)} awalPengambilanId={bagi ?? undefined} />
      <TerimaDialog open={terima !== null} onClose={() => setTerima(null)} pabrikAwal={terima || undefined} />
      <BayarDialog open={upah !== null} onClose={() => setUpah(null)} penjahitAwal={upah || undefined} />
      <TagihanDialog open={tagih} onClose={() => setTagih(false)} />
    </Page>
  )
}

function Panel({
  title,
  children,
  kosong,
  kosongText,
}: {
  title: string
  children: ReactNode
  kosong: boolean
  kosongText: string
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="font-display text-2xl">{title}</h2>
      {kosong ? <p className="mt-3 text-sm text-muted">{kosongText}</p> : <ul className="mt-1">{children}</ul>}
    </article>
  )
}
