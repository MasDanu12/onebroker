import { Link } from "@tanstack/react-router"
import * as Dialog from "@radix-ui/react-dialog"
import { clsx, type ClassValue } from "clsx"
import { X } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import type { StatusKerja } from "@/lib/types"
import { LABEL_STATUS } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = {
  primary: "bg-primary text-primary-fg",
  pine: "bg-pine text-pine-fg",
  ghost: "bg-transparent text-fg hover:bg-sunken",
  outline: "border border-line bg-surface text-fg hover:bg-ink-soft",
  danger: "bg-transparent text-primary hover:bg-rust-soft",
} as const

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants
}

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-fg outline-none focus:border-primary"

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />
}

export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-20 w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-fg outline-none focus:border-primary",
        props.className,
      )}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-fg/40 no-print" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface shadow-lg",
            "inset-x-0 bottom-0 rounded-t-2xl md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
            wide ? "md:max-w-xl" : "md:max-w-md",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <Dialog.Title className="font-display text-2xl leading-tight">{title}</Dialog.Title>
            <Dialog.Close className="grid size-11 place-items-center rounded-xl text-muted hover:bg-sunken" aria-label="Tutup">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const statusClass: Record<StatusKerja, string> = {
  berjalan: "bg-pine-soft text-pine",
  "menunggu-setor": "bg-sunken text-fg",
  "menunggu-tagih": "bg-rust-soft text-primary",
  beres: "bg-ink-soft text-muted",
}

export function StatusBadge({ status }: { status: StatusKerja }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusClass[status])}>
      {LABEL_STATUS[status]}
    </span>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  to,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  to?: "/" | "/potongan" | "/kerja" | "/kas" | "/nota"
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl leading-none tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </>
  )
  const cls = "block rounded-2xl border border-line bg-surface p-4 text-left"
  if (!to) return <article className={cls}>{body}</article>
  return (
    <Link to={to} className={cn(cls, "hover:border-primary")}>
      {body}
    </Link>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function PageHead({
  title,
  lede,
  action,
}: {
  title: string
  lede?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {lede ? <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-5 md:px-8 md:py-8">{children}</div>
}

export function uangClass(masuk: boolean) {
  return masuk ? "text-pine" : "text-primary"
}
