import { useState } from "react"
import { toast } from "sonner"
import { Area, Button, Field, Modal, TextInput } from "@/components/ui"
import { HARI } from "@/lib/format"
import { useBuku } from "@/lib/store"
import type { ModelHijab, Pabrik, Penjahit } from "@/lib/types"

function say(result: { ok: boolean; error?: string }, sukses: string) {
  if (!result.ok) {
    toast.error(result.error ?? "Gagal menyimpan.")
    return false
  }
  toast.success(sukses)
  return true
}

export function ProfilDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profil = useBuku((s) => s.profil)
  const simpanProfil = useBuku((s) => s.simpanProfil)
  const [nama, setNama] = useState(profil.nama)
  const [pemilik, setPemilik] = useState(profil.pemilik)
  const [telepon, setTelepon] = useState(profil.telepon)
  const [alamat, setAlamat] = useState(profil.alamat)
  const [hari, setHari] = useState(String(profil.hariBayar))
  return (
    <Modal open={open} onClose={onClose} title="Profil usaha">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = simpanProfil({
              nama,
              pemilik,
              telepon,
              alamat,
              hariBayar: Number(hari),
            })
            if (say(r, "Profil disimpan. Nama ini yang tercetak di nota.")) onClose()
          }}
        >
          <Field label="Nama usaha">
            <TextInput value={nama} onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Nama pemilik" hint="Muncul di kolom tanda tangan.">
            <TextInput value={pemilik} onChange={(e) => setPemilik(e.target.value)} />
          </Field>
          <Field label="Telepon">
            <TextInput value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field label="Alamat">
            <Area value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          </Field>
          <Field label="Hari bayar upah">
            <select className="h-11 w-full rounded-xl border border-line bg-surface px-3" value={hari} onChange={(e) => setHari(e.target.value)}>
              {HARI.map((h, i) => (
                <option key={h} value={i}>
                  {h}
                </option>
              ))}
            </select>
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

export function PabrikDialog({
  open,
  onClose,
  awal,
}: {
  open: boolean
  onClose: () => void
  awal?: Pabrik
}) {
  const simpan = useBuku((s) => s.simpanPabrik)
  const hapus = useBuku((s) => s.hapusPabrik)
  const [nama, setNama] = useState(awal?.nama ?? "")
  const [telepon, setTelepon] = useState(awal?.telepon ?? "")
  const [alamat, setAlamat] = useState(awal?.alamat ?? "")
  const [catatan, setCatatan] = useState(awal?.catatan ?? "")
  return (
    <Modal open={open} onClose={onClose} title={awal ? "Ubah pabrik" : "Tambah pabrik"}>
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = simpan({ id: awal?.id, nama, telepon, alamat, catatan })
            if (say(r, "Pabrik disimpan.")) onClose()
          }}
        >
          <Field label="Nama">
            <TextInput value={nama} onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Telepon">
            <TextInput value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field label="Alamat">
            <TextInput value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          </Field>
          <Field label="Catatan">
            <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Simpan</Button>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            {awal ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Hapus pabrik ini?")) return
                  const r = hapus(awal.id)
                  if (say(r, "Pabrik dihapus.")) onClose()
                }}
              >
                Hapus
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  )
}

export function PenjahitDialog({
  open,
  onClose,
  awal,
}: {
  open: boolean
  onClose: () => void
  awal?: Penjahit
}) {
  const simpan = useBuku((s) => s.simpanPenjahit)
  const hapus = useBuku((s) => s.hapusPenjahit)
  const [nama, setNama] = useState(awal?.nama ?? "")
  const [telepon, setTelepon] = useState(awal?.telepon ?? "")
  const [alamat, setAlamat] = useState(awal?.alamat ?? "")
  const [catatan, setCatatan] = useState(awal?.catatan ?? "")
  return (
    <Modal open={open} onClose={onClose} title={awal ? "Ubah penjahit" : "Tambah penjahit"}>
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = simpan({ id: awal?.id, nama, telepon, alamat, catatan })
            if (say(r, "Penjahit disimpan.")) onClose()
          }}
        >
          <Field label="Nama">
            <TextInput value={nama} onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Telepon">
            <TextInput value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field label="Alamat">
            <TextInput value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          </Field>
          <Field label="Catatan">
            <Area value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Simpan</Button>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            {awal ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Hapus penjahit ini?")) return
                  const r = hapus(awal.id)
                  if (say(r, "Penjahit dihapus.")) onClose()
                }}
              >
                Hapus
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  )
}

export function ModelDialog({
  open,
  onClose,
  awal,
}: {
  open: boolean
  onClose: () => void
  awal?: ModelHijab
}) {
  const simpan = useBuku((s) => s.simpanModel)
  const hapus = useBuku((s) => s.hapusModel)
  const [nama, setNama] = useState(awal?.nama ?? "")
  const [harga, setHarga] = useState(awal ? String(awal.hargaPabrik) : "")
  const [upah, setUpah] = useState(awal ? String(awal.upahJahit) : "")
  return (
    <Modal open={open} onClose={onClose} title={awal ? "Ubah model" : "Tambah model"}>
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const r = simpan({
              id: awal?.id,
              nama,
              hargaPabrik: Number(harga.replace(/\D/g, "")),
              upahJahit: Number(upah.replace(/\D/g, "")),
            })
            if (say(r, "Model disimpan.")) onClose()
          }}
        >
          <Field label="Nama model" hint="Contoh: segi empat, pashmina, bergo.">
            <TextInput value={nama} onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Ongkos dari pabrik per pcs" hint="Dipakai sebagai isi otomatis saat ambil potongan. Order lama tidak berubah.">
            <TextInput inputMode="numeric" value={harga} onChange={(e) => setHarga(e.target.value)} />
          </Field>
          <Field label="Upah penjahit per pcs">
            <TextInput inputMode="numeric" value={upah} onChange={(e) => setUpah(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Simpan</Button>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            {awal ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Hapus model ini?")) return
                  const r = hapus(awal.id)
                  if (say(r, "Model dihapus.")) onClose()
                }}
              >
                Hapus
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
