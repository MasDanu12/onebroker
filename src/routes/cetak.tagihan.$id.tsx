import { createFileRoute } from "@tanstack/react-router"
import { CetakTagihan } from "@/views/cetak"

export const Route = createFileRoute("/cetak/tagihan/$id")({
  head: () => ({ meta: [{ title: "Tagihan · Buku Makloon" }] }),
  component: function Halaman() {
    const { id } = Route.useParams()
    return <CetakTagihan id={id} />
  },
})
