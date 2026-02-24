import { AnnouncementManager } from '@/core/announcements/components/AnnouncementManager'
import { useI18n } from '@/shared/hooks/useI18n'
import { Megaphone } from 'lucide-react'

export function AnnouncementsPage() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Megaphone className="h-6 w-6 text-blue-600" />
          {t('announcements.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('announcements.subtitle')}</p>
      </div>
      <AnnouncementManager />
    </div>
  )
}
