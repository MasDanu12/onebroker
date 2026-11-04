import { useState } from "react"
import { toast } from "sonner"
import { ContohBanner } from "@/components/contoh"
import { BayarDialog, KasbonDialog, PribadiDialog, TerimaDialog } from "@/components/forms-uang"
import { Button, Page, PageHead, cn } from "@/components/ui"
import { masukKas, saldoKas, saldoPabrik, saldoPenjahit } from "@/lib/calc"
import { rupiah, tgl } from "@/lib/format"
import { useBuku } from "@/lib/store"
import { LABEL_KAS } from "@/lib/types"

export function KasPage() {
  const data = useBuku()
  const [tab, setTab] = useState<"arus" | "pabrik" | "penjahit">("arus")
  const [terima, setTerima] = useState<string | null>(null)
  const [bayar, setBayar] = useState<string | null>(null)
  const [kasbon, setKasbon] = useState<string | null>(null)
  const [pribadi, setPribadi] = useState(false)
  const kas = saldoKas(data.kas)
  const pabrik = saldoPabrik(data)
  const jahit = saldoPenjahit(data)

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title="Kas"
        lede="Uang masuk dari pabrik, upah dan kasbon penjahit, plus uang pribadi kalau bayar duluan."
      />
      <section className={cn("mb-4 rounded-2xl px-4 py-4", kas < 0 ? "bg-primary text-primary-fg" : "bg-pine text-pine-fg")}>
        <p className="text-sm">Saldo kas</p>
        <p className="font-display text-4xl tabular-nums">{rupiah(kas)}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 opacity-90">
          {kas < 0
            ? "Kas minus artinya uang pribadi yang dipakai dulu untuk bayar penjahit, belum terganti."
            : "Kalau pabrik transfer duluan, catat sebagai bayar duluan. Kalau melunasi tagihan, catat sebagai pelunasan."}
        </p>
      </section>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => setTerima("")}>Terima dari pabrik</Button>
        <Button variant="outline" onClick={() => setBayar("")}>
          Bayar upah
        </Button>
        <Button variant="outline" onClick={() => setKasbon("")}>
          Kasbon penjahit
        </Button>
        <Button variant="ghost" onClick={() => setPribadi(true)}>
          Uang pribadi
        </Button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(
          [
            ["arus", "Arus kas"],
            ["pabrik", "Pabrik"],
            ["penjahit", "Penjahit"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold",
              tab === id ? "bg-fg text-surface" : "border border-line bg-surface",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "arus" ? (
        <ul className="flex flex-col gap-2">
          {data.kas.length === 0 ? <li className="text-sm text-muted">Belum ada gerakan kas.</li> : null}
          {data.kas
            .slice()
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.nomor.localeCompare(a.nomor))
            .map((k) => {
              const masuk = masukKas(k.jenis)
              const lawan =
                k.pabrikId ? data.pabrik.find((p) => p.id === k.pabrikId)?.nama : data.penjahit.find((p) => p.id === k.penjahitId)?.nama
              return (
                <li key={k.id} className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{k.nomor} · {tgl(k.tanggal)}</p>
                    <p className="font-semibold">{LABEL_KAS[k.jenis]}</p>
                    <p className="truncate text-sm text-muted">{[lawan, k.catatan].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold tabular-nums", masuk ? "text-pine" : "text-primary")}>
                      {masuk ? "+" : "−"}
                      {rupiah(k.jumlah)}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-sm font-semibold text-muted"
                      onClick={() => {
                        if (!window.confirm("Hapus catatan kas ini?")) return
                        const r = data.hapusKas(k.id)
                        if (!r.ok) toast.error(r.error)
                        else toast.success("Catatan kas dihapus.")
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              )
            })}
        </ul>
      ) : null}

      {tab === "pabrik" ? (
        <ul className="flex flex-col gap-2">
          {pabrik.map((p) => (
            <li key={p.pabrik.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{p.pabrik.nama}</h2>
                  <p className="text-sm text-muted">{p.pabrik.telepon}</p>
                </div>
                <p className="text-right text-sm font-semibold">
                  {p.sisa > 0 ? "Harus bayar" : p.sisa < 0 ? "Bayar duluan" : "Lunas"}
                  <span className="mt-1 block text-base tabular-nums">{rupiah(Math.abs(p.sisa))}</span>
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">
                Tagihan {rupiah(p.tagih)} · sudah diterima {rupiah(p.masuk)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button className="px-3" onClick={() => setTerima(p.pabrik.id)}>
                  Catat terima
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "penjahit" ? (
        <ul className="flex flex-col gap-2">
          {jahit.map((p) => (
            <li key={p.penjahit.id} className="rounded-2xl border border-line bg-surface p-4">
              <h2 className="font-display text-2xl">{p.penjahit.nama}</h2>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-muted">Upah belum</dt>
                  <dd className="font-semibold tabular-nums">{rupiah(p.upahBelum)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Kasbon</dt>
                  <dd className="font-semibold tabular-nums">{rupiah(p.kasbon)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Masih jahit</dt>
                  <dd className="font-semibold tabular-nums">{p.pcsJalan} pcs</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="px-3" onClick={() => setBayar(p.penjahit.id)}>
                  Bayar upah
                </Button>
                <Button variant="outline" className="px-3" onClick={() => setKasbon(p.penjahit.id)}>
                  Kasih kasbon
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <TerimaDialog open={terima !== null} onClose={() => setTerima(null)} pabrikAwal={terima || undefined} />
      <BayarDialog open={bayar !== null} onClose={() => setBayar(null)} penjahitAwal={bayar || undefined} />
      <KasbonDialog open={kasbon !== null} onClose={() => setKasbon(null)} penjahitAwal={kasbon || undefined} />
      <PribadiDialog open={pribadi} onClose={() => setPribadi(false)} />
    </Page>
  )
}
