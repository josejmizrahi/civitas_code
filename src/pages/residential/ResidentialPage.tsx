import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { UnitDirectory } from '@/verticals/residential/components/UnitDirectory'
import { MaintenanceRequestList } from '@/verticals/residential/components/MaintenanceRequestList'
import { MaintenanceRequestForm } from '@/verticals/residential/components/MaintenanceRequestForm'
import { CommonAreaList } from '@/verticals/residential/components/CommonAreaList'
import { ReservationList } from '@/verticals/residential/components/ReservationList'
import { useUnitsWithMembers, useCommonAreas, useReservations } from '@/verticals/residential/hooks/useResidential'
import { useMaintenanceRequests } from '@/verticals/residential/hooks/useMaintenanceRequests'
import { Plus, Home, Wrench, Building, CalendarCheck, BarChart3 } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { PageHeader } from '@/shared/components/ui/page-header'
import { useTabParam } from '@/shared/hooks/useTabParam'

const TABS = ['overview', 'units', 'maintenance', 'common-areas', 'reservations'] as const
type ResidentialTab = (typeof TABS)[number]

export function ResidentialPage() {
  const { t } = useI18n()
  const [tab, setTab] = useTabParam<ResidentialTab>('overview', TABS)
  const [showForm, setShowForm] = useState(false)

  const { data: units } = useUnitsWithMembers()
  const { data: requests } = useMaintenanceRequests()
  const { data: areas } = useCommonAreas()
  const { data: reservations } = useReservations()

  const totalUnits = units?.length ?? 0
  const occupiedUnits = units?.filter((u) => u.member_id).length ?? 0
  const openRequests = requests?.filter((r) => r.status === 'open' || r.status === 'in_progress').length ?? 0
  const urgentRequests = requests?.filter((r) => r.priority === 'urgent' && r.status !== 'closed').length ?? 0
  const totalAreas = areas?.length ?? 0
  const upcomingReservations = reservations?.filter(
    (r) => r.status !== 'cancelled' && new Date(r.end_time) >= new Date()
  ).length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('residential.title')}
        subtitle={t('residential.subtitle')}
        actions={
          tab === 'maintenance' ? (
            <Button onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="mr-1 h-4 w-4" />
              Nueva Solicitud
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ResidentialTab)}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-1.5 text-xs sm:text-sm">
            <Home className="h-3.5 w-3.5" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5 text-xs sm:text-sm">
            <Wrench className="h-3.5 w-3.5" />
            Mantenimiento
            {openRequests > 0 && (
              <Badge variant={urgentRequests > 0 ? 'destructive' : 'default'} className="ml-1 h-5 min-w-5 justify-center text-[10px]">
                {openRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="common-areas" className="gap-1.5 text-xs sm:text-sm">
            <Building className="h-3.5 w-3.5" />
            Áreas Comunes
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-1.5 text-xs sm:text-sm">
            <CalendarCheck className="h-3.5 w-3.5" />
            Reservaciones
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setTab('units')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Unidades</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnits}</div>
                <p className="text-xs text-muted-foreground">
                  {occupiedUnits} ocupadas · {totalUnits - occupiedUnits} vacantes
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setTab('maintenance')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openRequests}</div>
                <p className="text-xs text-muted-foreground">
                  solicitudes abiertas
                  {urgentRequests > 0 && (
                    <span className="text-red-500 font-medium"> · {urgentRequests} urgentes</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setTab('common-areas')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Áreas Comunes</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAreas}</div>
                <p className="text-xs text-muted-foreground">registradas</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setTab('reservations')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Reservaciones</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingReservations}</div>
                <p className="text-xs text-muted-foreground">próximas</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick maintenance alerts */}
          {urgentRequests > 0 && (
            <Card className="mt-4 border-red-200 bg-red-50/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-red-900">
                  <Wrench className="h-4 w-4 shrink-0" />
                  <span>
                    Hay <strong>{urgentRequests}</strong> solicitud{urgentRequests > 1 ? 'es' : ''} de mantenimiento urgente{urgentRequests > 1 ? 's' : ''} pendiente{urgentRequests > 1 ? 's' : ''}.
                  </span>
                  <Button variant="outline" size="sm" className="ml-auto border-red-300 text-red-800 hover:bg-red-100" onClick={() => setTab('maintenance')}>
                    Ver solicitudes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="units" className="mt-4">
          <UnitDirectory />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceRequestList />
        </TabsContent>

        <TabsContent value="common-areas" className="mt-4">
          <CommonAreaList />
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <ReservationList />
        </TabsContent>
      </Tabs>

      <MaintenanceRequestForm open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
