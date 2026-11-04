import { useState } from "react"
import { toast } from "sonner"
import { PilihAtauBaru } from "@/components/pick"
import { Area, Button, Field, Modal, TextInput } from "@/components/ui"
import { namaDari, sisaPotongan } from "@/lib/calc"
import { jakartaToday, rupiah } from "@/lib/format"
import { useBuku } from "@/lib/store"

function say(result: { ok: boolean; error?: string }, sukses: string) {
  if (!result.ok) {
    toast.error(result.ok ? "" : result.error)
    return false
  }
  toast.success(sukses)
  return true
}

export function AmbilDialog({
  open,
  onClose,
  editId,
}: {
  open: boolean
  onClose: () => void
  editId?: string
}) {
  return (
    <Modal open={open} onClose={onClose} title={editId ? "Ubah pengambilan" : "Ambil potongan"}>
      {open ? <AmbilForm key={editId ?? "baru"} editId={editId} onClose={onClose} /> : null}
    </Modal>
  )
}

function AmbilForm({ editId, onClose }: { editId?: string; onClose: () => void }) {
  const data = useBuku()
  const lama = data.pengambilan.find((p) => p.id === editId)
  const [tanggal, setTanggal] = useState(lama?.tanggal ?? jakartaToday())
  const [pabrikId, setPabrikId] = useState(lama?.pabrikId ?? data.pabrik[0]?.id ?? "")
  const [modelId, setModelId] = useState(lama?.modelId ?? data.model[0]?.id ?? "")
  const [qty, setQty] = useState(String(lama?.qty ?? ""))
  const [harga, setHarga] = useState(String(lama?.hargaPerPcs ?? data.model[0]?.hargaPabrik ?? ""))
  const [catatan, setCatatan] = useState(lama?.catatan ?? "")
  const [pabrikBaru, setPabrikBaru] = useState(false)
  const [namaPabrik, setNamaPabrik] = useState("")
  const [modelBaru, setModelBaru] = useState(false)
  const [namaModel, setNamaModel] = useState("")

  function pilihModel(id: string) {
    setModelId(id)
    const m = data.model.find((x) => x.id === id)
    if (m && !lama) setHarga(String(m.hargaPabrik))
  }

  function simpan() {
    let pid = pabrikId
    if (pabrikBaru) {
      const r = data.simpanPabrik({ nama: namaPabrik, telepon: "", alamat: "", catatan: "" })
      if (!r.ok || !r.id) return say(r, "")
      pid = r.id
    }
    let mid = modelId
    if (modelBaru) {
      const hargaAwal = Number(harga.replace(/\D/g, "")) || 0
      const r = data.simpanModel({ nama: namaModel, hargaPabrik: hargaAwal, upahJahit: 0 })
      if (!r.ok || !r.id) return say(r, "")
      mid = r.id
    }
    const r = data.ambilPotongan({
      id: editId,
      tanggal,
      pabrikId: pid,
      modelId: mid,
      qty: Number(qty.replace(/\D/g, "")),
      hargaPerPcs: Number(harga.replace(/\D/g, "")),
      catatan,
    })
    if (say(r, editId ? "Pengambilan diubah." : "Potongan dicatat.")) onClose()
  }

  const q = Number(qty.replace(/\D/g, "")) || 0
  const h = Number(harga.replace(/\D/g, "")) || 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <Field label="Tanggal ambil">
        <TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
      </Field>
      <PilihAtauBaru
        label="Pabrik"
        value={pabrikId}
        onChange={setPabrikId}
        options={data.pabrik}
        baru={pabrikBaru}
        onBaru={setPabrikBaru}
        namaBaru={namaPabrik}
        onNama={setNamaPabrik}
        kosong="Pilih pabrik"
      />
      <PilihAtauBaru
        label="Model"
        value={modelId}
        onChange={pilihModel}
        options={data.model}
        baru={modelBaru}
        onBaru={setModelBaru}
        namaBaru={namaModel}
        onNama={setNamaModel}
        kosong="Pilih model"
      />
      <Field label="Qty (pcs)">
        <TextInput inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="100" required />
      </Field>
      <Field label="Ongkos dari pabrik per pcs" hint="Ini harga yang nanti ditagihkan, bukan uang yang keluar sekarang.">
        <TextInput inputMode="numeric" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="5000" />
      </Field>
      <p className="mb-3 text-sm text-muted">
        Perkiraan tagihan kalau semua beres: <span className="font-semibold text-fg tabular-nums">{rupiah(q * h)}</span>
      </p>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Warna, no PO, atau catatan lain" />
      </Field>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        {editId ? (
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm("Hapus pengambilan ini?")) return
              const r = data.hapusPengambilan(editId)
              if (say(r, "Pengambilan dihapus.")) onClose()
            }}
          >
            Hapus
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export function BagiDialog({
  open,
  onClose,
  awalPengambilanId,
}: {
  open: boolean
  onClose: () => void
  awalPengambilanId?: string
}) {
  return (
    <Modal open={open} onClose={onClose} title="Bagi ke penjahit">
      {open ? <BagiForm key={awalPengambilanId ?? "baru"} awalPengambilanId={awalPengambilanId} onClose={onClose} /> : null}
    </Modal>
  )
}

