import * as React from 'react'
import { useEffect, useRef, useCallback, useId } from 'react'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

/* ─── Focus trap utility ────────────────────────────────────────────────── */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Save the previously focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    if (!container) return

    // Focus the first focusable element inside the dialog
    requestAnimationFrame(() => {
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      if (firstFocusable) {
        firstFocusable.focus()
      } else {
        // If no focusable element, focus the container itself
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      )
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that triggered the dialog
      previousFocusRef.current?.focus()
    }
  }, [active, containerRef])
}

/* ─── Dialog Context for ARIA IDs ────────────────────────────────────── */

interface DialogContextValue {
  titleId: string
  descriptionId: string
}

const DialogIdContext = React.createContext<DialogContextValue | null>(null)

/* ─── Dialog Root ────────────────────────────────────────────────────── */

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const uniqueId = useId()
  const titleId = `dialog-title-${uniqueId}`
  const descriptionId = `dialog-desc-${uniqueId}`

  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <DialogIdContext.Provider value={{ titleId, descriptionId }}>
      <div
        ref={dialogRef}
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
          onClick={() => onOpenChange(false)}
        />
        <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
          {children}
        </div>
      </div>
    </DialogIdContext.Provider>
  )
}

/* ─── Dialog Content ─────────────────────────────────────────────────── */

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => {
  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  return (
    <div
      ref={ref}
      className={cn(
        'relative z-50 w-full sm:max-w-lg bg-background shadow-lg',
        'max-h-[85vh] sm:max-h-[90vh] overflow-y-auto',
        'rounded-t-2xl sm:rounded-xl',
        'p-4 pt-6 sm:p-6',
        'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in-0 sm:zoom-in-95 duration-200',
        'border-t sm:border',
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/20 sm:hidden" />
      {children}
      {onClose && (
        <button
          className="absolute right-3 top-3 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={handleClose}
          aria-label="Cerrar dialogo"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})
DialogContent.displayName = 'DialogContent'

/* ─── Dialog Header ──────────────────────────────────────────────────── */

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 text-center sm:text-left',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  )
}

/* ─── Dialog Title (linked via aria-labelledby) ──────────────────────── */

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const ctx = React.useContext(DialogIdContext)
  return (
    <h2
      id={ctx?.titleId}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

/* ─── Dialog Description (linked via aria-describedby) ───────────────── */

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const ctx = React.useContext(DialogIdContext)
  return (
    <p
      id={ctx?.descriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/* ─── Dialog Footer ──────────────────────────────────────────────────── */

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4',
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
