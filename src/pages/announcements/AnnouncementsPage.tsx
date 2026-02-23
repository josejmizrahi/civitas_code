import { AnnouncementManager } from '@/core/announcements/components/AnnouncementManager'
import { Megaphone } from 'lucide-react'

export function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Megaphone className="h-6 w-6 text-blue-600" />
          Anuncios
        </h1>
        <p className="text-sm text-muted-foreground">Avisos y comunicados de la comunidad</p>
      </div>
      <AnnouncementManager />
    </div>
  )
}
