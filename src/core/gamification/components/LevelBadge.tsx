import { getLevelForXp } from '../constants'
import { DynamicIcon } from '@/shared/components/DynamicIcon'

interface Props {
  xp: number
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

/** Level badge showing the user's current level with icon and color. */
export function LevelBadge({ xp, size = 'md', showTitle }: Props) {
  const level = getLevelForXp(xp)

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  }

  const iconSizes = { sm: 'h-3 w-3', md: 'h-3.5 w-3.5', lg: 'h-4 w-4' }

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold transition-transform hover:scale-105 ${sizes[size]}`}
      style={{
        backgroundColor: `${level.color}18`,
        color: level.color,
        border: `1.5px solid ${level.color}40`,
      }}
    >
      <DynamicIcon name={level.icon} className={iconSizes[size]} />
      <span>Niv.{level.level}</span>
      {showTitle && <span className="font-normal opacity-80">{level.titleShort}</span>}
    </span>
  )
}
