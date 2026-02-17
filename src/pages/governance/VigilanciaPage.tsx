import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Shield, FileText, AlertTriangle, Plus } from 'lucide-react'

export function VigilanciaPage() {
  const { communityId } = useCommunityContext()
  const { isAdmin, role } = usePermissions()
  const [activeTab, setActiveTab] = useState('reportes')
  const isComite = role === 'comite_vigilancia' || isAdmin

  if (!isComite) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Solo el Comite de Vigilancia y el administrador pueden acceder a esta seccion.
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
            Supervision financiera y reportes — Art. 43 LPCI CDMX
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="revision">Revision Financiera</TabsTrigger>
          <TabsTrigger value="terminos">Terminos</TabsTrigger>
        </TabsList>

        <TabsContent value="reportes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reportes del Comite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                El Comite de Vigilancia debe presentar reportes periodicos sobre el estado
                financiero de la comunidad ante la asamblea de condominos.
              </p>
              <div className="mt-4 rounded-md border border-dashed p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay reportes registrados aun.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="mr-2 h-3 w-3" />
                  Crear Primer Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revision" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revision Financiera</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revision de ingresos, egresos y estados financieros mensuales.
                El comite verifica la correcta aplicacion de los fondos de mantenimiento y reserva.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terminos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terminos de Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Maximo {2} periodos consecutivos para miembros del comite (Art. 42 LPCI).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
