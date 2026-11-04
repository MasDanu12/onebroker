import { createFileRoute } from "@tanstack/react-router"
import { PotonganPage } from "@/views/potongan"

export const Route = createFileRoute("/potongan")({
  head: () => ({ meta: [{ title: "Potongan · Buku Makloon" }] }),
  component: PotonganPage,
})
