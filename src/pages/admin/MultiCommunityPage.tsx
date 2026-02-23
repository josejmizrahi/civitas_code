import { Link } from 'react-router-dom'
import { Building2, Vote, Wallet, AlertTriangle, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useMultiCommunityOverview } from '@/core/identity/hooks/useMultiCommunity'
import { useCommunityContext } from '@/app/providers'

export function MultiCommunityPage() {
  const { data, isLoading, isError } = useMultiCommunityOverview()
  const { setCommunityId } = useCommunityContext()

  if (isLoading) {
    return <LoadingSpinner message="Cargando consolidado multi-community..." className="py-20" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Consolidado Multi-Community</h1>
        <p className="text-sm text-muted-foreground">
          Vista rápida para seguimiento operativo entre comunidades.
        </p>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          No se pudo cargar el consolidado. Intenta recargar.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Propuestas activas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data?.reduce((acc, item) => acc + item.activeProposals, 0) ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprobaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data?.reduce((acc, item) => acc + item.pendingDiscretionary, 0) ?? 0}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((item) => (
          <Card key={item.community.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{item.community.name}</p>
                    <Badge variant="secondary">{item.community.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">/{item.community.slug}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{item.activeMembers} activos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vote className="h-4 w-4 text-muted-foreground" />
                    <span>{item.activeProposals} propuestas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span>{item.pendingObligations} obligaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>{item.pendingDiscretionary} discrecionales</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommunityId(item.community.id)}
                  >
                    Cambiar a esta
                  </Button>
                  <Link to="/dashboard">
                    <Button size="sm">Abrir</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default MultiCommunityPage
