import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/toast'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useAssemblyProxies, useGrantProxy, useRevokeProxy } from '../hooks/useProxies'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Users, ArrowRight, X, AlertTriangle, Shield, Info } from 'lucide-react'
import type { AssemblyProxy } from '../types'

interface Props {
  assemblyId: string
  disabled?: boolean
}

export function ProxyManager({ assemblyId, disabled = false }: Props) {
  const toast = useToast()
  const { isAdmin } = usePermissions()
  const { data: members } = useMembers()
  const { data: proxies, isLoading } = useAssemblyProxies(assemblyId)
  const grantMut = useGrantProxy()
  const revokeMut = useRevokeProxy(assemblyId)

  const [grantorId, setGrantorId] = useState('')
  const [representativeId, setRepresentativeId] = useState('')

  const activeProxies = proxies?.filter((p) => p.is_active) ?? []
  const activeMembers = members?.filter((m) => m.status === 'active') ?? []

  // Members who have already granted a proxy for this assembly
  const grantorIds = new Set(activeProxies.map((p) => p.grantor_id))

  // Count proxies per representative
  const proxiesPerRep = new Map<string, number>()
  activeProxies.forEach((p) => {
    proxiesPerRep.set(p.representative_id, (proxiesPerRep.get(p.representative_id) || 0) + 1)
  })

  // Eligible grantors: active members who haven't already granted a proxy
  const eligibleGrantors = activeMembers.filter((m) => !grantorIds.has(m.id))

  // Eligible representatives: active members (non-admin, not the grantor, max 2 proxies)
  const eligibleRepresentatives = activeMembers.filter((m) => {
    if (m.id === grantorId) return false
    if (m.role === 'admin') return false
    const currentCount = proxiesPerRep.get(m.id) || 0
    if (currentCount >= 2) return false
    return true
  })

  const getMemberName = (id: string) => {
    const m = activeMembers.find((m) => m.id === id)
    return m?.full_name || m?.email || id.slice(0, 8)
  }

  const handleGrant = async () => {
    if (!grantorId || !representativeId) return
    try {
      await grantMut.mutateAsync({
        assembly_id: assemblyId,
        grantor_id: grantorId,
        representative_id: representativeId,
      })
      toast.success('Representación otorgada exitosamente')
      setGrantorId('')
      setRepresentativeId('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al otorgar representación')
    }
  }

  const handleRevoke = async (proxy: AssemblyProxy) => {
    try {
      await revokeMut.mutateAsync(proxy.id)
      toast.success('Representación revocada')
    } catch {
      toast.error('Error al revocar representación')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Representación (Proxies)
          </CardTitle>
          {activeProxies.length > 0 && (
            <Badge variant="secondary">
              {activeProxies.length} representaci{activeProxies.length === 1 ? 'ón' : 'ones'} activa{activeProxies.length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Art. 36 rules info */}
        <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Art. 36 LPCI CDMX - Reglas de Representación:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
              <li>Cada condómino puede designar un representante</li>
              <li>Un representante no puede representar a más de 2 condóminos</li>
              <li>El administrador no puede actuar como representante</li>
            </ul>
          </div>
        </div>

        {/* Active proxies list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando representaciones...</p>
        ) : activeProxies.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Representaciones activas:</p>
            {activeProxies.map((proxy) => (
              <div
                key={proxy.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{proxy.grantor_name || getMemberName(proxy.grantor_id)}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Badge variant="default">{proxy.representative_name || getMemberName(proxy.representative_id)}</Badge>
                  {(proxiesPerRep.get(proxy.representative_id) || 0) >= 2 && (
                    <Badge variant="warning" className="text-xs">Máx. alcanzado</Badge>
                  )}
                </div>
                {isAdmin && !disabled && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRevoke(proxy)}
                    disabled={revokeMut.isPending}
                    aria-label="Revocar representación"
                    title="Revocar representación"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay representaciones activas para esta asamblea.</p>
        )}

        {/* Grant proxy form (admin only) */}
        {isAdmin && !disabled && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Otorgar representación</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={grantorId}
                onChange={(e) => {
                  setGrantorId(e.target.value)
                  setRepresentativeId('') // reset representative when grantor changes
                }}
                className="flex-1"
              >
                <option value="">Condómino que delega...</option>
                {eligibleGrantors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </Select>
              <Select
                value={representativeId}
                onChange={(e) => setRepresentativeId(e.target.value)}
                className="flex-1"
                disabled={!grantorId}
              >
                <option value="">Representante...</option>
                {eligibleRepresentatives.map((m) => {
                  const count = proxiesPerRep.get(m.id) || 0
                  return (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}{count > 0 ? ` (${count}/2 representaciones)` : ''}
                    </option>
                  )
                })}
              </Select>
              <Button
                onClick={handleGrant}
                disabled={!grantorId || !representativeId || grantMut.isPending}
                className="shrink-0"
              >
                <Users className="h-4 w-4 mr-2" />
                {grantMut.isPending ? 'Otorgando...' : 'Otorgar'}
              </Button>
            </div>
            {grantorId && eligibleRepresentatives.length === 0 && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  No hay representantes disponibles. Todos los condóminos ya representan a 2 personas o son administradores.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
