import { useMemo, useState } from "react"
import { ContohBanner } from "@/components/contoh"
import { BagiDialog, HasilDialog } from "@/components/forms-barang"
import { BayarDialog } from "@/components/forms-uang"
import { Button, EmptyState, Page, PageHead, StatusBadge, cn } from "@/components/ui"
import { namaDari, qtyBisaBayar, qtyMasihJahit, statusKerja } from "@/lib/calc"
import { angka, rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"
import type { StatusKerja } from "@/lib/types"
import { LABEL_STATUS } from "@/lib/types"

const FILTER: { id: "semua" | StatusKerja; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "berjalan", label: LABEL_STATUS.berjalan },
  { id: "menunggu-setor", label: LABEL_STATUS["menunggu-setor"] },
  { id: "menunggu-tagih", label: LABEL_STATUS["menunggu-tagih"] },
  { id: "beres", label: LABEL_STATUS.beres },
]

export function KerjaPage() {
  const data = useBuku()
  const [filter, setFilter] = useState<(typeof FILTER)[number]["id"]>("semua")
  const [bagi, setBagi] = useState(false)
  const [hasil, setHasil] = useState<string | null>(null)
  const [bayar, setBayar] = useState<string | null>(null)
  const rows = useMemo(() => {
    return data.pekerjaan
      .map((k) => {
        const amb = data.pengambilan.find((p) => p.id === k.pengambilanId)
        return { k, amb, status: statusKerja(k) }
      })
      .filter((row) => filter === "semua" || row.status === filter)
      .sort((a, b) => {
        const rank: Record<StatusKerja, number> = { berjalan: 0, "menunggu-setor": 1, "menunggu-tagih": 2, beres: 3 }
        return rank[a.status] - rank[b.status] || b.k.tanggalBagi.localeCompare(a.k.tanggalBagi)
      })
  }, [data, filter])

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title="Pekerjaan"
        lede="Potongan yang sudah dipegang penjahit. Catat yang bagus, yang rusak, dan yang sudah disetor."
        action={<Button onClick={() => setBagi(true)}>Bagi potongan</Button>}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTER.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-3 text-sm font-semibold",
              filter === f.id ? "bg-fg text-surface" : "border border-line bg-surface",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {data.pekerjaan.length === 0 ? (
        <EmptyState
          title="Belum ada pekerjaan"
          body="Bagi potongan yang sudah diambil ke penjahit, lalu catat hasilnya di sini."
          action={<Button onClick={() => setBagi(true)}>Bagi potongan</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="Tidak ada di saringan ini" body="Coba saringan lain, atau catat hasil jahitan yang baru selesai." />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ k, amb, status }) => (
            <li key={k.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">{k.nomor}</p>
                  <h2 className="truncate font-display text-2xl">{namaDari(data.penjahit, k.penjahitId)}</h2>
                  <p className="text-sm text-muted">
                    {namaDari(data.model, amb?.modelId ?? "")} · {namaDari(data.pabrik, amb?.pabrikId ?? "")} · dibagi {tgl(k.tanggalBagi)}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Angka label="Dipegang" nilai={`${angka(k.qty)} pcs`} />
                <Angka label="Bagus" nilai={angka(k.qtySelesai)} />
                <Angka label="Rusak" nilai={angka(k.qtyRusak)} />
                <Angka label="Masih dijahit" nilai={angka(qtyMasihJahit(k))} />
                <Angka label="Disetor" nilai={angka(k.qtySetor)} />
                <Angka label="Sudah ditagih" nilai={angka(k.qtyTertagih)} />
                <Angka label="Upah / pcs" nilai={rupiah(k.upahPerPcs)} />
                <Angka label="Upah belum" nilai={rupiah(qtyBisaBayar(k) * k.upahPerPcs)} />
              </dl>
              {k.catatan ? <p className="mt-2 text-sm text-muted">{k.catatan}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="px-3" onClick={() => setHasil(k.id)}>
                  Catat hasil
                </Button>
                {qtyBisaBayar(k) > 0 ? (
                  <Button variant="outline" className="px-3" onClick={() => setBayar(k.penjahitId)}>
                    Bayar upah
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <BagiDialog open={bagi} onClose={() => setBagi(false)} />
      <HasilDialog open={hasil !== null} onClose={() => setHasil(null)} kerjaId={hasil ?? undefined} />
      <BayarDialog open={bayar !== null} onClose={() => setBayar(null)} penjahitAwal={bayar ?? undefined} />
    </Page>
  )
}

function Angka({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-xl bg-ink-soft px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{nilai}</dd>
    </div>
  )
}
