import {
  Vote,
  ThumbsUp,
  Lightbulb,
  Wallet,
  Landmark,
  LogIn,
  MessageSquare,
  PenLine,
  Handshake,
  Home,
  Sprout,
  Star,
  Trophy,
  Crown,
  Megaphone,
  Rocket,
  CheckCircle,
  Shield,
  Gem,
  Award,
  MessagesSquare,
  Armchair,
  Flame,
  Zap,
  ShieldCheck,
  Sunrise,
  Users,
  Lock,
  Target,
  Heart,
  AlertTriangle,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  vote: Vote,
  'thumbs-up': ThumbsUp,
  lightbulb: Lightbulb,
  wallet: Wallet,
  landmark: Landmark,
  'log-in': LogIn,
  'message-square': MessageSquare,
  'pen-line': PenLine,
  handshake: Handshake,
  home: Home,
  sprout: Sprout,
  star: Star,
  trophy: Trophy,
  crown: Crown,
  megaphone: Megaphone,
  rocket: Rocket,
  'check-circle': CheckCircle,
  shield: Shield,
  gem: Gem,
  award: Award,
  'messages-square': MessagesSquare,
  armchair: Armchair,
  flame: Flame,
  zap: Zap,
  'shield-check': ShieldCheck,
  sunrise: Sunrise,
  users: Users,
  lock: Lock,
  target: Target,
  heart: Heart,
  'alert-triangle': AlertTriangle,
}

interface DynamicIconProps extends LucideProps {
  name: string
}

/** Renders a Lucide icon by string name. Falls back to Star if name not found. */
export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = ICON_MAP[name] ?? Star
  return <IconComponent {...props} />
}
