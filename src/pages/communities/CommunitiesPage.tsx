import { useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import { communityPath } from '@/shared/lib/communityRoutes'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * Selector de comunidad: lista las comunidades del usuario y navega a /c/:slug/dashboard al elegir.
 * Ruta: /communities (sin slug).
 */
export function CommunitiesPage() {
  const navigate = useNavigate()
  const { userCommunities, communityLoading } = useCommunityContext()

  if (communityLoading && userCommunities.length === 0) {
    return <LoadingSpinner message="Cargando comunidades…" className="min-h-dvh" />
  }

  if (userCommunities.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Bienvenido a Civitas</CardTitle>
            <CardDescription>
              Crea tu primera comunidad para gestionar tu condominio, asociación u organización.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full gap-2" onClick={() => navigate('/onboarding')}>
              <Plus className="h-4 w-4" />
              Crear mi comunidad
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mis comunidades</CardTitle>
          <CardDescription>
            Elige una comunidad para entrar a su panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {userCommunities.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              className="h-auto w-full justify-start gap-3 py-3"
              onClick={() => navigate(communityPath(c.slug, 'dashboard'))}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">({c.slug})</span>
            </Button>
          ))}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full gap-2" onClick={() => navigate('/onboarding')}>
            <Plus className="h-4 w-4" />
            Crear nueva comunidad
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
