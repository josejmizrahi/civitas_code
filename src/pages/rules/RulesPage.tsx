import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { getCommunityRules } from '@/shared/services/rules.service'
import {
  RULES_CATALOG,
  getRulesForCategory,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  type RuleCategory,
  type RuleCatalogEntry,
} from '@/shared/config/rules-catalog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/lib/utils'
import {
  BookOpen,
  Shield,
  Wallet,
  UserCheck,
  History,
  ChevronRight,
  ChevronDown,
  Scale,
  Search,
  Pencil,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CommunityRules } from '@/shared/types/rules'

interface RuleVersion {
  id: string
  version_number: number
  change_reason: string | null
  created_at: string
}

const CATEGORY_ICON_MAP: Record<RuleCategory, typeof Shield> = {
  governance: Shield,
  treasury: Wallet,
  identity: UserCheck,
}

const CATEGORY_COLOR_MAP: Record<RuleCategory, string> = {
  governance: 'text-blue-600',
  treasury: 'text-emerald-600',
  identity: 'text-violet-600',
}

function RuleDetailPanel({
  rule,
  rules,
  onProposeChange,
}: {
  rule: RuleCatalogEntry
  rules: CommunityRules
  onProposeChange: (rule: RuleCatalogEntry) => void
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="space-y-1">
        <p className="text-sm">{rule.description}</p>
        {rule.legalRef && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Scale className="h-3 w-3" />
            Referencia legal: {rule.legalRef}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Valor actual:</span>
        <Badge variant="secondary" className="font-mono">
          {rule.format(rules)}
        </Badge>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onProposeChange(rule)}
        className="gap-1.5"
      >
        <Pencil className="h-3.5 w-3.5" />
        Proponer cambio
      </Button>
    </div>
  )
}

function RuleRow({
  rule,
  rules,
  isExpanded,
  onToggle,
  onProposeChange,
}: {
  rule: RuleCatalogEntry
  rules: CommunityRules
  isExpanded: boolean
  onToggle: () => void
  onProposeChange: (rule: RuleCatalogEntry) => void
}) {
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className="border-b last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-3 px-1 text-left transition-colors hover:bg-accent/50 rounded-md"
      >
        <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm flex-1">{rule.label}</span>
        <span className="text-sm font-medium text-muted-foreground">
          {rule.format(rules)}
        </span>
      </button>
      {isExpanded && (
        <div className="pl-8 pb-3">
          <RuleDetailPanel rule={rule} rules={rules} onProposeChange={onProposeChange} />
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  rules,
  searchQuery,
  expandedRuleId,
  onToggleRule,
  onProposeChange,
}: {
  category: RuleCategory
  rules: CommunityRules
  searchQuery: string
  expandedRuleId: string | null
  onToggleRule: (ruleId: string) => void
  onProposeChange: (rule: RuleCatalogEntry) => void
}) {
  const Icon = CATEGORY_ICON_MAP[category]
  const color = CATEGORY_COLOR_MAP[category]
  const categoryRules = getRulesForCategory(category)

  const filtered = searchQuery
    ? categoryRules.filter(
        (r) =>
          r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryRules

  if (filtered.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${color}`} />
          {CATEGORY_LABELS[category]}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
      </CardHeader>
      <CardContent>
        {filtered.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            rules={rules}
            isExpanded={expandedRuleId === rule.id}
            onToggle={() => onToggleRule(rule.id)}
            onProposeChange={onProposeChange}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function RulesPage() {
  const { communityId, community } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const navigate = useNavigate()

  const rules = getCommunityRules(null, (community as any)?.rules)

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)

  const { data: versions } = useQuery({
    queryKey: ['rule-versions', communityId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('rule_versions') as any)
        .select('id, version_number, change_reason, created_at')
        .eq('community_id', communityId!)
        .order('version_number', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as RuleVersion[]
    },
    enabled: !!communityId,
  })

  const handleToggleRule = (ruleId: string) => {
    setExpandedRuleId((prev) => (prev === ruleId ? null : ruleId))
  }

  const handleProposeChange = (rule: RuleCatalogEntry) => {
    navigate('/governance', {
      state: {
        openProposal: true,
        template: 'cambio_regla',
        ruleId: rule.id,
      },
    })
  }

  const totalRules = RULES_CATALOG.length
  const matchingRules = searchQuery
    ? RULES_CATALOG.filter(
        (r) =>
          r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).length
    : totalRules

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Reglamento
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalRules} reglas vigentes — haz clic en cualquiera para ver el detalle
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            Configuración avanzada
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar regla..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <p className="mt-1 text-xs text-muted-foreground">
            {matchingRules} {matchingRules === 1 ? 'regla encontrada' : 'reglas encontradas'}
          </p>
        )}
      </div>

      {/* Rule categories */}
      {(['governance', 'treasury', 'identity'] as RuleCategory[]).map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          rules={rules}
          searchQuery={searchQuery}
          expandedRuleId={expandedRuleId}
          onToggleRule={handleToggleRule}
          onProposeChange={handleProposeChange}
        />
      ))}

      {/* Version History */}
      {versions && versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-muted-foreground" />
              Historial de Cambios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">Versión {v.version_number}</span>
                    {v.change_reason && (
                      <span className="text-muted-foreground ml-2">— {v.change_reason}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{formatDate(v.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
