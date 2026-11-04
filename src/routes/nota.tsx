import { createFileRoute } from "@tanstack/react-router"
import { NotaPage } from "@/views/nota"

export const Route = createFileRoute("/nota")({
  head: () => ({ meta: [{ title: "Nota · Buku Makloon" }] }),
  component: NotaPage,
})
