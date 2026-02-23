import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { MemberDirectory } from '@/core/identity/components/MemberDirectory'
import { EntityList } from '@/core/entities/components/EntityList'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { exportToExcel } from '@/shared/services/export.service'
import { formatDate } from '@/shared/lib/utils'
import { useI18n } from '@/shared/hooks/useI18n'
import { ROLE_LABELS } from '@/shared/constants/roles'
import { Download, BookOpen, Activity, Users, Building2, LayoutGrid, List } from 'lucide-react'
import { CommunityDirectoryTab } from './CommunityDirectoryTab'
import { CommunityActivityTab } from './CommunityActivityTab'

type DirectoryView = 'table' | 'cards' | 'providers'

export function CommunityPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState('directory')
  const [directoryView, setDirectoryView] = useState<DirectoryView>('table')
  const { data: members } = useMembers()

  const handleExport = () => {
    const rows = (members ?? []).map((m) => ({
      Nombre: m.full_name || '',
      Correo: m.email || '',
      Rol: ROLE_LABELS[m.role] || m.role,
      Estado: m.status === 'active' ? 'Activo' : m.status,
      'Fecha Ingreso': formatDate(m.joined_at),
    }))
    exportToExcel(rows, { filename: 'miembros', sheetName: 'Miembros' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('community.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('community.subtitle')}</p>
        </div>
        {tab === 'directory' && directoryView !== 'providers' && (
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!members?.length}>
            <Download className="mr-1 h-4 w-4" />
            {t('members.export')}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="gap-1">
          <TabsTrigger value="directory" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Directorio
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            {t('community.tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <div className="mt-4 space-y-4">
            {/* Segmented control */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
              <button
                onClick={() => setDirectoryView('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  directoryView === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <Users className="h-3.5 w-3.5" />
                Miembros
              </button>
              <button
                onClick={() => setDirectoryView('cards')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  directoryView === 'cards' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Tarjetas
              </button>
              <button
                onClick={() => setDirectoryView('providers')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  directoryView === 'providers' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Proveedores
              </button>
            </div>

            {directoryView === 'table' && <MemberDirectory />}
            {directoryView === 'cards' && <CommunityDirectoryTab />}
            {directoryView === 'providers' && <EntityList />}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <CommunityActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
