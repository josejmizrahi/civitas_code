import { cn } from '@/shared/lib/utils'
import { Loader2 } from 'lucide-react'

interface Props {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export function LoadingSpinner({ message, className, size = 'md', fullPage }: Props) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', SIZE_MAP[size])} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
