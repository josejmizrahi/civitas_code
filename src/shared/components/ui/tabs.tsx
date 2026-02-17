import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({ value, onValueChange, children, className }: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex h-auto sm:h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground overflow-x-auto scrollbar-none flex-wrap sm:flex-nowrap gap-0.5 sm:gap-0',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  const isActive = context.value === value
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium transition-all',
        isActive ? 'bg-background text-foreground shadow' : 'hover:bg-background/50',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => !disabled && context.onValueChange(value)}
      disabled={disabled}
      {...props}
    />
  )
}

function TabsContent({ className, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  if (context.value !== value) return null
  return <div className={cn('mt-2', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
