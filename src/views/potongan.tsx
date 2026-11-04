import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ContohBanner } from "@/components/contoh"
import { AmbilDialog, BagiDialog } from "@/components/forms-barang"
import { Button, EmptyState, Page, PageHead } from "@/components/ui"
import { namaDari, sisaPotongan } from "@/lib/calc"
import { angka, rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"

export function PotonganPage() {
  const data = useBuku()
  const [ambil, setAmbil] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [bagi, setBagi] = useState<string | null>(null)
  const [cari, setCari] = useState("")
  const rows = useMemo(() => {
    return data.pengambilan
      .map((p) => {
        const jobs = data.pekerjaan.filter((k) => k.pengambilanId === p.id)
        return {
          ...p,
          sisa: sisaPotongan(p, data.pekerjaan),
          jobs,
          model: namaDari(data.model, p.modelId),
          pabrik: namaDari(data.pabrik, p.pabrikId),
        }
      })
      .filter((p) => `${p.nomor} ${p.model} ${p.pabrik}`.toLowerCase().includes(cari.toLowerCase()))
      .sort((a, b) => Number(b.sisa > 0) - Number(a.sisa > 0) || b.tanggal.localeCompare(a.tanggal))
  }, [data, cari])

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title="Potongan"
        lede="Barang masuk dari pabrik. Yang belum dibagi masih belum punya penjahit."
        action={<Button onClick={() => setAmbil(true)}>Ambil potongan</Button>}
      />
      <input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari pabrik atau model"
        className="mb-4 h-11 w-full rounded-xl border border-line bg-surface px-3 text-base"
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada potongan"
          body="Catat saat mengambil kain dari pabrik: qty, model, dan ongkos per pcs yang akan ditagih nanti."
          action={<Button onClick={() => setAmbil(true)}>Ambil potongan</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((p) => {
            const pct = p.qty === 0 ? 0 : Math.round(((p.qty - p.sisa) / p.qty) * 100)
            return (
              <li key={p.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted">{p.nomor}</p>
                    <h2 className="font-display text-2xl">{p.model}</h2>
                    <p className="text-sm text-muted">
                      {p.pabrik} · {tgl(p.tanggal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{angka(p.qty)} pcs</p>
                    <p className="text-sm tabular-nums text-muted">{rupiah(p.hargaPerPcs)} / pcs</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full bg-pine" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-sm">
                  Dibagi {angka(p.qty - p.sisa)} · sisa{" "}
                  <span className="font-semibold">{angka(p.sisa)} pcs</span>
                  {p.sisa > 0 ? " belum punya penjahit" : ""}
                </p>
                {p.jobs.length > 0 ? (
                  <ul className="mt-2 text-sm text-muted">
                    {p.jobs.map((k) => (
                      <li key={k.id}>
                        {namaDari(data.penjahit, k.penjahitId)} · {angka(k.qty)} pcs
                      </li>
                    ))}
                  </ul>
                ) : null}
                {p.catatan ? <p className="mt-2 text-sm text-muted">{p.catatan}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.sisa > 0 ? (
                    <Button className="px-3" onClick={() => setBagi(p.id)}>
                      Bagi ke penjahit
                    </Button>
                  ) : null}
                  <Button variant="outline" className="px-3" onClick={() => setEditId(p.id)}>
                    Ubah
                  </Button>
                  <Link
                    to="/cetak/ambil/$id"
                    params={{ id: p.id }}
                    className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-pine"
                  >
                    Cetak nota ambil
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <AmbilDialog open={ambil || editId !== null} onClose={() => { setAmbil(false); setEditId(null) }} editId={editId ?? undefined} />
      <BagiDialog open={bagi !== null} onClose={() => setBagi(null)} awalPengambilanId={bagi ?? undefined} />
    </Page>
  )
}
