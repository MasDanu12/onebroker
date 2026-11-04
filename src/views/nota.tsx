import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { ContohBanner } from "@/components/contoh"
import { TagihanDialog } from "@/components/forms-uang"
import { Button, Page, PageHead } from "@/components/ui"
import { namaDari, nilaiSlip, nilaiTagihan, terimaTagihan } from "@/lib/calc"
import { rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"

export function NotaPage() {
  const data = useBuku()
  const [tagihan, setTagihan] = useState(false)

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title="Nota"
        lede="Cetak nota ambil, tagihan ke pabrik, dan slip upah penjahit. Di pratinjau, pilih cetak atau simpan PDF."
        action={<Button onClick={() => setTagihan(true)}>Buat tagihan</Button>}
      />

      <section className="mb-6">
        <h2 className="mb-2 font-display text-2xl">Tagihan ke pabrik</h2>
        {data.tagihan.length === 0 ? (
          <p className="text-sm text-muted">Belum ada tagihan. Setor hasil jahitan dulu, lalu buat tagihan.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.tagihan.map((t) => {
              const total = nilaiTagihan(t)
              const bayar = terimaTagihan(t.id, data.kas)
              return (
                <li key={t.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">{t.nomor} · {tgl(t.tanggal)}</p>
                      <p className="font-semibold">{namaDari(data.pabrik, t.pabrikId)}</p>
                      <p className="text-sm text-muted">
                        {t.items.length} baris · diterima {rupiah(bayar)} · sisa {rupiah(total - bayar)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{rupiah(total)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/cetak/tagihan/$id" params={{ id: t.id }} className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">
                      Cetak
                    </Link>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (!window.confirm("Hapus tagihan ini?")) return
                        const r = data.hapusTagihan(t.id)
                        if (!r.ok) toast.error(r.error)
                        else toast.success("Tagihan dihapus.")
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-display text-2xl">Slip upah penjahit</h2>
        {data.slip.length === 0 ? (
          <p className="text-sm text-muted">Slip terbuat otomatis saat upah dibayar.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.slip.map((s) => {
              const bruto = nilaiSlip(s)
              return (
                <li key={s.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">{s.nomor} · {tgl(s.tanggal)}</p>
                      <p className="font-semibold">{namaDari(data.penjahit, s.penjahitId)}</p>
                      <p className="text-sm text-muted">
                        Upah {rupiah(bruto)} · potong kasbon {rupiah(s.potongKasbon)} · tunai {rupiah(bruto - s.potongKasbon)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/cetak/slip/$id" params={{ id: s.id }} className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">
                      Cetak
                    </Link>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (!window.confirm("Hapus slip ini? Upahnya akan terbuka lagi.")) return
                        const r = data.hapusSlip(s.id)
                        if (!r.ok) toast.error(r.error)
                        else toast.success("Slip dihapus.")
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl">Nota ambil potongan</h2>
        <ul className="flex flex-col gap-2">
          {data.pengambilan.length === 0 ? <li className="text-sm text-muted">Belum ada pengambilan.</li> : null}
          {data.pengambilan.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="min-w-0">
                <p className="text-xs text-muted">{p.nomor} · {tgl(p.tanggal)}</p>
                <p className="truncate font-semibold">
                  {namaDari(data.pabrik, p.pabrikId)} · {namaDari(data.model, p.modelId)}
                </p>
                <p className="text-sm text-muted">{p.qty} pcs · {rupiah(p.hargaPerPcs)}</p>
              </div>
              <Link to="/cetak/ambil/$id" params={{ id: p.id }} className="inline-flex h-11 shrink-0 items-center rounded-xl border border-line px-3 text-sm font-semibold">
                Cetak
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <TagihanDialog open={tagihan} onClose={() => setTagihan(false)} />
    </Page>
  )
}
