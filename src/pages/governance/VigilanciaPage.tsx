import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Shield, FileText, DollarSign, CalendarClock } from 'lucide-react'
import { VigilanciaPanel } from '@/core/identity/components/VigilanciaPanel'
import { AdminTermTracker } from '@/core/identity/components/AdminTermTracker'
import { FinancialReviewPanel } from '@/core/governance/components/FinancialReviewPanel'

export function VigilanciaPage() {
  const { communityId: _communityId } = useCommunityContext()
  const { isAdmin, role } = usePermissions()
  const [activeTab, setActiveTab] = useState('reportes')
  const isComite = role === 'comite_vigilancia' || isAdmin

  if (!isComite) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Solo el Comite de Vigilancia y el administrador pueden acceder a esta seccion.
          Los reportes aprobados seran visibles para todos los miembros en la seccion de documentos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Comite de Vigilancia</h1>
          <p className="text-sm text-muted-foreground">
            Supervision financiera y reportes — Art. 43-46 LPCI CDMX
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide flex-nowrap sm:flex-wrap gap-1">
          <TabsTrigger value="reportes" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Revision Financiera
          </TabsTrigger>
          <TabsTrigger value="terminos" className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Terminos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reportes" className="mt-4">
          <VigilanciaPanel />
        </TabsContent>

        <TabsContent value="revision" className="mt-4">
          <FinancialReviewPanel />
        </TabsContent>

        <TabsContent value="terminos" className="mt-4">
          <AdminTermTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
