import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    options: { title: '', description: '' },
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve })
    })
  }, [])

  const handleClose = useCallback((value: boolean) => {
    setState((prev) => {
      prev.resolve?.(value)
      return { ...prev, open: false, resolve: null }
    })
  }, [])

  const { options } = state
  const isDestructive = options.variant === 'destructive'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => { if (!open) handleClose(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {isDestructive && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle>{options.title}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  {options.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1 sm:flex-initial"
            >
              {options.cancelLabel || 'Cancelar'}
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'default'}
              onClick={() => handleClose(true)}
              className="flex-1 sm:flex-initial"
            >
              {options.confirmLabel || 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
