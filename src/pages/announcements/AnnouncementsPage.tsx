import { AnnouncementManager } from '@/core/announcements/components/AnnouncementManager'
import { useI18n } from '@/shared/hooks/useI18n'
import { PageHeader } from '@/shared/components/ui/page-header'
import { Megaphone } from 'lucide-react'

export function AnnouncementsPage() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <PageHeader icon={Megaphone} title={t('announcements.title')} subtitle={t('announcements.subtitle')} />
      <AnnouncementManager />
    </div>
  )
}
