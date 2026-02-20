import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { UnitDirectory } from '@/verticals/residential/components/UnitDirectory'
import { MaintenanceRequestList } from '@/verticals/residential/components/MaintenanceRequestList'
import { MaintenanceRequestForm } from '@/verticals/residential/components/MaintenanceRequestForm'
import { CommonAreaList } from '@/verticals/residential/components/CommonAreaList'
import { Plus } from 'lucide-react'

export function ResidentialPage() {
  const [tab, setTab] = useState('units')
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Residencial</h1>
          <p className="text-sm text-muted-foreground">Unidades, mantenimiento y áreas comunes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'maintenance' && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="gap-1">
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
          <TabsTrigger value="common-areas">Áreas Comunes</TabsTrigger>
        </TabsList>
        <TabsContent value="units">
          <UnitDirectory />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceRequestList />
        </TabsContent>
        <TabsContent value="common-areas">
          <CommonAreaList />
        </TabsContent>
      </Tabs>

      <MaintenanceRequestForm open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
