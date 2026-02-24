import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Shield, FileText, DollarSign, CalendarClock, Activity, AlertTriangle, Flag, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/shared/components/ui/page-header'
import { useTabParam } from '@/shared/hooks/useTabParam'
import { VigilanciaPanel } from '@/core/identity/components/VigilanciaPanel'
import { AdminTermTracker } from '@/core/identity/components/AdminTermTracker'
import { FinancialReviewPanel } from '@/core/governance/components/FinancialReviewPanel'
import { DiscretionaryApprovalsPanel } from '@/core/treasury/components/DiscretionaryApprovalsPanel'
import { VigilanceActivityLogTab } from '@/core/governance/components/VigilanceActivityLogTab'
import { VigilanceAlertasTab } from '@/core/governance/components/VigilanceAlertasTab'
import { FlaggedTransactionsTab } from '@/core/governance/components/FlaggedTransactionsTab'
import { AuditLog } from '@/shared/components/AuditLog'

const VIGILANCIA_TABS = ['reportes', 'revision', 'discrecional', 'terminos', 'activity', 'alertas', 'flagged', 'audit'] as const
type VigilanciaTab = (typeof VIGILANCIA_TABS)[number]

export function VigilanciaPage() {
  const { communityId: _communityId } = useCommunityContext()
  const { isAdmin, role } = usePermissions()
  const [activeTab, setActiveTab] = useTabParam<VigilanciaTab>('reportes', VIGILANCIA_TABS)
  const isComite = role === 'comite_vigilancia' || isAdmin

  if (!isComite) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Solo el Comité de Vigilancia y el administrador pueden acceder a esta sección.
          Los reportes aprobados serán visibles para todos los miembros en la sección de documentos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comité de Vigilancia"
        subtitle="Supervisión financiera y reportes — Art. 43-46 LPCI CDMX"
        icon={Shield}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VigilanciaTab)}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="reportes" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Revisión Financiera
          </TabsTrigger>
          <TabsTrigger value="discrecional" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Discrecional
          </TabsTrigger>
          <TabsTrigger value="terminos" className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Términos
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="flagged" className="flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            Marcadas
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reportes" className="mt-4">
          <VigilanciaPanel />
        </TabsContent>

        <TabsContent value="revision" className="mt-4">
          <FinancialReviewPanel />
        </TabsContent>

        <TabsContent value="discrecional" className="mt-4">
          <DiscretionaryApprovalsPanel />
        </TabsContent>

        <TabsContent value="terminos" className="mt-4">
          <AdminTermTracker />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <VigilanceActivityLogTab />
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <VigilanceAlertasTab />
        </TabsContent>

        <TabsContent value="flagged" className="mt-4">
          <FlaggedTransactionsTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
