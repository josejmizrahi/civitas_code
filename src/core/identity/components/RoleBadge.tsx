import { cn } from '@/shared/lib/utils'
import { Crown, Shield, Wallet, User, Eye, Star, type LucideIcon } from 'lucide-react'
import type { Role } from '@/shared/types'

interface RoleBadgeProps {
  role: Role
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const ROLE_CONFIG: Record<Role, { label: string; icon: LucideIcon; bg: string; text: string; border: string }> = {
  platform_admin: {
    label: 'Admin Plataforma',
    icon: Star,
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  admin: {
    label: 'Administrador',
    icon: Crown,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  comite_vigilancia: {
    label: 'Comité Vigilancia',
    icon: Shield,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  tesorero: {
    label: 'Tesorero',
    icon: Wallet,
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  miembro: {
    label: 'Miembro',
    icon: User,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  observador: {
    label: 'Observador',
    icon: Eye,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
}

export function RoleBadge({ role, className, showLabel = true, size = 'sm' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.miembro
  const Icon = config.icon

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        padding,
        textSize,
        className
      )}
      title={config.label}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export function getRoleLabel(role: Role): string {
  return ROLE_CONFIG[role]?.label ?? role
}

export function getRoleColor(role: Role): string {
  return ROLE_CONFIG[role]?.text ?? 'text-gray-600'
}
