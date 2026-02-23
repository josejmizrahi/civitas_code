import { useState, useEffect } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvitations, cancelInvitation, updateCommunity } from '@/core/identity/services/identity.service'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { CategoryManager } from '@/core/treasury/components/CategoryManager'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Tags, Mail, Copy, X, Shield, Wallet, UserCheck, Sliders, ScrollText, CalendarClock, BookOpen, Vote, Bell, BellOff, Loader2, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { InviteMemberDialog } from '@/core/identity/components/InviteMemberDialog'
import { formatDate } from '@/shared/lib/utils'
import { isValidCurrencyCode, isValidLocaleCode, normalizeCurrencyCode, normalizeLocaleCode } from '@/shared/lib/locale'
import type { CommunityRules } from '@/shared/types/rules'
import { getCommunityRules, updateCommunityRules } from '@/shared/services/rules.service'
import { ARCOAdminPanel } from '@/core/privacy/components/ARCOAdminPanel'
import { AdminTermTracker } from '@/core/identity/components/AdminTermTracker'
import { VigilanciaPanel } from '@/core/identity/components/VigilanciaPanel'
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/shared/services/push-notification.service'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { FintocSetup } from '@/core/fintoc/components/FintocSetup'
import { AuditLog } from '@/shared/components/AuditLog'

