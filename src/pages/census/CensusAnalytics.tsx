import { useMemo } from 'react'
import { useCensusSnapshots, useLatestCensus } from '@/census/hooks/useCensus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

import { Progress } from '@/shared/components/ui/progress'
import { formatDate } from '@/shared/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Users, TrendingUp, Activity, Heart } from 'lucide-react'

const STANDING_COLORS: Record<string, string> = {
  good_standing: '#16a34a',
  grace_period: '#f59e0b',
  delinquent: '#dc2626',
  moroso: '#991b1b',
  suspended: '#6b7280',
}

const STANDING_LABELS: Record<string, string> = {
  good_standing: 'Al Corriente',
  grace_period: 'En Gracia',
  delinquent: 'Moroso',
  moroso: 'Moroso (LPCI)',
  suspended: 'Suspendido',
}

export function CensusAnalytics() {
  const { data: snapshots } = useCensusSnapshots()
  const { data: latest } = useLatestCensus()

  const analytics = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return null

    // Time series of total members
    const timeSeries = snapshots.map((s: any) => ({
      date: formatDate(s.snapshot_at || s.created_at),
      members: s.total_members ?? 0,
      active: s.active_members ?? 0,
    }))

    // Standing distribution from latest
    const standingDist: { name: string; value: number; color: string }[] = []
    const rawStanding = (latest as any)?.standing_distribution
    if (rawStanding) {
      for (const [key, val] of Object.entries(rawStanding as Record<string, number>)) {
        if (val > 0) {
          standingDist.push({
            name: STANDING_LABELS[key] || key,
            value: val,
            color: STANDING_COLORS[key] || '#6b7280',
          })
        }
      }
    }

    // Health score
    const totalMembers = (latest as any)?.total_members ?? 0
    const activeMembers = (latest as any)?.active_members ?? 0
    const goodStanding = rawStanding?.good_standing ?? 0
    const healthScore = totalMembers > 0
      ? Math.round(((activeMembers * 0.5 + goodStanding * 0.5) / totalMembers) * 100)
      : 0

    // Growth rate
    const first = snapshots[0] as any
    const last = snapshots[snapshots.length - 1] as any
    const growthRate = last?.total_members > 0
      ? ((first.total_members - last.total_members) / last.total_members) * 100
      : 0

    return {
      timeSeries,
      standingDist,
      healthScore,
      growthRate,
      totalMembers,
      activeMembers,
      inactiveMembers: totalMembers - activeMembers,
    }
  }, [snapshots, latest])

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay suficientes datos de censo para generar analiticas.
          Toma al menos un snapshot para comenzar.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Total Miembros</p>
            </div>
            <p className="text-2xl font-bold">{analytics.totalMembers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.activeMembers}</p>
            <p className="text-xs text-muted-foreground">
              {analytics.totalMembers > 0
                ? `${Math.round((analytics.activeMembers / analytics.totalMembers) * 100)}%`
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-violet-600" />
              <p className="text-xs text-muted-foreground">Salud del Censo</p>
            </div>
            <p className="text-2xl font-bold">{analytics.healthScore}%</p>
            <Progress value={analytics.healthScore} className="mt-1 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Crecimiento</p>
            </div>
            <p className={`text-2xl font-bold ${analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Time Series */}
      {analytics.timeSeries.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolucion de Miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="members" name="Total" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                <Area type="monotone" dataKey="active" name="Activos" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Standing Distribution */}
      {analytics.standingDist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribucion por Standing Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics.standingDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {analytics.standingDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 min-w-[180px]">
                {analytics.standingDist.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
