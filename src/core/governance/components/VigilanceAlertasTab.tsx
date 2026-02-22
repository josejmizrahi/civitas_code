import { useMemo } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/core/treasury/services/treasury.service'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { AlertTriangle, Zap, Receipt, Building2 } from 'lucide-react'

export function VigilanceAlertasTab() {
  const { communityId } = useCommunityContext()

  const { data: transactions } = useQuery({
    queryKey: ['transactions', communityId, 'vigilance-alertas'],
    queryFn: () => getTransactions(communityId!, {}),
    enabled: !!communityId,
  })

  const { data: entitiesRecent } = useQuery({
    queryKey: ['entities-recent', communityId],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data } = await supabase
        .from('entities')
        .select('id, name, created_at')
        .eq('community_id', communityId!)
        .gte('created_at', since.toISOString())
      return (data ?? []) as Array<{ id: string; name: string; created_at: string }>
    },
    enabled: !!communityId,
  })

  const alerts = useMemo(() => {
    const list: Array<{ type: string; title: string; detail: string; icon: React.ReactNode; severity: 'info' | 'warning' }> = []
    if (!transactions) return list

    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const expenses = transactions.filter((t) => t.type === 'expense')
    const byCategoryMonth = new Map<string, number>()
    for (const t of expenses) {
      if (!t.date) continue
      const period = t.date.slice(0, 7)
      const key = `${t.category_id ?? 'sin-cat'}|${period}`
      byCategoryMonth.set(key, (byCategoryMonth.get(key) ?? 0) + 1)
    }
    byCategoryMonth.forEach((count, key) => {
      if (count >= 5) {
        const [cat, period] = key.split('|')
        list.push({
          type: 'many_small',
          title: 'Múltiples egresos en categoría/mes',
          detail: `${count} egresos en categoría ${cat?.slice(0, 8) ?? 'N/A'} periodo ${period}`,
          icon: <Receipt className="h-4 w-4" />,
          severity: 'warning',
        })
      }
    })

    const emergencies = transactions.filter(
      (t) => (t as any).emergency === true && new Date(t.date) >= ninetyDaysAgo
    )
    if (emergencies.length >= 3) {
      list.push({
        type: 'frequent_emergency',
        title: 'Emergencias frecuentes',
        detail: `${emergencies.length} gastos de emergencia en los últimos 90 días.`,
        icon: <Zap className="h-4 w-4" />,
        severity: 'warning',
      })
    }

    if (entitiesRecent && entitiesRecent.length > 5) {
      list.push({
        type: 'new_entities',
        title: 'Entidades nuevas',
        detail: `${entitiesRecent.length} entidades creadas en los últimos 30 días.`,
        icon: <Building2 className="h-4 w-4" />,
        severity: 'info',
      })
    }

    return list
  }, [transactions, entitiesRecent])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          Alertas (patrones inusuales)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se detectaron patrones inusuales.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div
                key={`${a.type}-${i}`}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  a.severity === 'warning' ? 'border-amber-200 bg-amber-50/50' : 'border-muted bg-muted/30'
                }`}
              >
                {a.icon}
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <Badge variant={a.severity === 'warning' ? 'warning' : 'secondary'}>{a.severity}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
