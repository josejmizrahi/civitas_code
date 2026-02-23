import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { supabase } from '@/shared/lib/supabase'
import { getRuleCatalogEntry } from '@/shared/config/rules-catalog'
import { getCategories, getDashboardStats } from '@/core/treasury/services/treasury.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Wallet,
  Users,
  Building2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Scale,
  UserPlus,
  Crown,
  Zap,
  Wrench,
} from 'lucide-react'
import type { Proposal } from '../types'
import type { FinancialInstruction } from '@/shared/types/rules'
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  proposal: Proposal
}

/**
 * Renders a contextual panel based on proposal template_id.
 * Connects each proposal type with the relevant module data.
 */
export function ProposalContextPanel({ proposal }: Props) {
  const fi = proposal.financial_instruction
  const templateId = proposal.template_id

  if (!templateId) return null

  switch (templateId) {
    case 'cambio_regla':
      return <RuleChangePanel proposal={proposal} fi={fi} />
    case 'gasto':
    case 'emergencia':
    case 'obra':
      return <DisbursementPanel proposal={proposal} fi={fi} templateId={templateId} />
    case 'cuota':
      return <QuotaChangePanel proposal={proposal} fi={fi} />
    case 'presupuesto':
      return <BudgetAllocationPanel proposal={proposal} fi={fi} />
    case 'admision':
      return <MemberAdmissionPanel proposal={proposal} />
    case 'eleccion':
      return <ElectionPanel proposal={proposal} />
    default:
      return null
  }
}

