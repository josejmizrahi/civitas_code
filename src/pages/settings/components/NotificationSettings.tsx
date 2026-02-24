import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface NotificationSettingsProps {
  communityId: string
  pushSubscribed: boolean | null
  pushLoading: boolean
  onTogglePush: () => void
}

const NOTIFICATION_TYPES = [
  { key: 'proposal_new', label: 'Nuevas propuestas y avales' },
  { key: 'obligation_reminder', label: 'Recordatorios de pago' },
  { key: 'monthly_report', label: 'Reporte mensual' },
  { key: 'budget_exceeded', label: 'Alertas de presupuesto (vigilancia)' },
]

export function NotificationSettings({
  communityId,
  pushSubscribed,
  pushLoading,
  onTogglePush,
}: NotificationSettingsProps) {
  const [, setPrefsVersion] = useState(0)

  return (
    <div className="space-y-6 rounded-lg border p-6">
      {/* Push toggle */}
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
              La clave pública VAPID no está configurada. Las notificaciones push no estarán disponibles.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {pushSubscribed === null ? 'Verificando...' : pushSubscribed ? 'Push activadas en este dispositivo.' : 'Push desactivadas.'}
            </p>
            <Button variant={pushSubscribed ? 'outline' : 'default'} onClick={onTogglePush} disabled={pushLoading || pushSubscribed === null}>
              {pushLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : pushSubscribed ? <BellOff className="h-4 w-4 mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
              {pushLoading ? 'Procesando...' : pushSubscribed ? 'Desactivar' : 'Activar notificaciones'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification type preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias por tipo</CardTitle>
          <p className="text-sm text-muted-foreground">Activa o desactiva tipos de notificación (se aplican al recibir push/email).</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_TYPES.map(({ key, label }) => {
            const prefsKey = `civitas_notif_${communityId}_${key}`
            const enabled = typeof localStorage !== 'undefined' && localStorage.getItem(prefsKey) !== 'off'
            return (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm font-normal">{label}</Label>
                <Button
                  variant={enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (typeof localStorage !== 'undefined') {
                      localStorage.setItem(prefsKey, enabled ? 'off' : 'on')
                      setPrefsVersion((v) => v + 1)
                    }
                  }}
                >
                  {enabled ? 'On' : 'Off'}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm">Día del reporte mensual (1-28)</Label>
            <Input
              type="number"
              min={1}
              max={28}
              defaultValue={typeof localStorage !== 'undefined' ? localStorage.getItem(`civitas_report_day_${communityId}`) || '1' : '1'}
              onChange={(e) => { const v = e.target.value; if (typeof localStorage !== 'undefined' && v) localStorage.setItem(`civitas_report_day_${communityId}`, v) }}
              className="mt-1 w-24"
            />
          </div>
          <div>
            <Label className="text-sm">Días de anticipación para recordatorios de pago</Label>
            <Input
              type="number"
              min={0}
              max={30}
              defaultValue={typeof localStorage !== 'undefined' ? localStorage.getItem(`civitas_reminder_days_${communityId}`) || '3' : '3'}
              onChange={(e) => { const v = e.target.value; if (typeof localStorage !== 'undefined' && v) localStorage.setItem(`civitas_reminder_days_${communityId}`, v) }}
              className="mt-1 w-24"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
