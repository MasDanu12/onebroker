import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ContohBanner } from "@/components/contoh"
import { ModelDialog, PabrikDialog, PenjahitDialog, ProfilDialog } from "@/components/forms-master"
import { Button, Page, PageHead } from "@/components/ui"
import { HARI, jakartaToday, rupiah } from "@/lib/format"
import { ambilData, useBuku } from "@/lib/store"
import type { ModelHijab, Pabrik, Penjahit } from "@/lib/types"

export function DataPage() {
  const data = useBuku()
  const [profil, setProfil] = useState(false)
  const [pabrik, setPabrik] = useState<Pabrik | null | undefined>(undefined)
  const [penjahit, setPenjahit] = useState<Penjahit | null | undefined>(undefined)
  const [model, setModel] = useState<ModelHijab | null | undefined>(undefined)

  function unduh() {
    const blob = new Blob([JSON.stringify(ambilData(data), null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `buku-makloon-${jakartaToday()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Cadangan terunduh.")
  }

  function unggah(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        const r = data.impor(json)
        if (!r.ok) toast.error(r.error)
        else toast.success("Cadangan dimuat.")
      } catch {
        toast.error("File tidak bisa dibaca.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Page>
      <ContohBanner />
      <PageHead
        title="Data usaha"
        lede="Catatan tersimpan di peramban ini. Unduh cadangan supaya aman kalau ganti HP."
        action={
          <Button variant="outline" onClick={() => setProfil(true)}>
            Ubah profil
          </Button>
        }
      />

      <article className="mb-4 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl">{data.profil.nama}</h2>
        <p className="mt-1 text-sm text-muted">
          {[data.profil.pemilik, data.profil.telepon, data.profil.alamat].filter(Boolean).join(" · ") || "Lengkapi profil supaya nota rapi."}
        </p>
        <p className="mt-1 text-sm">Hari bayar: {HARI[data.profil.hariBayar] ?? "Sabtu"}</p>
      </article>

      <Blok title="Pabrik" onAdd={() => setPabrik(null)}>
        {data.pabrik.map((p) => (
          <Baris key={p.id} judul={p.nama} sub={[p.telepon, p.alamat].filter(Boolean).join(" · ")} onClick={() => setPabrik(p)} />
        ))}
      </Blok>
      <Blok title="Penjahit" onAdd={() => setPenjahit(null)}>
        {data.penjahit.map((p) => (
          <Baris key={p.id} judul={p.nama} sub={p.telepon} onClick={() => setPenjahit(p)} />
        ))}
      </Blok>
      <Blok title="Model & ongkos baku" onAdd={() => setModel(null)}>
        {data.model.map((m) => (
          <Baris
            key={m.id}
            judul={m.nama}
            sub={`Pabrik ${rupiah(m.hargaPabrik)} · upah ${rupiah(m.upahJahit)}`}
            onClick={() => setModel(m)}
          />
        ))}
      </Blok>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl">Cadangan</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Data tidak ikut akun. Simpan file JSON, lalu muat lagi di HP atau browser lain.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={unduh}>Unduh cadangan</Button>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold">
            Muat cadangan
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) unggah(file)
                e.target.value = ""
              }}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("Kosongkan seluruh buku? Unduh cadangan dulu kalau masih perlu.")) data.kosongkan()
            }}
          >
            Kosongkan buku
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm("Ganti isi buku dengan data contoh?")) data.muatContoh()
            }}
          >
            Muat contoh
          </Button>
        </div>
      </section>

      {profil ? <ProfilDialog open onClose={() => setProfil(false)} /> : null}
      {pabrik !== undefined ? (
        <PabrikDialog open onClose={() => setPabrik(undefined)} awal={pabrik ?? undefined} />
      ) : null}
      {penjahit !== undefined ? (
        <PenjahitDialog open onClose={() => setPenjahit(undefined)} awal={penjahit ?? undefined} />
      ) : null}
      {model !== undefined ? (
        <ModelDialog open onClose={() => setModel(undefined)} awal={model ?? undefined} />
      ) : null}
    </Page>
  )
}

function Blok({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <Button variant="outline" className="px-3" onClick={onAdd}>
          Tambah
        </Button>
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function Baris({ judul, sub, onClick }: { judul: string; sub: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-left">
        <span className="block font-semibold">{judul}</span>
        {sub ? <span className="block text-sm text-muted">{sub}</span> : null}
      </button>
    </li>
  )
}
