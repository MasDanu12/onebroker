import { createFileRoute } from "@tanstack/react-router"
import { CetakSlip } from "@/views/cetak"

export const Route = createFileRoute("/cetak/slip/$id")({
  head: () => ({ meta: [{ title: "Slip upah · Buku Makloon" }] }),
  component: function Halaman() {
    const { id } = Route.useParams()
    return <CetakSlip id={id} />
  },
})
