import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Building2, Plus, ArrowRight } from 'lucide-react'

export function NoCommunityView() {
  const navigate = useNavigate()
  const { setCommunityId, userCommunities } = useCommunityContext()
  const communities = userCommunities
  const [loading, setLoading] = useState(!userCommunities.length)

  useEffect(() => {
    if (userCommunities.length > 0) setLoading(false)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [userCommunities])

  const handleSelect = (id: string) => {
    setCommunityId(id)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Cargando comunidades...</div>
      </div>
    )
  }

  if (communities.length > 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecciona tu comunidad</CardTitle>
            <CardDescription>
              Tienes acceso a las siguientes comunidades. Elige una para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {communities.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleSelect(c.id)}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground text-xs">({c.slug})</span>
              </Button>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => navigate('/onboarding')}
            >
              <Plus className="h-4 w-4" />
              Crear nueva comunidad
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Bienvenido a Civitas</CardTitle>
          <CardDescription>
            Crea tu primera comunidad para gestionar tu condominio, asociación u organización.
            Un asistente te guiará paso a paso para configurar todo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full gap-2"
            onClick={() => navigate('/onboarding')}
          >
            Crear mi comunidad
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
