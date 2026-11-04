import { createFileRoute } from "@tanstack/react-router"
import { DataPage } from "@/views/data"

export const Route = createFileRoute("/data")({
  head: () => ({ meta: [{ title: "Data usaha · Buku Makloon" }] }),
  component: DataPage,
})
