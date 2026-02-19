import * as React from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
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
        className="absolute right-3 top-3 rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
))
DialogContent.displayName = 'DialogContent'

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

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

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
