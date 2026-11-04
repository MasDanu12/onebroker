import { Link, useRouterState } from "@tanstack/react-router"
import { FileText, LayoutDashboard, Package, Scissors, Settings, Wallet } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/components/ui"
import { useBuku } from "@/lib/store"

const NAV = [
  { to: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { to: "/potongan", label: "Potong", icon: Package, exact: false },
  { to: "/kerja", label: "Kerja", icon: Scissors, exact: false },
  { to: "/kas", label: "Kas", icon: Wallet, exact: false },
  { to: "/nota", label: "Nota", icon: FileText, exact: false },
] as const

function useReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let live = true
    const finish = () => {
      if (live) setReady(true)
    }
    const unsub = useBuku.persist.onFinishHydration(finish)
    void Promise.resolve(useBuku.persist.rehydrate()).then(finish, finish)
    return () => {
      live = false
      unsub()
    }
  }, [])
  return ready
}

export function AppShell({ children }: { children: ReactNode }) {
  const ready = useReady()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const nama = useBuku((s) => s.profil.nama)
  const cetak = path.startsWith("/cetak")

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-6 text-center text-fg">
        <div>
          <p className="font-display text-3xl">Buku Makloon</p>
          <p className="mt-2 text-sm text-muted">Membuka catatan…</p>
        </div>
      </div>
    )
  }

  if (cetak) {
    const back = path.includes("/ambil/") ? "/potongan" : "/nota"
    return (
      <div className="min-h-screen bg-bg text-fg">
        <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <Link to={back} className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-pine">
            Kembali
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg"
          >
            Cetak / simpan PDF
          </button>
        </div>
        <div className="px-4 py-6 print:p-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="border-b border-line px-5 py-5">
          <p className="font-display text-2xl leading-none">Buku Makloon</p>
          <p className="mt-2 truncate text-sm text-muted">{nama}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} path={path} />
          ))}
          <NavLink to="/data" label="Data usaha" icon={Settings} exact={false} path={path} />
        </nav>
      </aside>

      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg px-4 py-3 md:hidden">
        <div>
          <p className="font-display text-xl leading-none">Buku Makloon</p>
          <p className="mt-1 max-w-52 truncate text-xs text-muted">{nama}</p>
        </div>
        <Link
          to="/data"
          aria-label="Data usaha"
          className="grid size-11 place-items-center rounded-xl border border-line bg-surface"
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <main className="pb-28 md:pb-10 md:pl-60">{children}</main>

      <nav className="dock no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const on = item.exact ? path === item.to : path.startsWith(item.to)
            const Icon = item.icon
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold",
                    on ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function NavLink({
  to,
  label,
  icon: Icon,
  exact,
  path,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
  path: string
}) {
  const on = exact ? path === to : path.startsWith(to)
  return (
    <Link
      to={to}
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
        on ? "bg-fg text-surface" : "text-fg hover:bg-ink-soft",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  )
}
