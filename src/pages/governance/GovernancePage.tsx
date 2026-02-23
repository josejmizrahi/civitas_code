import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { ProposalList } from '@/core/governance/components/ProposalList'
import { AssemblyList } from '@/core/governance/components/AssemblyList'
import { CreateProposalDialog } from '@/core/governance/components/CreateProposalDialog'
import { CreateAssemblyDialog } from '@/core/governance/components/CreateAssemblyDialog'
import { DelegationManager } from '@/core/governance/components/DelegationManager'
import { DecisionArchive } from '@/core/accountability/components/DecisionArchive'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import { processExpiredProposals, processAutoExecutions } from '@/core/governance/services/governance.service'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { exportToExcel } from '@/shared/services/export.service'
import { formatDate } from '@/shared/lib/utils'
import { Plus, Download, CheckCircle2, FileText, Landmark, Handshake, ScrollText, BookOpen } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useToast } from '@/shared/components/ui/toast'

type GovernanceTab = 'proposals' | 'assemblies' | 'delegations' | 'minutes' | 'rules'

export function GovernancePage() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentMember } = useCommunityContext()
  const [tab, setTab] = useState<GovernanceTab>('proposals')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateAssembly, setShowCreateAssembly] = useState(false)
  const [initialTemplateId, setInitialTemplateId] = useState<string | undefined>()
  const [initialRuleId, setInitialRuleId] = useState<string | undefined>()
  const [successBanner, setSuccessBanner] = useState<{ message: string; detail?: string } | null>(null)
  const processedRpcRef = useRef(false)
  const { canCreateProposals, isAdmin } = usePermissions()
  const toast = useToast()
  const { data: allProposals } = useProposals()

  useEffect(() => {
    const state = location.state as { openProposal?: boolean; template?: string; ruleId?: string; tab?: GovernanceTab } | null
    if (state?.openProposal && state?.template) {
      queueMicrotask(() => {
        setShowCreate(true)
        setInitialTemplateId(state.template)
        if (state.ruleId) setInitialRuleId(state.ruleId)
      })
      navigate(location.pathname, { replace: true, state: {} })
    }
    if (state?.tab) setTab(state.tab)
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (processedRpcRef.current) return
    processedRpcRef.current = true
    processExpiredProposals().catch((err) => {
      console.error('[Governance] processExpiredProposals:', err)
      toast.error('Error al sincronizar propuestas vencidas')
    })
    processAutoExecutions().catch((err) => {
      console.error('[Governance] processAutoExecutions:', err)
      toast.error('Error al sincronizar auto-ejecuciones')
    })
  }, [])

  const handleProposalCreated = (info: { endorsementsRequired: number }) => {
    setStatusFilter('draft')
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

  const subtitleMap: Record<GovernanceTab, string> = {
    proposals: t('governance.subtitle.proposals'),
    assemblies: t('governance.subtitle.assemblies'),
    delegations: 'Gestiona las delegaciones de voto entre miembros',
    minutes: 'Actas generadas a partir de propuestas ejecutadas',
    rules: 'Reglamento vigente de la comunidad',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('governance.title')}</h1>
          <p className="text-sm text-muted-foreground">{subtitleMap[tab]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'proposals' && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!allProposals?.length}>
                <Download className="mr-1 h-4 w-4" />
                {t('governance.export')}
              </Button>
              {canCreateProposals && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('governance.newProposal')}
                </Button>
              )}
            </>
          )}
          {tab === 'assemblies' && isAdmin && (
            <Button onClick={() => setShowCreateAssembly(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('governance.newAssembly')}
            </Button>
          )}
        </div>
      </div>

      {successBanner && (
        <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-800">{successBanner.message}</p>
            {successBanner.detail && (
              <p className="text-sm text-green-700 mt-1">{successBanner.detail}</p>
            )}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as GovernanceTab)}>
        <TabsList className="gap-1">
          <TabsTrigger value="proposals" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {t('governance.tab.proposals')}
          </TabsTrigger>
          <TabsTrigger value="assemblies" className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            {t('governance.tab.assemblies')}
          </TabsTrigger>
          <TabsTrigger value="delegations" className="flex items-center gap-1.5">
            <Handshake className="h-3.5 w-3.5" />
            {t('governance.tab.delegations')}
          </TabsTrigger>
          <TabsTrigger value="minutes" className="flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            {t('governance.tab.minutes')}
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {t('governance.tab.rules')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          <div className="space-y-4 mt-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">{t('governance.tab.all')}</option>
              <option value="active">{t('governance.tab.active')}</option>
              <option value="discussion">{t('governance.tab.discussion')}</option>
              <option value="draft">{t('governance.tab.draft')}</option>
              <option value="closed">{t('governance.tab.closed')}</option>
            </Select>
            <ProposalList statusFilter={statusFilter || undefined} />
          </div>
        </TabsContent>

        <TabsContent value="assemblies">
          <AssemblyList />
        </TabsContent>

        <TabsContent value="delegations">
          {currentMember ? (
            <DelegationManager memberId={currentMember.id} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cargando información de miembro...
            </p>
          )}
        </TabsContent>

        <TabsContent value="minutes">
          <DecisionArchive />
        </TabsContent>

        <TabsContent value="rules">
          <RulesTabContent />
        </TabsContent>
      </Tabs>

      <CreateProposalDialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) { setInitialTemplateId(undefined); setInitialRuleId(undefined) }
        }}
        initialTemplateId={initialTemplateId}
        initialRuleId={initialRuleId}
        onCreated={handleProposalCreated}
      />
      <CreateAssemblyDialog open={showCreateAssembly} onOpenChange={setShowCreateAssembly} />
    </div>
  )
}

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
const RulesPage = lazy(() => import('@/pages/rules/RulesPage').then(m => ({ default: m.RulesPage })))

function RulesTabContent() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-12" />}>
      <RulesPage embedded />
    </Suspense>
  )
}
