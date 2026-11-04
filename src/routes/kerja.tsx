import { createFileRoute } from "@tanstack/react-router"
import { KerjaPage } from "@/views/kerja"

export const Route = createFileRoute("/kerja")({
  head: () => ({ meta: [{ title: "Pekerjaan · Buku Makloon" }] }),
  component: KerjaPage,
})
