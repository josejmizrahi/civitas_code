import { useMyGamification } from '../hooks/useGamification'
import { XpBar } from './XpBar'
import { StreakCounter } from './StreakCounter'
import { BadgeGrid } from './BadgeGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Trophy } from 'lucide-react'

/** Dashboard widget showing the user's gamification progress. */
export function GamificationSummary() {
  const { data: profile, isLoading } = useMyGamification()

  if (isLoading || !profile) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <XpBar />
        <div className="flex items-center justify-between">
          <StreakCounter
            streak={profile.current_streak}
            maxStreak={profile.max_streak}
          />
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Insignias</div>
            <div className="text-lg font-bold">{profile.badges.length}</div>
          </div>
        </div>
        {profile.badges.length > 0 && (
          <BadgeGrid earned={profile.badges} compact />
        )}
      </CardContent>
    </Card>
  )
}