export function SettingsPage() {
  const { communityId, community, currentMember } = useCommunityContext()
  const path = useCommunityPath()
  const { isAdmin } = usePermissions()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  type SettingsTab = 'general' | 'categories' | 'invitations' | 'rules' | 'notifications' | 'audit' | 'privacy' | 'terminos'
  const validTabs: SettingsTab[] = ['general', 'categories', 'invitations', 'rules', 'notifications', 'audit', 'privacy', 'terminos']
  const [tab, setTab] = useState<SettingsTab>(
    validTabs.includes(tabFromUrl as SettingsTab) ? (tabFromUrl as SettingsTab) : 'general'
  )
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [showFintocSetup, setShowFintocSetup] = useState(false)
  const [, setNotifPrefsVersion] = useState(0)

  // Push notification state
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    isPushSubscribed().then(setPushSubscribed)
  }, [])

  const togglePush = async () => {
    if (!currentMember) return
    setPushLoading(true)
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush()
        setPushSubscribed(false)
      } else {
        const ok = await subscribeToPush(currentMember.id)
        setPushSubscribed(ok)
      }
    } finally {
      setPushLoading(false)
    }
  }

  // Rules state
  const [rules, setRules] = useState<CommunityRules>(() =>
    getCommunityRules(null, (community as any)?.rules)
  )
  const [rulesSaved, setRulesSaved] = useState(false)

  useEffect(() => {
    if (community) {
      setRules(getCommunityRules(null, (community as any)?.rules))
    }
  }, [community])

  useEffect(() => {
    if (searchParams.get('fintoc') === '1') setShowFintocSetup(true)
  }, [searchParams])

  const navigate = useNavigate()

  const updateRulesMut = useMutation({
    mutationFn: (newRules: CommunityRules) => updateCommunityRules(communityId!, newRules, 'Actualización directa desde configuración'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      setRulesSaved(true)
      setTimeout(() => setRulesSaved(false), 3000)
    },
  })

  const updateGovernance = <K extends keyof CommunityRules['governance']>(
    key: K,
    value: CommunityRules['governance'][K]
  ) => setRules((prev) => ({ ...prev, governance: { ...prev.governance, [key]: value } }))

  const updateTreasury = <K extends keyof CommunityRules['treasury']>(
    key: K,
    value: CommunityRules['treasury'][K]
  ) => setRules((prev) => ({ ...prev, treasury: { ...prev.treasury, [key]: value } }))

  const updateIdentity = <K extends keyof CommunityRules['identity']>(
    key: K,
    value: CommunityRules['identity'][K]
  ) => setRules((prev) => ({ ...prev, identity: { ...prev.identity, [key]: value } }))

  const updateCompliance = <K extends keyof CommunityRules['compliance']>(
    key: K,
    value: CommunityRules['compliance'][K]
  ) => setRules((prev) => ({ ...prev, compliance: { ...prev.compliance, [key]: value } }))

  const toggleRestriction = (restriction: string) => {
    setRules((prev) => {
      const current = prev.identity.delinquent_restrictions
      const next = current.includes(restriction)
        ? current.filter((r) => r !== restriction)
        : [...current, restriction]
      return { ...prev, identity: { ...prev.identity, delinquent_restrictions: next } }
    })
  }

  const toggleProposalRight = (role: string) => {
    setRules((prev) => {
      const current = prev.governance.proposal_rights
      const next = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role]
      return { ...prev, governance: { ...prev.governance, proposal_rights: next } }
    })
  }

  // Community name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  // Community description editing
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState('')

  useEffect(() => {
    if (community?.description) {
      setDescriptionValue(community.description)
    }
  }, [community?.description])

  const updateCommunityMut = useMutation({
    mutationFn: (updates: { name?: string; description?: string }) => updateCommunity(communityId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      setEditingName(false)
      setEditingDescription(false)
    },
  })

  // Invitations
  const { data: invitations } = useQuery({
    queryKey: ['invitations', communityId],
    queryFn: () => getInvitations(communityId!),
    enabled: !!communityId,
  })

  const cancelInvitationMut = useMutation({
    mutationFn: (id: string) => cancelInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations', communityId] }),
  })

  const pendingInvitations = invitations?.filter((i) => i.status === 'pending') ?? []

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
  }

  const communityTypeLabels: Record<string, string> = {
    residential: 'Residencial',
    religious: 'Religiosa',
    cooperative: 'Cooperativa',
    manufacturing: 'Manufacturera',
    other: 'General',
  }

  const rulesCurrencyValid = isValidCurrencyCode(rules.treasury.currency)
  const rulesLocaleValid = isValidLocaleCode(rules.treasury.locale)
  const requiresIfpeConfig = rules.treasury.mode === 'fintech_rail' || rules.treasury.mode === 'hybrid'
  const clabeValid = !requiresIfpeConfig || /^\d{18}$/.test(rules.treasury.clabe ?? '')
  const beneficiaryValid = !requiresIfpeConfig || Boolean((rules.treasury.beneficiary_name ?? '').trim())
  const rulesFormValid = rulesCurrencyValid && rulesLocaleValid && clabeValid && beneficiaryValid

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(path('dashboard'))} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.adminOnly')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground">Nombre, reglas, categorías e invitaciones de {community?.name || 'tu comunidad'}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="gap-1">
          <TabsTrigger value="general" className="shrink-0 whitespace-nowrap">{t('settings.tab.general')}</TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0 whitespace-nowrap">{t('settings.tab.categories')}</TabsTrigger>
          <TabsTrigger value="invitations" className="shrink-0 whitespace-nowrap">{t('settings.tab.invitations')}</TabsTrigger>
          <TabsTrigger value="rules" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <Sliders className="h-3.5 w-3.5" />
            {t('settings.tab.rules')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <ScrollText className="h-3.5 w-3.5" />
            {t('settings.tab.privacy')}
          </TabsTrigger>
          <TabsTrigger value="terminos" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <CalendarClock className="h-3.5 w-3.5" />
            {t('settings.tab.terms')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <Bell className="h-3.5 w-3.5" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="audit" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <Shield className="h-3.5 w-3.5" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6 rounded-lg border p-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre de la comunidad</label>
              {editingName ? (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateCommunityMut.mutate({ name: nameValue })}
                      disabled={!nameValue.trim() || updateCommunityMut.isPending}
                      size="sm"
                    >
                      Guardar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingName(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-semibold">{community?.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameValue(community?.name ?? '')
                      setEditingName(true)
                    }}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo de comunidad</label>
              <p className="mt-1">
                <Badge variant="secondary">
                  {communityTypeLabels[community?.type ?? 'other'] ?? 'General'}
                </Badge>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Descripción de la comunidad</label>
              {editingDescription ? (
                <div className="mt-1 space-y-2">
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Describe tu comunidad..."
                    rows={4}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateCommunityMut.mutate({ description: descriptionValue })}
                      disabled={updateCommunityMut.isPending}
                      size="sm"
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDescriptionValue(community?.description ?? '')
                        setEditingDescription(false)
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start gap-2">
                  <p className="text-sm text-muted-foreground flex-1">
                    {community?.description || 'No hay descripción'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDescriptionValue(community?.description ?? '')
                      setEditingDescription(true)
                    }}
                  >
                    {community?.description ? 'Editar' : 'Agregar'}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">ID de comunidad</label>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{communityId}</p>
            </div>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Notificaciones Push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
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
                    onClick={togglePush}
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
                    {pushLoading
                      ? 'Procesando...'
                      : pushSubscribed
                        ? 'Desactivar'
                        : 'Activar notificaciones'}
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
                    <p className="text-sm text-muted-foreground">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled
                    title="Contacta soporte para eliminar"
                    className="w-full sm:w-auto"
                  >
                    Eliminar comunidad
                  </Button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Transferir propiedad</p>
                    <p className="text-sm text-muted-foreground">
                      Transferir la propiedad de la comunidad a otro miembro
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled
                    title="Contacta soporte para transferir"
                    className="w-full sm:w-auto"
                  >
                    Transferir propiedad
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Tags className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Gestión de Categorías</h2>
            </div>
            <CategoryManager />
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
                <UserCheck className="h-4 w-4 mr-2" />
                Crear invitación
              </Button>
            </div>
            <InviteMemberDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />

            {pendingInvitations.length === 0 ? (
              <p className="text-muted-foreground">No hay invitaciones pendientes.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden sm:table-cell">Expira</TableHead>
                      <TableHead className="w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{inv.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(inv.expires_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyInviteLink(inv.token)}
                              title="Copiar link de invitación"
                              aria-label="Copiar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => cancelInvitationMut.mutate(inv.id)}
                              title="Cancelar invitación"
                              aria-label="Cancelar"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <div className="space-y-6">
            {/* Success banner */}
            {rulesSaved && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                Reglas guardadas exitosamente.
              </div>
            )}

            {/* Governance Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Gobernanza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Default Quorum */}
                <div className="space-y-2">
                  <Label>Quórum por defecto: {Math.round(rules.governance.default_quorum * 100)}%</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(rules.governance.default_quorum * 100)}
                    onChange={(e) => updateGovernance('default_quorum', Number(e.target.value) / 100)}
                    className="w-full accent-primary h-2 cursor-pointer rounded-lg appearance-none bg-muted"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Default Majority */}
                <div className="space-y-2">
                  <Label>Mayoría por defecto: {Math.round(rules.governance.default_majority * 100)}%</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(rules.governance.default_majority * 100)}
                    onChange={(e) => updateGovernance('default_majority', Number(e.target.value) / 100)}
                    className="w-full accent-primary h-2 cursor-pointer rounded-lg appearance-none bg-muted"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Delegation */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.governance.delegation_enabled}
                    onChange={(e) => updateGovernance('delegation_enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">Delegación habilitada</span>
                </label>

                {/* Proposal Rights */}
                <div className="space-y-2">
                  <Label>Derechos de propuesta</Label>
                  <div className="flex flex-wrap gap-2">
                    {['admin', 'tesorero', 'miembro'].map((role) => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rules.governance.proposal_rights.includes(role)}
                          onChange={() => toggleProposalRight(role)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-sm capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cool-down hours */}
                <div className="space-y-2">
                  <Label htmlFor="cool_down_hours">Horas de enfriamiento</Label>
                  <Input
                    id="cool_down_hours"
                    type="number"
                    min={0}
                    value={rules.governance.cool_down_hours}
                    onChange={(e) => updateGovernance('cool_down_hours', Number(e.target.value))}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo entre que se aprueba una votación y se ejecuta.
                  </p>
                </div>

                {/* Endorsements */}
                <div className="space-y-2">
                  <Label htmlFor="min_endorsements">Avales requeridos para propuestas</Label>
                  <Input
                    id="min_endorsements"
                    type="number"
                    min={0}
                    max={50}
                    value={rules.governance.min_endorsements ?? 3}
                    onChange={(e) => updateGovernance('min_endorsements', Number(e.target.value))}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad de avales que necesita una propuesta antes de notificar a todos. 0 = sin avales (notificación inmediata).
                  </p>
                </div>

                {/* Auto-execution */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.governance.auto_execution_enabled}
                    onChange={(e) => updateGovernance('auto_execution_enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">Auto-ejecución habilitada</span>
                </label>

                {rules.governance.auto_execution_enabled && (
                  <div className="space-y-2 ml-7">
                    <Label htmlFor="auto_execution_threshold">Umbral de auto-ejecución</Label>
                    <Input
                      id="auto_execution_threshold"
                      type="number"
                      min={0}
                      value={rules.governance.auto_execution_threshold}
                      onChange={(e) => updateGovernance('auto_execution_threshold', Number(e.target.value))}
                      className="max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Solo auto-ejecutar montos menores a este valor. 0 = sin límite.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treasury Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  Tesorería
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Mode */}
                <div className="space-y-2">
                  <Label>Modo de tesorería</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Badge variant="secondary" className="text-sm w-fit">
                      {{
                        import: 'Importación',
                        connector: 'Conector bancario',
                        fintech_rail: 'Rail fintech (IFPE)',
                        hybrid: 'Híbrido',
                      }[rules.treasury.mode]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {rules.treasury.mode === 'fintech_rail'
                        ? 'Requiere licencia IFPE — no editable'
                        : 'Configurado al crear la comunidad'}
                    </span>
                  </div>
                </div>

                {/* BROXEL / Pagos electrónicos — visible desde el inicio; acceso por suscripción + documentación */}
                <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <p className="text-sm font-medium text-emerald-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Pagos electrónicos con BROXEL
                  </p>
                  <p className="text-xs text-emerald-800/90">
                    Recibe SPEI, concilia cuotas automáticamente y dispersa pagos con gobernanza. Debes suscribirte y subir documentación para obtener acceso.
                  </p>
                  {(community as any)?.ifpe_status === 'active' ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Acceso BROXEL activo. CLABE y opciones en Tesorería.</span>
                    </div>
                  ) : (community as any)?.ifpe_status === 'pending_kyb' ? (
                    <p className="text-sm text-amber-800">Solicitud en revisión. Te notificaremos cuando esté lista.</p>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => setShowFintocSetup(true)}
                    >
                      Configurar Fintoc
                    </Button>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <Input
                    id="locale"
                    value={rules.treasury.locale}
                    onChange={(e) => updateTreasury('locale', normalizeLocaleCode(e.target.value))}
                    className="max-w-[200px]"
                    placeholder="es-MX"
                  />
                  {!rulesLocaleValid && (
                    <p className="text-xs text-destructive">Locale inválido. Ejemplos: es-MX, en-US, pt-BR.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    value={rules.treasury.currency}
                    onChange={(e) => updateTreasury('currency', normalizeCurrencyCode(e.target.value))}
                    className="max-w-[200px]"
                    placeholder="MXN"
                  />
                  {!rulesCurrencyValid && (
                    <p className="text-xs text-destructive">Moneda inválida. Usa código ISO 4217 (MXN, USD, EUR).</p>
                  )}
                </div>

                {/* Admin spending limit */}
                <div className="space-y-2">
                  <Label htmlFor="admin_spending_limit">Límite de gasto del admin</Label>
                  <Input
                    id="admin_spending_limit"
                    type="number"
                    min={0}
                    value={rules.treasury.admin_spending_limit}
                    onChange={(e) => updateTreasury('admin_spending_limit', Number(e.target.value))}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    El admin puede gastar hasta este monto sin votación.
                  </p>
                </div>

                {/* Require vote above */}
                <div className="space-y-2">
                  <Label htmlFor="require_vote_above">Requerir votación arriba de</Label>
                  <Input
                    id="require_vote_above"
                    type="number"
                    min={0}
                    value={rules.treasury.require_vote_above}
                    onChange={(e) => updateTreasury('require_vote_above', Number(e.target.value))}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montos superiores a este valor requieren aprobación por votación.
                  </p>
                </div>

                {/* IFPE config */}
                {requiresIfpeConfig && (
                  <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50/40 p-4">
                    <p className="text-sm font-medium text-amber-900">Configuración IFPE / SPEI</p>
                    <div className="space-y-2">
                      <Label htmlFor="ifpe-clabe">CLABE receptora (18 dígitos)</Label>
                      <Input
                        id="ifpe-clabe"
                        value={rules.treasury.clabe ?? ''}
                        onChange={(e) => updateTreasury('clabe', e.target.value.replace(/\D/g, '').slice(0, 18))}
                        className="max-w-[260px]"
                        placeholder="646180157000000000"
                      />
                      {!clabeValid && (
                        <p className="text-xs text-destructive">La CLABE debe tener exactamente 18 dígitos.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifpe-beneficiary">Beneficiario</Label>
                      <Input
                        id="ifpe-beneficiary"
                        value={rules.treasury.beneficiary_name ?? ''}
                        onChange={(e) => updateTreasury('beneficiary_name', e.target.value)}
                        className="max-w-[360px]"
                        placeholder="Comunidad Ejemplo A.C."
                      />
                      {!beneficiaryValid && (
                        <p className="text-xs text-destructive">El beneficiario es obligatorio en modo IFPE/híbrido.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifpe-bank">Banco / IFPE</Label>
                      <Input
                        id="ifpe-bank"
                        value={rules.treasury.bank_name ?? ''}
                        onChange={(e) => updateTreasury('bank_name', e.target.value)}
                        className="max-w-[260px]"
                        placeholder="STP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifpe-prefix">Prefijo referencia</Label>
                      <Input
                        id="ifpe-prefix"
                        value={rules.treasury.payment_reference_prefix ?? ''}
                        onChange={(e) => updateTreasury('payment_reference_prefix', e.target.value.toUpperCase())}
                        className="max-w-[200px]"
                        placeholder="CIV-"
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.treasury.auto_reconciliation}
                        onChange={(e) => updateTreasury('auto_reconciliation', e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-sm">Auto-conciliación de SPEI</span>
                    </label>
                  </div>
                )}

                {showFintocSetup && (
                  <div className="mt-4">
                    <FintocSetup />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Identity Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-violet-600" />
                  Identidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Payment to vote — KEY FEATURE */}
                <div className="rounded-md border border-violet-200 bg-violet-50/50 p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.identity.payment_to_vote_enabled}
                      onChange={(e) => updateIdentity('payment_to_vote_enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">Pago condiciona voto</span>
                      <p className="text-xs text-muted-foreground">
                        Si está activo, los miembros morosos pierden derechos de participación.
                      </p>
                    </div>
                  </label>
                </div>

                {rules.identity.payment_to_vote_enabled && (
                  <div className="ml-4 space-y-5 border-l-2 border-violet-200 pl-4">
                    {/* Grace period */}
                    <div className="space-y-2">
                      <Label htmlFor="grace_period_months">Periodo de gracia (meses)</Label>
                      <Input
                        id="grace_period_months"
                        type="number"
                        min={0}
                        value={rules.identity.grace_period_months}
                        onChange={(e) => updateIdentity('grace_period_months', Number(e.target.value))}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Meses que el miembro puede estar moroso antes de perder derechos.
                      </p>
                    </div>

                    {/* Auto restore */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.identity.auto_restore_on_payment}
                        onChange={(e) => updateIdentity('auto_restore_on_payment', e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <div>
                        <span className="text-sm">Restaurar derechos automáticamente al pagar</span>
                      </div>
                    </label>

                    {/* Delinquent restrictions */}
                    <div className="space-y-2">
                      <Label>Restricciones para morosos</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'vote', label: 'Votar' },
                          { value: 'propose', label: 'Proponer' },
                          { value: 'delegate', label: 'Delegar' },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rules.identity.delinquent_restrictions.includes(opt.value)}
                              onChange={() => toggleRestriction(opt.value)}
                              className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Cumplimiento legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compliance_jurisdiction">Jurisdicción</Label>
                  <select
                    id="compliance_jurisdiction"
                    value={rules.compliance.jurisdiction}
                    onChange={(e) => updateCompliance('jurisdiction', e.target.value as CommunityRules['compliance']['jurisdiction'])}
                    className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="mx">México</option>
                    <option value="us">Estados Unidos</option>
                    <option value="eu">Unión Europea</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compliance_privacy">Marco de privacidad</Label>
                  <select
                    id="compliance_privacy"
                    value={rules.compliance.privacy_framework}
                    onChange={(e) => updateCompliance('privacy_framework', e.target.value as CommunityRules['compliance']['privacy_framework'])}
                    className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="lfpdppp">LFPDPPP (MX)</option>
                    <option value="ccpa">CCPA (US)</option>
                    <option value="gdpr">GDPR (EU)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compliance_property">Marco patrimonial / comunidad</Label>
                  <select
                    id="compliance_property"
                    value={rules.compliance.property_framework}
                    onChange={(e) => updateCompliance('property_framework', e.target.value as CommunityRules['compliance']['property_framework'])}
                    className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="lpci_cdmx">LPCI CDMX (MX)</option>
                    <option value="hoa_us">HOA (US)</option>
                    <option value="none">No aplica</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Save button + shortcuts */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={() => updateRulesMut.mutate(rules)}
                disabled={updateRulesMut.isPending || !rulesFormValid}
              >
                {updateRulesMut.isPending ? 'Guardando...' : 'Guardar Reglas'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(path('governance'), { state: { openProposal: true, template: 'cambio_regla' } })}
              >
                <Vote className="h-3.5 w-3.5 mr-1" />
                Cambiar Regla via Propuesta
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(path('rules'))}>
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                Ver Reglas Vigentes
              </Button>
              {updateRulesMut.isError && (
                <span className="text-sm text-destructive">
                  Error al guardar. Intenta de nuevo.
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <ARCOAdminPanel />
        </TabsContent>

        {/* Terminos Tab — LPCI CDMX Art. 42-46 */}
        <TabsContent value="terminos">
          <div className="space-y-6">
            <AdminTermTracker />
            <VigilanciaPanel />
          </div>
        </TabsContent>

        {/* Notificaciones Tab — GAP-13 */}
        <TabsContent value="notifications">
          <div className="space-y-6 rounded-lg border p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Notificaciones Push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    La clave pública VAPID no está configurada. Las notificaciones push no estarán disponibles.
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm">
                      {pushSubscribed === null ? 'Verificando...' : pushSubscribed ? 'Push activadas en este dispositivo.' : 'Push desactivadas.'}
                    </p>
                  </div>
                  <Button variant={pushSubscribed ? 'outline' : 'default'} onClick={togglePush} disabled={pushLoading || pushSubscribed === null}>
                    {pushLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : pushSubscribed ? <BellOff className="h-4 w-4 mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
                    {pushLoading ? 'Procesando...' : pushSubscribed ? 'Desactivar' : 'Activar notificaciones'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferencias por tipo</CardTitle>
                <p className="text-sm text-muted-foreground">Activa o desactiva tipos de notificación (se aplican al recibir push/email).</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'proposal_new', label: 'Nuevas propuestas y avales' },
                  { key: 'obligation_reminder', label: 'Recordatorios de pago' },
                  { key: 'monthly_report', label: 'Reporte mensual' },
                  { key: 'budget_exceeded', label: 'Alertas de presupuesto (vigilancia)' },
                ].map(({ key, label }) => {
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
                            setNotifPrefsVersion((v) => v + 1)
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
        </TabsContent>

        {/* Auditoría Tab */}
        <TabsContent value="audit">
          <div className="space-y-6 rounded-lg border p-6">
            <AuditLog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
