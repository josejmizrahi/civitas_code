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
import { Download, Users, Contact, Activity, Building2 } from 'lucide-react'
import { CommunityDirectoryTab } from './CommunityDirectoryTab'
import { CommunityActivityTab } from './CommunityActivityTab'

export function CommunityPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState('members')
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
        {tab === 'members' && (
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!members?.length}>
            <Download className="mr-1 h-4 w-4" />
            {t('members.export')}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="gap-1">
          <TabsTrigger value="members" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('community.tabs.members')}
          </TabsTrigger>
          <TabsTrigger value="directory" className="flex items-center gap-1.5">
            <Contact className="h-3.5 w-3.5" />
            {t('community.tabs.directory')}
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            {t('community.tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MemberDirectory />
        </TabsContent>

        <TabsContent value="directory">
          <CommunityDirectoryTab />
        </TabsContent>

        <TabsContent value="providers">
          <EntityList />
        </TabsContent>

        <TabsContent value="activity">
          <CommunityActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
