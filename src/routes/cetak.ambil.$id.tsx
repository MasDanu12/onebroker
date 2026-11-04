import { createFileRoute } from "@tanstack/react-router"
import { CetakAmbil } from "@/views/cetak"

export const Route = createFileRoute("/cetak/ambil/$id")({
  head: () => ({ meta: [{ title: "Nota ambil · Buku Makloon" }] }),
  component: function Halaman() {
    const { id } = Route.useParams()
    return <CetakAmbil id={id} />
  },
})
