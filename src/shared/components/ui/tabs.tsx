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
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const tolerance = 2
    setCanScrollLeft(el.scrollLeft > tolerance)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance)
  }, [])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  return (
    <div className="relative">
      {/* Left fade indicator */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-lg bg-gradient-to-r from-muted to-transparent transition-opacity duration-200 md:hidden',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
      <div
        ref={scrollRef}
        role="tablist"
        className={cn(
          'flex h-auto items-center rounded-lg bg-muted p-1 text-muted-foreground',
          'w-full overflow-x-auto scrollbar-hide flex-nowrap md:flex-wrap gap-0.5',
          'max-w-full',
          '-webkit-overflow-scrolling-touch',
          className
        )}
        {...props}
      />
      {/* Right fade indicator */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-muted to-transparent transition-opacity duration-200 md:hidden',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
    </div>
  )
}

function TabsTrigger({ className, value, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  const isActive = context.value === value
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Auto-scroll the active tab into view on mount
  React.useEffect(() => {
    if (isActive && triggerRef.current) {
      triggerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [isActive])

  return (
    <button
      ref={triggerRef}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
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