function RuleChangePanel({ proposal: _proposal, fi }: { proposal: Proposal; fi: FinancialInstruction | null }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { rules } = useRulesEngine()
  const configKey = fi?.config_key as string | undefined
  const newValue = fi?.config_value

  const catalogEntry = configKey ? getRuleCatalogEntry(configKey) : null
  const currentValue = catalogEntry ? catalogEntry.rawValue(rules) : undefined

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-5 w-5 text-blue-600" />
          {t('context.ruleChange.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {catalogEntry ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium">{catalogEntry.label}</p>
              <p className="text-xs text-muted-foreground">{catalogEntry.description}</p>
              {catalogEntry.legalRef && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {catalogEntry.legalRef}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('context.currentValue')}</p>
                <p className="text-sm font-mono font-bold">{catalogEntry.format(rules)}</p>
              </div>
              <div className="rounded-lg border-2 border-blue-300 bg-background p-3 space-y-1">
                <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">{t('context.proposedValue')}</p>
                <p className="text-sm font-mono font-bold text-blue-700">
                  {formatProposedValue(newValue)}
                </p>
              </div>
            </div>
          </>
        ) : configKey ? (
          <div className="space-y-2">
            <p className="text-sm"><span className="font-medium">{t('context.key')}:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{configKey}</code></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.current')}</p>
                <p className="text-sm font-mono">{formatProposedValue(currentValue)}</p>
              </div>
              <div className="rounded-lg border-2 border-blue-300 bg-background p-3">
                <p className="text-[10px] font-medium text-blue-600 uppercase">{t('context.proposed')}</p>
                <p className="text-sm font-mono text-blue-700">{formatProposedValue(newValue)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('context.noRuleDetail')}</p>
        )}
        <Link to={path('rules')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {t('context.viewRules')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function DisbursementPanel({ proposal: _proposal, fi, templateId }: { proposal: Proposal; fi: FinancialInstruction | null; templateId: string }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { communityId } = useCommunityContext()
  const amount = Number(fi?.amount) || 0

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', communityId],
    queryFn: () => getDashboardStats(communityId!),
    enabled: !!communityId,
    staleTime: 60_000,
  })

  const { data: entity } = useQuery({
    queryKey: ['entity-by-name', fi?.recipient_name],
    queryFn: async () => {
      if (!fi?.recipient_name || !communityId) return null
      const { data } = await supabase
        .from('entities')
        .select('id, name, type, rfc')
        .eq('community_id', communityId)
        .ilike('name', fi.recipient_name)
        .limit(1)
      return data?.[0] ?? null
    },
    enabled: !!fi?.recipient_name && !!communityId,
    staleTime: 60_000,
  })

  const { data: category } = useQuery({
    queryKey: ['category', fi?.category_id],
    queryFn: async () => {
      if (!fi?.category_id) return null
      const { data } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('id', fi.category_id)
        .single()
      return data
    },
    enabled: !!fi?.category_id,
    staleTime: 60_000,
  })

  const balance = stats ? stats.totalIncome - stats.totalExpenses : 0
  const impactPct = balance > 0 ? Math.round((amount / balance) * 100) : 0

  const templateLabels: Record<string, { label: string; icon: typeof Wallet; color: string }> = {
    gasto: { label: t('context.disbursement'), icon: Wallet, color: 'text-emerald-600' },
    emergencia: { label: t('context.emergencyExpense'), icon: Zap, color: 'text-red-600' },
    obra: { label: t('context.majorWork'), icon: Wrench, color: 'text-orange-600' },
  }
  const tpl = templateLabels[templateId] || templateLabels.gasto
  const Icon = tpl.icon

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${tpl.color}`} />
          {tpl.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-background p-3 space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.amount')}</p>
            <p className="text-lg font-bold">${amount.toLocaleString('es-MX')}</p>
          </div>
          {stats && (
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.currentBalance')}</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${balance.toLocaleString('es-MX')}
              </p>
            </div>
          )}
          {stats && balance > 0 && (
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.impact')}</p>
              <div className="flex items-center gap-1.5">
                {impactPct > 50 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
                <p className={`text-lg font-bold ${impactPct > 50 ? 'text-red-600' : ''}`}>
                  {impactPct}%
                </p>
              </div>
              {impactPct > 50 && (
                <p className="text-[10px] text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {t('context.moreThanHalf')}
                </p>
              )}
            </div>
          )}
        </div>

        {category && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('context.category')}:</span>
            <Badge variant="outline">{category.name}</Badge>
          </div>
        )}

        {fi?.recipient_name && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('context.beneficiary')}:</span>
              <span className="font-medium">{fi.recipient_name}</span>
              {entity && (
                <Badge variant="secondary" className="text-[10px]">{entity.type}</Badge>
              )}
            </div>
            {entity && (
              <Link to={path(`entities/${entity.id}`)}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t('context.viewEntity')} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        )}

        <Link to={path('treasury')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {t('context.viewTreasury')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function QuotaChangePanel({ proposal: _proposal, fi }: { proposal: Proposal; fi: FinancialInstruction | null }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { communityId } = useCommunityContext()
  const newAmount = Number(fi?.new_amount || fi?.amount) || 0

  const { data: activeMembers } = useQuery({
    queryKey: ['active-members-count', communityId],
    queryFn: async () => {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId!)
        .eq('status', 'active')
      return count ?? 0
    },
    enabled: !!communityId,
    staleTime: 60_000,
  })

  const monthlyProjection = activeMembers ? newAmount * activeMembers : 0

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-violet-600" />
          {t('context.quotaChange')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border-2 border-violet-300 bg-background p-3 space-y-1">
            <p className="text-[10px] font-medium text-violet-600 uppercase">{t('context.newFee')}</p>
            <p className="text-lg font-bold text-violet-700">${newAmount.toLocaleString('es-MX')}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.activeMembers')}</p>
            <p className="text-lg font-bold">{activeMembers ?? '...'}</p>
          </div>
          {activeMembers && activeMembers > 0 && (
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.monthlyCollection')}</p>
              <p className="text-lg font-bold text-emerald-600">${monthlyProjection.toLocaleString('es-MX')}</p>
            </div>
          )}
        </div>

        {fi?.effective_date && (
          <p className="text-sm text-muted-foreground">
            {t('context.effectiveDate')}: <span className="font-medium text-foreground">{fi.effective_date}</span>
          </p>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {t('context.quotaExecuteWarning')}
          </p>
        </div>

        <Link to={path('treasury')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {t('context.viewCollection')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function BudgetAllocationPanel({ proposal: _proposal, fi }: { proposal: Proposal; fi: FinancialInstruction | null }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { communityId } = useCommunityContext()
  const amount = Number(fi?.amount) || 0
  const categoryId = fi?.category_id
  const period = fi?.period

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
    staleTime: 60_000,
  })

  const category = categories?.find((c) => c.id === categoryId)

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-amber-600" />
          {t('context.budgetAllocation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border-2 border-amber-300 bg-background p-3 space-y-1">
            <p className="text-[10px] font-medium text-amber-600 uppercase">{t('context.assignedAmount')}</p>
            <p className="text-lg font-bold text-amber-700">${amount.toLocaleString('es-MX')}</p>
          </div>
          {category && (
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.category')}</p>
              <p className="text-sm font-bold">{category.name}</p>
            </div>
          )}
          {period && (
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{t('context.period')}</p>
              <p className="text-sm font-bold">{period}</p>
            </div>
          )}
        </div>

        <Link to={path('treasury')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {t('context.viewBudgets')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function MemberAdmissionPanel({ proposal: _proposal }: { proposal: Proposal }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  return (
    <Card className="border-sky-200 bg-sky-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-5 w-5 text-sky-600" />
          {t('context.memberAdmission')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('context.memberAdmissionDescription')}
        </p>
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-sm text-sky-800">
          <p>{t('context.memberAdmissionWarning')}</p>
        </div>
        <Link to={path('members')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('context.viewMembers')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function ElectionPanel({ proposal: _proposal }: { proposal: Proposal }) {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { communityId } = useCommunityContext()

  const { data: currentTerms } = useQuery({
    queryKey: ['admin-terms-active', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_terms')
        .select('id, role, term_number, term_start, member_id')
        .eq('community_id', communityId!)
        .eq('status', 'active')
        .order('role')
      return (data ?? []) as { id: string; role: string; term_number: number; term_start: string; member_id: string }[]
    },
    enabled: !!communityId,
    staleTime: 60_000,
  })

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-5 w-5 text-purple-600" />
          {t('context.electionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('context.electionDescription')}
        </p>

        {currentTerms && currentTerms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">{t('context.currentRoles')}</p>
            {currentTerms.map((term) => (
              <div key={term.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                <Badge variant="outline" className="capitalize">{term.role}</Badge>
                <span className="text-xs text-muted-foreground">{t('context.periodN').replace('{n}', String(term.term_number))}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-800">
          <p className="flex items-center gap-1.5">
            <Scale className="h-4 w-4" />
            {t('context.electionLegal')}
          </p>
        </div>

        <Link to={path('governance/vigilancia')}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            {t('context.viewAdminTerms')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function formatProposedValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1) return `${Math.round(value * 100)}%`
    return value.toLocaleString('es-MX')
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
