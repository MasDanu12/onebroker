import { createFileRoute } from "@tanstack/react-router"
import { PenjahitPage } from "@/views/penjahit"

export const Route = createFileRoute("/penjahit")({
  head: () => ({ meta: [{ title: "Penjahit · Buku Makloon" }] }),
  component: PenjahitPage,
})