function BagiForm({ awalPengambilanId, onClose }: { awalPengambilanId?: string; onClose: () => void }) {
  const data = useBuku()
  const siap = data.pengambilan
    .map((p) => ({ ...p, sisa: sisaPotongan(p, data.pekerjaan) }))
    .filter((p) => p.sisa > 0)
  const awal = siap.find((p) => p.id === awalPengambilanId) ?? siap[0]
  const [pengambilanId, setPengambilanId] = useState(awal?.id ?? "")
  const current = siap.find((p) => p.id === pengambilanId) ?? awal
  const model = data.model.find((m) => m.id === current?.modelId)
  const [penjahitId, setPenjahitId] = useState(data.penjahit[0]?.id ?? "")
  const [baru, setBaru] = useState(false)
  const [namaBaru, setNamaBaru] = useState("")
  const [qty, setQty] = useState(String(current?.sisa ?? ""))
  const [upah, setUpah] = useState(String(model?.upahJahit ?? ""))
  const [tanggal, setTanggal] = useState(jakartaToday())
  const [catatan, setCatatan] = useState("")

  function gantiPotongan(id: string) {
    setPengambilanId(id)
    const p = siap.find((x) => x.id === id)
    const m = data.model.find((x) => x.id === p?.modelId)
    setQty(String(p?.sisa ?? ""))
    if (m) setUpah(String(m.upahJahit))
  }

  function simpan() {
    let pid = penjahitId
    if (baru) {
      const r = data.simpanPenjahit({ nama: namaBaru, telepon: "", alamat: "", catatan: "" })
      if (!r.ok || !r.id) return say(r, "")
      pid = r.id
    }
    const r = data.bagiKerja({
      pengambilanId,
      penjahitId: pid,
      tanggal,
      qty: Number(qty.replace(/\D/g, "")),
      upahPerPcs: Number(upah.replace(/\D/g, "")),
      catatan,
    })
    if (say(r, "Potongan sudah dibagi.")) onClose()
  }

  if (siap.length === 0) {
    return <p className="text-sm leading-6 text-muted">Semua potongan sudah dibagi. Ambil dulu dari pabrik kalau ada order baru.</p>
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <Field label="Potongan">
        <select className="h-11 w-full rounded-xl border border-line bg-surface px-3" value={pengambilanId} onChange={(e) => gantiPotongan(e.target.value)}>
          {siap.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nomor} · {namaDari(data.model, p.modelId)} · {namaDari(data.pabrik, p.pabrikId)} · sisa {p.sisa}
            </option>
          ))}
        </select>
      </Field>
      <PilihAtauBaru
        label="Penjahit"
        value={penjahitId}
        onChange={setPenjahitId}
        options={data.penjahit}
        baru={baru}
        onBaru={setBaru}
        namaBaru={namaBaru}
        onNama={setNamaBaru}
        kosong="Pilih penjahit"
      />
      <Field label="Qty yang dibagi" hint={current ? `Maksimal ${current.sisa} pcs.` : undefined}>
        <TextInput inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Upah per pcs">
        <TextInput inputMode="numeric" value={upah} onChange={(e) => setUpah(e.target.value)} />
      </Field>
      <Field label="Tanggal bagi">
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

export function HasilDialog({ open, onClose, kerjaId }: { open: boolean; onClose: () => void; kerjaId?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Catat hasil jahitan" wide>
      {open && kerjaId ? <HasilForm key={kerjaId} kerjaId={kerjaId} onClose={onClose} /> : null}
    </Modal>
  )
}

