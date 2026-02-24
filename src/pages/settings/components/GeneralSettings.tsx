import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCommunity } from '@/core/identity/services/identity.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { getDisplayName } from '@/engine/rules'

interface GeneralSettingsProps {
  communityId: string
  communityName: string | undefined
  communityType: string | undefined
  communityDescription: string | undefined
  pushSubscribed: boolean | null
  pushLoading: boolean
  onTogglePush: () => void
}

export function GeneralSettings({
  communityId,
  communityName,
  communityType,
  communityDescription,
  pushSubscribed,
  pushLoading,
  onTogglePush,
}: GeneralSettingsProps) {
  const queryClient = useQueryClient()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState('')

  useEffect(() => {
    if (communityDescription) setDescriptionValue(communityDescription)
  }, [communityDescription])

  const updateCommunityMut = useMutation({
    mutationFn: (updates: { name?: string; description?: string }) => updateCommunity(communityId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      setEditingName(false)
      setEditingDescription(false)
    },
  })

  return (
    <div className="space-y-6 rounded-lg border p-6">
      {/* Name */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Nombre de la comunidad</label>
        {editingName ? (
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} autoFocus className="flex-1" />
            <div className="flex gap-2">
              <Button
                onClick={() => updateCommunityMut.mutate({ name: nameValue })}
                disabled={!nameValue.trim() || updateCommunityMut.isPending}
                size="sm"
              >
                Guardar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditingName(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-lg font-semibold">{communityName}</p>
            <Button variant="ghost" size="sm" onClick={() => { setNameValue(communityName ?? ''); setEditingName(true) }}>
              Editar
            </Button>
          </div>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Tipo de comunidad</label>
        <p className="mt-1">
          <Badge variant="secondary">{getDisplayName(communityType ?? 'other')}</Badge>
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Descripción de la comunidad</label>
        {editingDescription ? (
          <div className="mt-1 space-y-2">
            <Textarea value={descriptionValue} onChange={(e) => setDescriptionValue(e.target.value)} placeholder="Describe tu comunidad..." rows={4} className="w-full" />
            <div className="flex gap-2">
              <Button
                onClick={() => updateCommunityMut.mutate({ description: descriptionValue })}
                disabled={updateCommunityMut.isPending}
                size="sm"
              >
                Guardar
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setDescriptionValue(communityDescription ?? ''); setEditingDescription(false) }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-start gap-2">
            <p className="text-sm text-muted-foreground flex-1">{communityDescription || 'No hay descripción'}</p>
            <Button variant="ghost" size="sm" onClick={() => { setDescriptionValue(communityDescription ?? ''); setEditingDescription(true) }}>
              {communityDescription ? 'Editar' : 'Agregar'}
            </Button>
          </div>
        )}
      </div>

      {/* ID */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">ID de comunidad</label>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{communityId}</p>
      </div>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Notificaciones Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
            <div className="rounded-md bg-muted border px-4 py-3 text-sm text-muted-foreground">
              La clave pública VAPID no está configurada (VITE_VAPID_PUBLIC_KEY). Las notificaciones push no estarán disponibles hasta que se configure en el servidor.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm">
                {pushSubscribed === null
                  ? 'Verificando estado...'
                  : pushSubscribed
                    ? 'Las notificaciones push están activadas en este dispositivo.'
                    : 'Las notificaciones push están desactivadas.'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recibe alertas de votaciones, cuotas y anuncios importantes.
              </p>
            </div>
            <Button
              variant={pushSubscribed ? 'outline' : 'default'}
              onClick={onTogglePush}
              disabled={pushLoading || pushSubscribed === null}
              className="w-full sm:w-auto"
            >
              {pushLoading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : pushSubscribed ? (
                <BellOff className="h-4 w-4 mr-1.5" />
              ) : (
                <Bell className="h-4 w-4 mr-1.5" />
              )}
              {pushLoading ? 'Procesando...' : pushSubscribed ? 'Desactivar' : 'Activar notificaciones'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Eliminar comunidad</p>
              <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
            </div>
            <Button variant="destructive" disabled title="Contacta soporte para eliminar" className="w-full sm:w-auto">
              Eliminar comunidad
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Transferir propiedad</p>
              <p className="text-sm text-muted-foreground">Transferir la propiedad de la comunidad a otro miembro</p>
            </div>
            <Button variant="destructive" disabled title="Contacta soporte para transferir" className="w-full sm:w-auto">
              Transferir propiedad
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
