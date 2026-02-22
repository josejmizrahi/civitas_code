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
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  assemblyId: string
  disabled?: boolean
}

export function ProxyManager({ assemblyId, disabled = false }: Props) {
  const { t } = useI18n()
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
      toast.success(t('proxy.toast.granted'))
      setGrantorId('')
      setRepresentativeId('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('proxy.toast.grantError'))
    }
  }

  const handleRevoke = async (proxy: AssemblyProxy) => {
    try {
      await revokeMut.mutateAsync(proxy.id)
      toast.success(t('proxy.toast.revoked'))
    } catch {
      toast.error(t('proxy.toast.revokeError'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t('proxy.title')}
          </CardTitle>
          {activeProxies.length > 0 && (
            <Badge variant="secondary">
              {t('proxy.activeCount').replace('{count}', String(activeProxies.length))}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Art. 36 rules info */}
        <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{t('proxy.rulesTitle')}</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
              <li>{t('proxy.rule.1')}</li>
              <li>{t('proxy.rule.2')}</li>
              <li>{t('proxy.rule.3')}</li>
            </ul>
          </div>
        </div>

        {/* Active proxies list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('proxy.loading')}</p>
        ) : activeProxies.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t('proxy.activeList')}</p>
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
                    <Badge variant="warning" className="text-xs">{t('proxy.maxReached')}</Badge>
                  )}
                </div>
                {isAdmin && !disabled && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRevoke(proxy)}
                    disabled={revokeMut.isPending}
                    aria-label={t('proxy.revoke')}
                    title={t('proxy.revoke')}
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('proxy.empty')}</p>
        )}

        {/* Grant proxy form (admin only) */}
        {isAdmin && !disabled && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">{t('proxy.grant')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={grantorId}
                onChange={(e) => {
                  setGrantorId(e.target.value)
                  setRepresentativeId('') // reset representative when grantor changes
                }}
                className="flex-1"
              >
                <option value="">{t('proxy.grantorPlaceholder')}</option>
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
                <option value="">{t('proxy.representativePlaceholder')}</option>
                {eligibleRepresentatives.map((m) => {
                  const count = proxiesPerRep.get(m.id) || 0
                  return (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}{count > 0 ? ` ${t('proxy.representationsCount').replace('{count}', String(count))}` : ''}
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
                {grantMut.isPending ? t('proxy.granting') : t('proxy.grantButton')}
              </Button>
            </div>
            {grantorId && eligibleRepresentatives.length === 0 && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  {t('proxy.noRepresentatives')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
