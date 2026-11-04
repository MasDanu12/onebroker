import { createFileRoute } from "@tanstack/react-router"
import { KasPage } from "@/views/kas"

export const Route = createFileRoute("/kas")({
  head: () => ({ meta: [{ title: "Kas · Buku Makloon" }] }),
  component: KasPage,
})
