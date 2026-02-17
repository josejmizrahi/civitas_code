import { Badge } from '@/shared/components/ui/badge'
import { formatDateTime } from '@/shared/lib/utils'
import { RefreshCw } from 'lucide-react'

interface Props {
  lastSyncAt?: string | null
  status?: string
}

export function SyncStatusBadge({ lastSyncAt, status }: Props) {
  if (!lastSyncAt) {
    return (
      <Badge variant="outline" className="gap-1">
        <RefreshCw className="h-3 w-3" />
        Sin importaciones
      </Badge>
    )
  }

  return (
    <Badge variant={status === 'error' ? 'destructive' : 'success'} className="gap-1">
      <RefreshCw className="h-3 w-3" />
      Última sync: {formatDateTime(lastSyncAt)}
    </Badge>
  )
}
