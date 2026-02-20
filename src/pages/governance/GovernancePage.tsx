import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { ProposalList } from '@/core/governance/components/ProposalList'
import { AssemblyList } from '@/core/governance/components/AssemblyList'
import { CreateProposalDialog } from '@/core/governance/components/CreateProposalDialog'
import { CreateAssemblyDialog } from '@/core/governance/components/CreateAssemblyDialog'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { processExpiredProposals, processAutoExecutions } from '@/core/governance/services/governance.service'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { exportToExcel } from '@/shared/services/export.service'
import { formatDate } from '@/shared/lib/utils'
import { Plus, Download } from 'lucide-react'
import { AlertBanner } from '@/shared/components/AlertBanner'

export function GovernancePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateAssembly, setShowCreateAssembly] = useState(false)
  const [initialTemplateId, setInitialTemplateId] = useState<string | undefined>()
  const [initialRuleId, setInitialRuleId] = useState<string | undefined>()
  const [successBanner, setSuccessBanner] = useState<{ message: string; detail?: string } | null>(null)
  const processedRpcRef = useRef(false)
  const { canCreateProposals, isAdmin } = usePermissions()
  const { data: allProposals } = useProposals()

  // Consume location.state from Settings "Cambiar Regla via Propuesta" or Reglamento "Proponer cambio"
  useEffect(() => {
    const state = location.state as { openProposal?: boolean; template?: string; ruleId?: string } | null
    if (state?.openProposal && state?.template) {
      queueMicrotask(() => {
        setShowCreate(true)
        setInitialTemplateId(state.template)
        if (state.ruleId) setInitialRuleId(state.ruleId)
      })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (processedRpcRef.current) return
    processedRpcRef.current = true
    processExpiredProposals().catch(() => {})
    processAutoExecutions().catch(() => {})
  }, [])

  const handleProposalCreated = (info: { endorsementsRequired: number }) => {
    setTab('draft')
    if (info.endorsementsRequired > 0) {
      setSuccessBanner({
        message: 'Propuesta creada como borrador',
        detail: `Necesita ${info.endorsementsRequired} avales de otros miembros para avanzar a discusión/votación.`,
      })
    } else {
      setSuccessBanner({ message: 'Propuesta creada exitosamente' })
    }
    setTimeout(() => setSuccessBanner(null), 8000)
  }

  const isAssemblyTab = tab === 'assemblies'

  const handleExport = () => {
    const rows = (allProposals ?? []).map((p) => ({
      Título: p.title,
      Tipo: p.type,
      Estado: p.status,
      Descripción: p.description || '',
      Creada: formatDate(p.created_at),
      'Inicio Votación': p.voting_start ? formatDate(p.voting_start) : '',
      'Cierre Votación': p.voting_end ? formatDate(p.voting_end) : '',
    }))
    exportToExcel(rows, { filename: 'propuestas', sheetName: 'Propuestas' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gobernanza</h1>
          <p className="text-sm text-muted-foreground">
            {isAssemblyTab ? 'Asambleas y convocatorias' : 'Propuestas y votaciones'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!allProposals?.length}>
            <Download className="mr-1 h-4 w-4" />
            Exportar
          </Button>
          {isAssemblyTab && isAdmin && (
            <Button onClick={() => setShowCreateAssembly(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asamblea
            </Button>
          )}
          {!isAssemblyTab && canCreateProposals && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Propuesta
            </Button>
          )}
        </div>
      </div>

      {successBanner && (
        <AlertBanner variant="success" className="animate-in fade-in duration-300">
          <p className="font-medium">{successBanner.message}</p>
          {successBanner.detail && (
            <p className="text-sm mt-1 opacity-80">{successBanner.detail}</p>
          )}
        </AlertBanner>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="gap-1">
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="discussion">En Discusión</TabsTrigger>
          <TabsTrigger value="draft">Borradores</TabsTrigger>
          <TabsTrigger value="closed">Cerradas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="assemblies">Asambleas</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <ProposalList statusFilter="active" />
        </TabsContent>
        <TabsContent value="discussion">
          <ProposalList statusFilter="discussion" />
        </TabsContent>
        <TabsContent value="draft">
          <ProposalList statusFilter="draft" />
        </TabsContent>
        <TabsContent value="closed">
          <ProposalList statusFilter="closed" />
        </TabsContent>
        <TabsContent value="all">
          <ProposalList />
        </TabsContent>
        <TabsContent value="assemblies">
          <AssemblyList />
        </TabsContent>
      </Tabs>

      <CreateProposalDialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setInitialTemplateId(undefined); setInitialRuleId(undefined) } }} initialTemplateId={initialTemplateId} initialRuleId={initialRuleId} onCreated={handleProposalCreated} />
      <CreateAssemblyDialog open={showCreateAssembly} onOpenChange={setShowCreateAssembly} />
    </div>
  )
}
