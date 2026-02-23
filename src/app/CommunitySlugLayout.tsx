import { useEffect, useState } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useAuth, useCommunityContext } from '@/app/providers'
import { getCommunityBySlug, getCurrentMember } from '@/core/identity/services/identity.service'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Button } from '@/shared/components/ui/button'

type Status = 'loading' | 'ok' | 'not_found' | 'forbidden'

/**
 * Resolves :slug from URL to community and membership, syncs context, then renders AppLayout + Outlet.
 * Shows 404 if community does not exist, 403 if user is not a member.
 */
export function CommunitySlugLayout() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const { setCommunityId, community, communityLoading } = useCommunityContext()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!slug || !user?.id) {
      setStatus('loading')
      return
    }
    let cancelled = false
    setStatus('loading')
    getCommunityBySlug(slug)
      .then((comm) => {
        if (cancelled) return
        if (!comm) {
          setStatus('not_found')
          return
        }
        getCurrentMember(comm.id, user.id).then((member) => {
          if (cancelled) return
          if (!member) {
            setStatus('forbidden')
            return
          }
          setCommunityId(comm.id)
          setStatus('ok')
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('not_found')
      })
    return () => {
      cancelled = true
    }
  }, [slug, user?.id, setCommunityId])

  // Wait for provider to finish loading and slug to match (so nav has correct community)
  const ready = status === 'ok' && !communityLoading && community?.slug === slug

  if (status === 'not_found') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Comunidad no encontrada</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            No existe una comunidad con esa dirección. Verifica el enlace o elige otra comunidad.
          </p>
        </div>
        <Button variant="default" onClick={() => navigate('/communities')}>
          Ir a mis comunidades
        </Button>
      </div>
    )
  }

  if (status === 'forbidden') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sin acceso</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            No tienes acceso a esta comunidad. Si crees que deberías, pide una invitación al administrador.
          </p>
        </div>
        <Button variant="default" onClick={() => navigate('/communities')}>
          Ir a mis comunidades
        </Button>
      </div>
    )
  }

  if (!ready) {
    return <LoadingSpinner message="Cargando comunidad…" className="min-h-dvh" />
  }

  return <Outlet />
}
