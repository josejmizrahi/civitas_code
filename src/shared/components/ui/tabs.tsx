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
      role="tablist"
      className={cn(
        'flex h-auto items-center rounded-lg bg-muted p-1 text-muted-foreground',
        'w-full overflow-x-auto scrollbar-hide flex-nowrap md:flex-wrap gap-0.5',
        'max-w-full',
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
      role="tab"
      aria-selected={isActive}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all shrink-0',
        isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50',
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
  return <div role="tabpanel" className={cn('mt-3', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
