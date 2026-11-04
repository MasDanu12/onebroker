import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button, Field, Modal, Select, TextInput, Area } from "@/components/ui"
import { namaDari, nilaiTagihan, qtyBisaBayar, qtyBisaTagih, sisaKasbon, terimaTagihan } from "@/lib/calc"
import { jakartaToday, rupiah } from "@/lib/format"
import { useBuku } from "@/lib/store"

function say(result: { ok: boolean; error?: string }, sukses: string) {
  if (!result.ok) {
    toast.error(result.error ?? "Gagal menyimpan.")
    return false
  }
  toast.success(sukses)
  return true
}

export function TagihanDialog({ open, onClose, pabrikAwal }: { open: boolean; onClose: () => void; pabrikAwal?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Buat tagihan pabrik" wide>
      {open ? <TagihanForm key={pabrikAwal ?? "baru"} pabrikAwal={pabrikAwal} onClose={onClose} /> : null}
    </Modal>
  )
}

function TagihanForm({ pabrikAwal, onClose }: { pabrikAwal?: string; onClose: () => void }) {
  const data = useBuku()
  const awalPabrik =
    pabrikAwal ||
    data.pabrik.find((p) =>
      data.pekerjaan.some((k) => {
        const amb = data.pengambilan.find((a) => a.id === k.pengambilanId)
        return amb?.pabrikId === p.id && qtyBisaTagih(k) > 0
      }),
    )?.id ||
    data.pabrik[0]?.id ||
    ""
  const [pabrikId, setPabrikId] = useState(awalPabrik)
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")
  const baris = useMemo(
    () =>
      data.pekerjaan
        .map((k) => {
          const amb = data.pengambilan.find((p) => p.id === k.pengambilanId)
          return { k, amb, bisa: qtyBisaTagih(k) }
        })
        .filter((row) => row.amb?.pabrikId === pabrikId && row.bisa > 0),
    [data.pekerjaan, data.pengambilan, pabrikId],
  )
  const [qty, setQty] = useState<Record<string, string>>({})
  const [on, setOn] = useState<Record<string, boolean>>({})

  function nilai(id: string, bisa: number) {
    if (on[id] === false) return 0
    const raw = qty[id]
    if (raw == null || raw === "") return bisa
    return Math.min(bisa, Number(raw.replace(/\D/g, "")) || 0)
  }

  const total = baris.reduce((a, row) => a + nilai(row.k.id, row.bisa) * (row.amb?.hargaPerPcs ?? 0), 0)

  function simpan() {
    const lines = baris
      .map((row) => ({ pekerjaanId: row.k.id, qty: nilai(row.k.id, row.bisa) }))
      .filter((l) => l.qty > 0)
    const r = data.buatTagihan({ pabrikId, tanggal, catatan, lines })
    if (say(r, "Tagihan dibuat. Bisa dicetak dari menu Nota.")) onClose()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <Field label="Pabrik">
        <Select value={pabrikId} onChange={(e) => setPabrikId(e.target.value)}>
          {data.pabrik.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tanggal tagihan">
        <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </Field>
      {baris.length === 0 ? (
        <p className="mb-3 text-sm leading-6 text-muted">Belum ada setoran yang belum ditagih untuk pabrik ini.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {baris.map((row) => {
            const checked = on[row.k.id] !== false
            return (
              <li key={row.k.id} className="rounded-xl border border-line p-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={checked}
                    onChange={(e) => setOn((s) => ({ ...s, [row.k.id]: e.target.checked }))}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {namaDari(data.model, row.amb?.modelId ?? "")} · {namaDari(data.penjahit, row.k.penjahitId)}
                    </span>
                    <span className="block text-xs text-muted">
                      {row.k.nomor} · bisa ditagih {row.bisa} pcs · {rupiah(row.amb?.hargaPerPcs ?? 0)}
                    </span>
                  </span>
                </label>
                {checked ? (
                  <TextInput
                    className="mt-2"
                    inputMode="numeric"
                    value={qty[row.k.id] ?? String(row.bisa)}
                    onChange={(e) => setQty((s) => ({ ...s, [row.k.id]: e.target.value }))}
                    aria-label="Qty ditagih"
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      <p className="mb-3 text-sm">
        Total tagihan: <span className="font-semibold tabular-nums">{rupiah(total)}</span>
      </p>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misalnya pcs rusak yang tidak ditagih" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Buat tagihan</Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}

export function TerimaDialog({ open, onClose, pabrikAwal }: { open: boolean; onClose: () => void; pabrikAwal?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Terima uang pabrik">
      {open ? <TerimaForm key={pabrikAwal ?? "baru"} pabrikAwal={pabrikAwal} onClose={onClose} /> : null}
    </Modal>
  )
}

function TerimaForm({ pabrikAwal, onClose }: { pabrikAwal?: string; onClose: () => void }) {
  const data = useBuku()
  const [pabrikId, setPabrikId] = useState(pabrikAwal || data.pabrik[0]?.id || "")
  const [jenis, setJenis] = useState<"terima_pabrik" | "muka_pabrik">("terima_pabrik")
  const tagihan = data.tagihan.filter((t) => t.pabrikId === pabrikId)
  const [tagihanId, setTagihanId] = useState("")
  const sisa = (() => {
    const t = tagihan.find((x) => x.id === tagihanId)
    if (!t) return 0
    return Math.max(0, nilaiTagihan(t) - terimaTagihan(t.id, data.kas))
  })()
  const [jumlah, setJumlah] = useState("")
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")

  function simpan() {
    const r = data.terimaPabrik({
      pabrikId,
      tanggal,
      jumlah: Number(jumlah.replace(/\D/g, "")),
      jenis,
      tagihanId: jenis === "terima_pabrik" ? tagihanId : "",
      catatan,
    })
    if (say(r, "Uang masuk dicatat. Kas bertambah.")) onClose()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <Field label="Pabrik">
        <Select
          value={pabrikId}
          onChange={(e) => {
            setPabrikId(e.target.value)
            setTagihanId("")
          }}
        >
          {data.pabrik.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setJenis("terima_pabrik")}
          className={
            jenis === "terima_pabrik"
              ? "h-11 rounded-xl bg-pine text-sm font-semibold text-pine-fg"
              : "h-11 rounded-xl border border-line text-sm font-semibold"
          }
        >
          Pelunasan
        </button>
        <button
          type="button"
          onClick={() => setJenis("muka_pabrik")}
          className={
            jenis === "muka_pabrik"
              ? "h-11 rounded-xl bg-pine text-sm font-semibold text-pine-fg"
              : "h-11 rounded-xl border border-line text-sm font-semibold"
          }
        >
          Bayar duluan
        </button>
      </div>
      <p className="mb-3 text-xs leading-5 text-muted">
        {jenis === "muka_pabrik"
          ? "Pakai ini kalau pabrik transfer sebelum tagihan terbit. Nanti mengurangi sisa yang harus mereka bayar."
          : "Pakai ini kalau pabrik membayar tagihan. Boleh dikaitkan ke satu nota."}
      </p>
      {jenis === "terima_pabrik" ? (
        <Field label="Kaitkan ke tagihan" hint="Boleh dikosongkan kalau uangnya untuk saldo pabrik secara umum.">
          <Select value={tagihanId} onChange={(e) => setTagihanId(e.target.value)}>
            <option value="">Tidak dikaitkan</option>
            {tagihan.map((t) => {
              const s = nilaiTagihan(t) - terimaTagihan(t.id, data.kas)
              return (
                <option key={t.id} value={t.id}>
                  {t.nomor} · sisa {rupiah(s)}
                </option>
              )
            })}
          </Select>
        </Field>
      ) : null}
      <Field label="Jumlah diterima" hint={sisa > 0 ? `Sisa tagihan yang dipilih ${rupiah(sisa)}.` : undefined}>
        <TextInput
          inputMode="numeric"
          value={jumlah}
          placeholder={sisa > 0 ? String(sisa) : "0"}
          onChange={(e) => setJumlah(e.target.value)}
        />
      </Field>
      <Field label="Tanggal">
        <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </Field>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="pine">
          Simpan
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}

export function BayarDialog({ open, onClose, penjahitAwal }: { open: boolean; onClose: () => void; penjahitAwal?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Bayar upah penjahit" wide>
      {open ? <BayarForm key={penjahitAwal ?? "baru"} penjahitAwal={penjahitAwal} onClose={onClose} /> : null}
    </Modal>
  )
}

function BayarForm({ penjahitAwal, onClose }: { penjahitAwal?: string; onClose: () => void }) {
  const data = useBuku()
  const awalPenjahit =
    penjahitAwal ||
    data.penjahit.find((p) => data.pekerjaan.some((k) => k.penjahitId === p.id && qtyBisaBayar(k) > 0))?.id ||
    data.penjahit[0]?.id ||
    ""
  const [penjahitId, setPenjahitId] = useState(awalPenjahit)
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")
  const jobs = data.pekerjaan.filter((k) => k.penjahitId === penjahitId && qtyBisaBayar(k) > 0)
  const [qty, setQty] = useState<Record<string, string>>({})
  const [on, setOn] = useState<Record<string, boolean>>({})
  const kasbon = sisaKasbon(penjahitId, data.kas, data.slip)

  function nilai(id: string, bisa: number) {
    if (on[id] === false) return 0
    const raw = qty[id]
    if (raw == null || raw === "") return bisa
    return Math.min(bisa, Number(raw.replace(/\D/g, "")) || 0)
  }

  const bruto = jobs.reduce((a, k) => a + nilai(k.id, qtyBisaBayar(k)) * k.upahPerPcs, 0)
  const [potongInput, setPotongInput] = useState<string | null>(null)
  const potongDefault = Math.min(kasbon, bruto)
  const potong = potongInput == null ? potongDefault : Math.min(bruto, Number(potongInput.replace(/\D/g, "")) || 0)
  const tunai = Math.max(0, bruto - potong)
  const kas = data.kas.reduce((a, k) => {
    const masuk = k.jenis === "modal" || k.jenis === "terima_pabrik" || k.jenis === "muka_pabrik"
    return a + (masuk ? k.jumlah : -k.jumlah)
  }, 0)

  function simpan() {
    const lines = jobs
      .map((k) => ({ pekerjaanId: k.id, qty: nilai(k.id, qtyBisaBayar(k)) }))
      .filter((l) => l.qty > 0)
    const r = data.bayarUpah({ penjahitId, tanggal, catatan, potongKasbon: potong, lines })
    if (say(r, "Upah dicatat. Slip bisa dicetak dari menu Nota.")) onClose()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <Field label="Penjahit">
        <Select
          value={penjahitId}
          onChange={(e) => {
            setPenjahitId(e.target.value)
            setPotongInput(null)
            setQty({})
            setOn({})
          }}
        >
          {data.penjahit.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </Field>
      {jobs.length === 0 ? (
        <p className="mb-3 text-sm leading-6 text-muted">
          Belum ada upah yang jatuh tempo. Catat dulu hasil jahitan yang bagus.
        </p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {jobs.map((k) => {
            const amb = data.pengambilan.find((p) => p.id === k.pengambilanId)
            const bisa = qtyBisaBayar(k)
            const checked = on[k.id] !== false
            return (
              <li key={k.id} className="rounded-xl border border-line p-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={checked}
                    onChange={(e) => setOn((s) => ({ ...s, [k.id]: e.target.checked }))}
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {namaDari(data.model, amb?.modelId ?? "")} · {k.nomor}
                    </span>
                    <span className="block text-xs text-muted">
                      {bisa} pcs × {rupiah(k.upahPerPcs)}
                    </span>
                  </span>
                </label>
                {checked ? (
                  <TextInput
                    className="mt-2"
                    inputMode="numeric"
                    aria-label="Qty dibayar"
                    value={qty[k.id] ?? String(bisa)}
                    onChange={(e) => setQty((s) => ({ ...s, [k.id]: e.target.value }))}
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      <Field label="Potong kasbon" hint={`Sisa kasbon ${rupiah(kasbon)}. Tidak mengurangi kas lagi karena uangnya sudah keluar waktu kasbon.`}>
        <TextInput
          inputMode="numeric"
          value={potongInput ?? String(potongDefault)}
          onChange={(e) => setPotongInput(e.target.value)}
        />
      </Field>
      <div className="mb-3 rounded-xl bg-ink-soft p-3 text-sm leading-6">
        <p>Upah kotor: <span className="tabular-nums">{rupiah(bruto)}</span></p>
        <p>Potong kasbon: <span className="tabular-nums">{rupiah(potong)}</span></p>
        <p className="font-semibold">Tunai yang diberikan: <span className="tabular-nums">{rupiah(tunai)}</span></p>
        {tunai > kas ? (
          <p className="mt-1 text-primary">
            Kas sekarang {rupiah(kas)}. Setelah ini kas minus {rupiah(tunai - kas)} — itu uang pribadi yang belum balik.
          </p>
        ) : null}
      </div>
      <Field label="Tanggal">
        <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </Field>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Simpan & buat slip</Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}

export function KasbonDialog({ open, onClose, penjahitAwal }: { open: boolean; onClose: () => void; penjahitAwal?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Kasbon penjahit">
      {open ? <KasbonForm key={penjahitAwal ?? "baru"} penjahitAwal={penjahitAwal} onClose={onClose} /> : null}
    </Modal>
  )
}

function KasbonForm({ penjahitAwal, onClose }: { penjahitAwal?: string; onClose: () => void }) {
  const data = useBuku()
  const [penjahitId, setPenjahitId] = useState(penjahitAwal || data.penjahit[0]?.id || "")
  const [jumlah, setJumlah] = useState("")
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const r = data.kasihKasbon({
          penjahitId,
          tanggal,
          jumlah: Number(jumlah.replace(/\D/g, "")),
          catatan,
        })
        if (say(r, "Kasbon dicatat. Nanti dipotong saat bayar upah.")) onClose()
      }}
    >
      <Field label="Penjahit">
        <Select value={penjahitId} onChange={(e) => setPenjahitId(e.target.value)}>
          {data.penjahit.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Jumlah kasbon" hint="Uang ini keluar sekarang. Saat Sabtu, potong dari upah supaya tidak dibayar dua kali.">
        <TextInput inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="100000" />
      </Field>
      <Field label="Tanggal">
        <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </Field>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}

export function PribadiDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useBuku()
  const [jenis, setJenis] = useState<"modal" | "tarik">("modal")
  const [jumlah, setJumlah] = useState("")
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")
  return (
    <Modal open={open} onClose={onClose} title="Uang pribadi">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = data.uangPribadi({
              jenis,
              tanggal,
              jumlah: Number(jumlah.replace(/\D/g, "")),
              catatan,
            })
            if (say(r, jenis === "modal" ? "Uang pribadi masuk ke kas." : "Uang ditarik ke dompet.")) onClose()
          }}
        >
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setJenis("modal")}
              className={
                jenis === "modal"
                  ? "h-11 rounded-xl bg-fg text-sm font-semibold text-surface"
                  : "h-11 rounded-xl border border-line text-sm font-semibold"
              }
            >
              Masukkan ke kas
            </button>
            <button
              type="button"
              onClick={() => setJenis("tarik")}
              className={
                jenis === "tarik"
                  ? "h-11 rounded-xl bg-fg text-sm font-semibold text-surface"
                  : "h-11 rounded-xl border border-line text-sm font-semibold"
              }
            >
              Tarik ke dompet
            </button>
          </div>
          <p className="mb-3 text-xs leading-5 text-muted">
            Kalau bayar penjahit dulu dan kas jadi minus, itu sudah terhitung uang pribadi. Formulir ini untuk mencatat
            setoran atau penarikan yang memang sengaja.
          </p>
          <Field label="Jumlah">
            <TextInput inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
          </Field>
          <Field label="Tanggal">
            <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </Field>
          <Field label="Catatan">
            <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
