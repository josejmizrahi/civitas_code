import { Badge, type BadgeProps } from './badge'

type BadgeVariant = NonNullable<BadgeProps['variant']>

interface StatusBadgeProps {
  status: string
  variantMap: Record<string, BadgeVariant>
  labelMap?: Record<string, string>
  /** Override the displayed label */
  label?: string
  /** Fallback variant when status not in variantMap */
  fallbackVariant?: BadgeVariant
  className?: string
}

/**
 * Thin wrapper around Badge that resolves variant + label from status maps.
 * Keeps status→color logic declarative and co-located with data, not in JSX.
 */
export function StatusBadge({
  status,
  variantMap,
  labelMap,
  label,
  fallbackVariant = 'secondary',
  className,
}: StatusBadgeProps) {
  return (
    <Badge variant={variantMap[status] ?? fallbackVariant} className={className}>
      {label ?? labelMap?.[status] ?? status}
    </Badge>
  )
}
