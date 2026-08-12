'use client'

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  position?: 'center' | 'bottom' | 'right'
  title?: string
}

export function Dialog({
  isOpen,
  onClose,
  children,
  className,
  position = 'center',
  title,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const positionClasses = {
    center: 'items-center justify-center p-4',
    bottom: 'items-end justify-center p-0 sm:items-center sm:p-4',
    right: 'items-stretch justify-end p-0',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Ventana emergente"}
      className={cn(
        "fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 select-none",
        positionClasses[position]
      )}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-bg)] text-[var(--reader-text)] shadow-2xl transition-all",
          position === 'right' ? 'h-full rounded-none rounded-l-2xl border-r-0 animate-in slide-in-from-right duration-200' : 'animate-in zoom-in-95 duration-150',
          position === 'bottom' && 'rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom duration-200',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-[var(--reader-border)] pb-3 p-4 sm:p-6",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-neutral-500/15 focus-visible:ring-2 ml-2 shrink-0 active:scale-95"
        >
          <X className="h-5 w-5 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-bold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-6 overflow-y-auto max-h-[75vh]", className)} {...props} />
  )
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[var(--reader-border)] p-4 sm:p-6 pt-3",
        className
      )}
      {...props}
    />
  )
}
