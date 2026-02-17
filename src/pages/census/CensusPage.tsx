import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Camera,
  Globe,
  Building2,
  Vote,
  FileText,
  ArrowRightLeft,
  Wallet,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import {
  useCensusSnapshots,
  useLatestCensus,
  useTakeCensusSnapshot,
  usePlatformCensus,
} from '@/census/hooks/useCensus'
import { useToast } from '@/shared/components/ui/toast'
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

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial',
  religious: 'Religiosa',
  cooperative: 'Cooperativa',
  manufacturing: 'Manufacturera',
  other: 'Otro',
}

const PIE_COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(270, 60%, 50%)']

function CommunityCensusTab() {
  const { data: snapshots, isLoading } = useCensusSnapshots()
  const { data: latest } = useLatestCensus()
  const takeSnapshot = useTakeCensusSnapshot()
  const toast = useToast()

  const chartData = [...(snapshots ?? [])]
    .reverse()
    .map((s) => ({
      date: formatDate(s.snapshot_date),
      total: s.total_members,
      active: s.active_members,
      alCorriente: s.members_good_standing,
    }))

  const balance = (latest?.total_income ?? 0) - (latest?.total_expenses ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => takeSnapshot.mutate(undefined, {
            onSuccess: () => toast.success('Snapshot tomado exitosamente'),
            onError: () => toast.error('Error al tomar snapshot'),
          })}
          disabled={takeSnapshot.isPending}
          size="sm"
        >
          <Camera className="mr-2 h-4 w-4" />
          {takeSnapshot.isPending ? 'Tomando...' : 'Tomar Snapshot'}
        </Button>
      </div>

      {/* Membership Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.total_members ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Miembros activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.active_members ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Al corriente</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{latest?.members_good_standing ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Morosos</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{latest?.members_delinquent ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Economic Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingreso total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latest?.total_income ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gasto total</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latest?.total_expenses ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propuestas activas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.active_proposals ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="active" name="Activos" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="alCorriente" name="Al corriente" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.08} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Snapshots recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : !snapshots?.length ? (
            <p className="text-sm text-muted-foreground">
              No hay snapshots aún. Toma el primero con el botón de arriba.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Activos</TableHead>
                  <TableHead className="text-right">Al corriente</TableHead>
                  <TableHead className="text-right">Morosos</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Propuestas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.snapshot_date)}</TableCell>
                    <TableCell className="text-right">{s.total_members}</TableCell>
                    <TableCell className="text-right">{s.active_members}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">{s.members_good_standing}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{s.members_delinquent}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.total_income)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.total_expenses)}</TableCell>
                    <TableCell className="text-right">{s.active_proposals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PlatformCensusTab() {
  const { data: census, isLoading } = usePlatformCensus()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Cargando datos de la red...</p>
  }

  if (!census) {
    return <p className="text-sm text-muted-foreground p-4">No se pudieron cargar los datos de la red.</p>
  }

  const networkBalance = census.total_income - census.total_expenses
  const participationRate = census.total_members > 0
    ? ((census.active_members / census.total_members) * 100).toFixed(1)
    : '0'
  const standingRate = census.active_members > 0
    ? ((census.members_good_standing / census.active_members) * 100).toFixed(1)
    : '0'

  const typeData = (census.community_types ?? []).map((t) => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: Number(t.count),
  }))

  return (
    <div className="space-y-6">
      {/* Network headline */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Red Civitas</h2>
              <p className="text-sm text-muted-foreground">
                Censo global de la red — datos agregados, sin información individual
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{census.total_communities}</p>
              <p className="text-xs text-muted-foreground">Comunidades</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{census.total_members}</p>
              <p className="text-xs text-muted-foreground">Miembros totales</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{participationRate}%</p>
              <p className="text-xs text-muted-foreground">Tasa de actividad</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{standingRate}%</p>
              <p className="text-xs text-muted-foreground">Al corriente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{census.total_communities}</div>
            <p className="text-xs text-muted-foreground">organizaciones en la red</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Miembros activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{census.active_members}</div>
            <p className="text-xs text-muted-foreground">de {census.total_members} registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gobernanza</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{census.total_proposals}</div>
            <p className="text-xs text-muted-foreground">
              propuestas ({census.approved_proposals} aprobadas, {census.active_proposals} activas)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delegaciones activas</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{census.total_delegations}</div>
            <p className="text-xs text-muted-foreground">votos delegados en la red</p>
          </CardContent>
        </Card>
      </div>

      {/* Economic metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volumen total ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(census.total_income)}</div>
            <p className="text-xs text-muted-foreground">flujo de entrada en la red</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volumen total gastos</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(census.total_expenses)}</div>
            <p className="text-xs text-muted-foreground">flujo de salida en la red</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance de la red</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${networkBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(networkBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{census.total_transactions}</div>
            <p className="text-xs text-muted-foreground">movimientos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Community types distribution */}
      {typeData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {typeData.map((_entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tipos de comunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeData.map((t, i) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{t.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({census ? ((t.value / census.total_communities) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Datos agregados al {census.snapshot_at ? new Date(census.snapshot_at).toLocaleString('es-MX') : '—'}.
        No se expone información individual de comunidades ni miembros.
      </p>
    </div>
  )
}

export function CensusPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Censo</h1>
          <p className="text-sm text-muted-foreground">Métricas de tu comunidad y de la red Civitas</p>
        </div>
      </div>

      <Tabs defaultValue="community">
        <TabsList className="flex-wrap overflow-x-auto">
          <TabsTrigger value="community">
            <Building2 className="mr-2 h-4 w-4" />
            Mi Comunidad
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Globe className="mr-2 h-4 w-4" />
            Red Civitas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="community">
          <CommunityCensusTab />
        </TabsContent>
        <TabsContent value="platform">
          <PlatformCensusTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
