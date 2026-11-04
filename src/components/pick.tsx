import { Field, Select, TextInput } from "@/components/ui"

export function PilihAtauBaru({
  label,
  value,
  onChange,
  options,
  baru,
  onBaru,
  namaBaru,
  onNama,
  kosong,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  options: { id: string; nama: string }[]
  baru: boolean
  onBaru: (v: boolean) => void
  namaBaru: string
  onNama: (v: string) => void
  kosong: string
}) {
  return (
    <Field label={label}>
      <Select
        value={baru ? "__baru" : value}
        onChange={(e) => {
          if (e.target.value === "__baru") onBaru(true)
          else {
            onBaru(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="">{kosong}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nama}
          </option>
        ))}
        <option value="__baru">+ Tambah baru</option>
      </Select>
      {baru ? (
        <TextInput
          className="mt-2"
          value={namaBaru}
          placeholder={`Nama ${label.toLowerCase()}`}
          onChange={(e) => onNama(e.target.value)}
          autoFocus
        />
      ) : null}
    </Field>
  )
}
