import { useState, useEffect } from 'react'
import { useAuth, useCommunityContext } from '@/app/providers'
import { createCommunity } from '../services/identity.service'
import type { CommunityType } from '@/shared/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Building2 } from 'lucide-react'

const COMMUNITY_TYPES: { value: CommunityType; label: string }[] = [
  { value: 'residential', label: 'Residencial (condominio, edificio)' },
  { value: 'religious', label: 'Religiosa' },
  { value: 'cooperative', label: 'Cooperativa' },
  { value: 'manufacturing', label: 'Manufacturera' },
  { value: 'other', label: 'Otro' },
]

export function NoCommunityView() {
  const { user } = useAuth()
  const { setCommunityId, userCommunities, refreshCommunities } = useCommunityContext()
  const communities = userCommunities
  const [loading, setLoading] = useState(!userCommunities.length)
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CommunityType>('residential')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (userCommunities.length > 0) setLoading(false)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [userCommunities])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // Validate name
    if (name.trim().length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres')
      return
    }
    
    setError('')
    setNameError('')
    setCreating(true)
    try {
      const community = await createCommunity(user.id, { name, type, description: description || undefined })
      refreshCommunities()
      setCommunityId(community.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la comunidad')
    } finally {
      setCreating(false)
    }
  }

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

  if (communities.length > 0 && mode === 'select') {
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
            <Button variant="ghost" className="w-full" onClick={() => setMode('create')}>
              + Crear nueva comunidad
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear tu primera comunidad</CardTitle>
          <CardDescription>
            Crea una comunidad para gestionar tu condominio, asociación o organización. Serás administrador.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la comunidad</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError && e.target.value.trim().length >= 3) {
                    setNameError('')
                  }
                }}
                required
                placeholder="Ej: Residencial Las Palmas"
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de comunidad</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as CommunityType)}
              >
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu comunidad..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Creando...' : 'Crear comunidad'}
            </Button>
            {communities.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode('select')}
              >
                Volver a seleccionar comunidad existente
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
