import { useState } from "react"
import { Button } from "@/components/ui"
import { useBuku } from "@/lib/store"

export function ContohBanner() {
  const contoh = useBuku((s) => s.contoh)
  const kosongkan = useBuku((s) => s.kosongkan)
  const [sembunyi, setSembunyi] = useState(false)
  if (!contoh || sembunyi) return null
  return (
    <div className="mb-5 rounded-2xl border border-line bg-sunken px-4 py-3">
      <p className="text-sm leading-6">
        Angka di layar ini contoh, supaya alur ambil–jahit–tagih kebaca. Hapus dulu kalau mau mulai catatan sendiri.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm("Hapus semua data contoh dan mulai dari kosong?")) kosongkan()
          }}
        >
          Mulai dari kosong
        </Button>
        <Button variant="ghost" onClick={() => setSembunyi(true)}>
          Nanti saja
        </Button>
      </div>
    </div>
  )
}