function HasilForm({ kerjaId, onClose }: { kerjaId: string; onClose: () => void }) {
  const data = useBuku()
  const k = data.pekerjaan.find((x) => x.id === kerjaId)
  const amb = data.pengambilan.find((p) => p.id === k?.pengambilanId)
  const [penjahitId, setPenjahitId] = useState(k?.penjahitId ?? "")
  const [qty, setQty] = useState(String(k?.qty ?? ""))
  const [upah, setUpah] = useState(String(k?.upahPerPcs ?? ""))
  const [bagus, setBagus] = useState(String(k?.qtySelesai ?? 0))
  const [rusak, setRusak] = useState(String(k?.qtyRusak ?? 0))
  const [setor, setSetor] = useState(String(k?.qtySetor ?? 0))
  const [tanggalBagi, setTanggalBagi] = useState(k?.tanggalBagi ?? jakartaToday())
  const [tanggalSelesai, setTanggalSelesai] = useState(k?.tanggalSelesai || jakartaToday())
  const [tanggalSetor, setTanggalSetor] = useState(k?.tanggalSetor || jakartaToday())
  const [catatan, setCatatan] = useState(k?.catatan ?? "")

  if (!k || !amb) return <p>Pekerjaan tidak ditemukan.</p>
  const kerja = k

  const q = Number(qty.replace(/\D/g, "")) || 0
  const b = Number(bagus.replace(/\D/g, "")) || 0
  const rsk = Number(rusak.replace(/\D/g, "")) || 0

  function simpan() {
    const result = data.ubahKerja(kerja.id, {
      penjahitId,
      tanggalBagi,
      qty: q,
      upahPerPcs: Number(upah.replace(/\D/g, "")) || 0,
      qtySelesai: b,
      qtyRusak: rsk,
      tanggalSelesai,
      qtySetor: Number(setor.replace(/\D/g, "")) || 0,
      tanggalSetor,
      catatan,
    })
    if (say(result, "Hasil jahitan disimpan.")) onClose()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        simpan()
      }}
    >
      <p className="mb-3 text-sm text-muted">
        {kerja.nomor} · {namaDari(data.model, amb.modelId)} · {namaDari(data.pabrik, amb.pabrikId)} · ongkos {rupiah(amb.hargaPerPcs)}
      </p>
      <Field label="Penjahit">
        <select className="h-11 w-full rounded-xl border border-line bg-surface px-3" value={penjahitId} onChange={(e) => setPenjahitId(e.target.value)}>
          {data.penjahit.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Qty dipegang">
          <TextInput inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Upah per pcs">
          <TextInput inputMode="numeric" value={upah} onChange={(e) => setUpah(e.target.value)} />
        </Field>
        <Field label="Bagus">
          <TextInput inputMode="numeric" value={bagus} onChange={(e) => setBagus(e.target.value)} />
        </Field>
        <Field label="Rusak / hilang">
          <TextInput inputMode="numeric" value={rusak} onChange={(e) => setRusak(e.target.value)} />
        </Field>
      </div>
      <p className="mb-3 text-sm text-muted">Masih di penjahit: {Math.max(0, q - b - rsk)} pcs. Upah dihitung dari yang bagus.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setRusak("0")
            setBagus(String(q))
          }}
        >
          Bagus semua
        </Button>
        <Button variant="outline" onClick={() => setSetor(String(b))}>
          Setor semua yang bagus
        </Button>
      </div>
      <Field label="Sudah disetor ke pabrik" hint="Yang disetor ini yang bisa ditagihkan.">
        <TextInput inputMode="numeric" value={setor} onChange={(e) => setSetor(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tanggal bagi">
          <TextInput type="date" value={tanggalBagi} onChange={(e) => setTanggalBagi(e.target.value)} />
        </Field>
        <Field label="Tanggal selesai">
          <TextInput type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
        </Field>
        <Field label="Tanggal setor">
          <TextInput type="date" value={tanggalSetor} onChange={(e) => setTanggalSetor(e.target.value)} />
        </Field>
      </div>
      <Field label="Catatan">
        <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("Hapus pekerjaan ini?")) return
            const result = data.hapusKerja(kerja.id)
            if (say(result, "Pekerjaan dihapus.")) onClose()
          }}
        >
          Hapus
        </Button>
      </div>
    </form>
  )
}
