import { useState, useEffect } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useTenant } from '@/app/providers/TenantProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvitations, cancelInvitation } from '@/core/identity/services/identity.service'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { CategoryManager } from '@/core/treasury/components/CategoryManager'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Tags, Mail, Copy, X, Shield, Sliders, ScrollText, CalendarClock, Bell, UserCheck, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { InviteMemberDialog } from '@/core/identity/components/InviteMemberDialog'
import { formatDate } from '@/shared/lib/utils'
import type { CommunityRules } from '@/shared/types/rules'
import { getCommunityRules, updateCommunityRules } from '@/shared/services/rules.service'
import { ARCOAdminPanel } from '@/core/privacy/components/ARCOAdminPanel'
import { AdminTermTracker } from '@/core/identity/components/AdminTermTracker'
import { VigilanciaPanel } from '@/core/identity/components/VigilanciaPanel'
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/shared/services/push-notification.service'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { AuditLog } from '@/shared/components/AuditLog'
import { GeneralSettings } from './components/GeneralSettings'
import { RulesEditor } from './components/RulesEditor'
import { NotificationSettings } from './components/NotificationSettings'

export function SettingsPage() {
  const { communityId, community, currentMember } = useCommunityContext()
  const { legalFramework } = useTenant()
  const path = useCommunityPath()
  const { isAdmin } = usePermissions()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()

  const tabFromUrl = searchParams.get('tab')
  type SettingsTab = 'general' | 'categories' | 'invitations' | 'rules' | 'notifications' | 'audit' | 'privacy' | 'terminos'
  const validTabs: SettingsTab[] = ['general', 'categories', 'invitations', 'rules', 'notifications', 'audit', 'privacy', 'terminos']
  const [tab, setTab] = useState<SettingsTab>(
    validTabs.includes(tabFromUrl as SettingsTab) ? (tabFromUrl as SettingsTab) : 'general'
  )
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  // Push notification state
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null)
  const [pushLoading, setPushLoading] = useState(false)

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
    getCommunityRules(null, community?.rules as Record<string, unknown> | null)
  )
  const [rulesSaved, setRulesSaved] = useState(false)

  useEffect(() => {
    if (community) setRules(getCommunityRules(null, community.rules as Record<string, unknown> | null))
  }, [community])

  const updateRulesMut = useMutation({
    mutationFn: (newRules: CommunityRules) => updateCommunityRules(communityId!, newRules, 'Actualización directa desde configuración'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
      setRulesSaved(true)
      setTimeout(() => setRulesSaved(false), 3000)
    },
  })

  const updateGovernance = <K extends keyof CommunityRules['governance']>(key: K, value: CommunityRules['governance'][K]) =>
    setRules((prev) => ({ ...prev, governance: { ...prev.governance, [key]: value } }))

  const updateTreasury = <K extends keyof CommunityRules['treasury']>(key: K, value: CommunityRules['treasury'][K]) =>
    setRules((prev) => ({ ...prev, treasury: { ...prev.treasury, [key]: value } }))

  const updateIdentity = <K extends keyof CommunityRules['identity']>(key: K, value: CommunityRules['identity'][K]) =>
    setRules((prev) => ({ ...prev, identity: { ...prev.identity, [key]: value } }))

  const updateCompliance = <K extends keyof CommunityRules['compliance']>(key: K, value: CommunityRules['compliance'][K]) =>
    setRules((prev) => ({ ...prev, compliance: { ...prev.compliance, [key]: value } }))

  const toggleRestriction = (restriction: string) => {
    setRules((prev) => {
      const current = prev.identity.delinquent_restrictions
      const next = current.includes(restriction) ? current.filter((r) => r !== restriction) : [...current, restriction]
      return { ...prev, identity: { ...prev.identity, delinquent_restrictions: next } }
    })
  }

  const toggleProposalRight = (role: string) => {
    setRules((prev) => {
      const current = prev.governance.proposal_rights
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
      return { ...prev, governance: { ...prev.governance, proposal_rights: next } }
    })
  }

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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(path('dashboard'))} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('settings.backToPanel')}
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
          <p className="text-sm text-muted-foreground">{t('settings.subtitle')} — {community?.name}</p>
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
            {t('settings.tab.notifications')}
          </TabsTrigger>
          <TabsTrigger value="audit" className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
            <Shield className="h-3.5 w-3.5" />
            {t('settings.tab.audit')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            communityId={communityId!}
            communityName={community?.name}
            communityType={community?.type}
            communityDescription={community?.description}
            pushSubscribed={pushSubscribed}
            pushLoading={pushLoading}
            onTogglePush={togglePush}
          />
        </TabsContent>

        <TabsContent value="categories">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Tags className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{t('settings.categories.title')}</h2>
            </div>
            <CategoryManager />
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="rounded-lg border p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{t('settings.invitations.title')}</h2>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
                <UserCheck className="h-4 w-4 mr-2" />
                {t('settings.invitations.create')}
              </Button>
            </div>
            <InviteMemberDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
            {pendingInvitations.length === 0 ? (
              <p className="text-muted-foreground">{t('settings.invitations.empty')}</p>
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
                        <TableCell><Badge variant="secondary">{inv.role}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(inv.expires_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => copyInviteLink(inv.token)} title="Copiar link de invitación" aria-label="Copiar">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => cancelInvitationMut.mutate(inv.id)} title="Cancelar invitación" aria-label="Cancelar">
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

        <TabsContent value="rules">
          <RulesEditor
            rules={rules}
            rulesSaved={rulesSaved}
            isSaving={updateRulesMut.isPending}
            saveError={updateRulesMut.isError}
            legalFramework={legalFramework}
            fintocStatus={community?.fintoc_status}
            onUpdateGovernance={updateGovernance}
            onUpdateTreasury={updateTreasury}
            onUpdateIdentity={updateIdentity}
            onUpdateCompliance={updateCompliance}
            onToggleRestriction={toggleRestriction}
            onToggleProposalRight={toggleProposalRight}
            onSave={() => updateRulesMut.mutate(rules)}
            onNavigatePayments={() => navigate(path('payments'))}
            onNavigateGovernance={() => navigate(path('governance'), { state: { openProposal: true, template: 'cambio_regla' } })}
            onNavigateRules={() => navigate(path('rules'))}
          />
        </TabsContent>

        <TabsContent value="privacy">
          <ARCOAdminPanel />
        </TabsContent>

        <TabsContent value="terminos">
          <div className="space-y-6">
            <AdminTermTracker />
            <VigilanciaPanel />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            communityId={communityId!}
            pushSubscribed={pushSubscribed}
            pushLoading={pushLoading}
            onTogglePush={togglePush}
          />
        </TabsContent>

        <TabsContent value="audit">
          <div className="space-y-6 rounded-lg border p-6">
            <AuditLog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
