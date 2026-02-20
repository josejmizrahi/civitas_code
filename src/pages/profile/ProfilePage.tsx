import { useState, useEffect } from 'react'
import { useAuth, useCommunityContext } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { PageHeader } from '@/shared/components/PageHeader'
import { AlertBanner } from '@/shared/components/AlertBanner'
import { supabase } from '@/shared/lib/supabase'
import { User, Lock, Building2, Shield, ScrollText } from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'
import type { Member } from '@/core/identity/types'
import { ARCORightsPanel } from '@/core/privacy/components/ARCORightsPanel'

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  admin: 'default',
  tesorero: 'success',
  miembro: 'secondary',
  observador: 'outline',
}

const roleLabels: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  comite_vigilancia: 'Comité de Vigilancia',
  miembro: 'Miembro',
  observador: 'Observador',
}

const financialStandingLabels: Record<string, string> = {
  good_standing: 'Al día',
  grace_period: 'Período de gracia',
  delinquent: 'Moroso',
  moroso: 'Moroso',
}

const financialStandingVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  good_standing: 'success',
  grace_period: 'warning',
  delinquent: 'destructive',
  moroso: 'destructive',
}

export function ProfilePage() {
  const { user, updatePassword } = useAuth()
  const { currentMember, userCommunities, communityId, setCommunityId } = useCommunityContext()
  const [membersByCommunity, setMembersByCommunity] = useState<Record<string, Member>>({})

  // Fetch member info for all communities
  useEffect(() => {
    if (!user || userCommunities.length === 0) return

    const fetchAllMemberships = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .in('community_id', userCommunities.map(c => c.id))

      if (!error && data) {
        const membersMap: Record<string, Member> = {}
        data.forEach((member: any) => {
          membersMap[member.community_id] = member as Member
        })
        setMembersByCommunity(membersMap)
      }
    }

    fetchAllMemberships()
  }, [user, userCommunities])

  // Personal Info state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  // Sync fullName when user changes
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name)
    }
  }, [user])

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSaveName = async () => {
    setNameError('')
    setNameSuccess(false)
    
    if (!fullName.trim()) {
      setNameError('El nombre no puede estar vacío')
      return
    }

    setNameSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })
      if (error) throw error
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : 'Error al actualizar el nombre')
    } finally {
      setNameSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setPasswordSaving(true)
    try {
      await updatePassword(newPassword)
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSwitchCommunity = (id: string) => {
    setCommunityId(id)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Perfil" description="Gestiona tu cuenta y preferencias" />

      {/* Personal Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El correo electrónico no se puede cambiar
              </p>
            </div>
          </div>
          {nameError && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}
          {nameSuccess && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-sm text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Nombre actualizado exitosamente</span>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleSaveName} disabled={nameSaving}>
              {nameSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                minLength={6}
              />
            </div>
          </div>
          {passwordError && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-sm text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Contraseña actualizada exitosamente</span>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleChangePassword} disabled={passwordSaving}>
              {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Communities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mis Comunidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userCommunities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No perteneces a ninguna comunidad aún.</p>
          ) : (
            <div className="space-y-3">
              {userCommunities.map((community) => {
                const isCurrent = community.id === communityId
                const member = membersByCommunity[community.id] || (isCurrent ? currentMember : null)
                return (
                  <div
                    key={community.id}
                    className={`flex flex-col gap-3 p-4 rounded-lg border sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent ? 'bg-accent border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{community.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {community.type ? community.type.charAt(0).toUpperCase() + community.type.slice(1) : 'Comunidad'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {member && (
                        <Badge variant={roleBadgeVariant[member.role] || 'secondary'}>
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      )}
                      {isCurrent && currentMember && (
                        <Badge variant={financialStandingVariant[currentMember.financial_standing] || 'success'}>
                          {financialStandingLabels[currentMember.financial_standing] || currentMember.financial_standing}
                        </Badge>
                      )}
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchCommunity(community.id)}
                        >
                          Cambiar a esta
                        </Button>
                      )}
                      {isCurrent && (
                        <Badge variant="default">Actual</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Activity Summary Section */}
      {currentMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Rol en la comunidad actual</Label>
                <div>
                  <Badge variant={roleBadgeVariant[currentMember.role] || 'secondary'}>
                    {roleLabels[currentMember.role] || currentMember.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Estado financiero</Label>
                <div>
                  <Badge variant={financialStandingVariant[currentMember.financial_standing] || 'success'}>
                    {financialStandingLabels[currentMember.financial_standing] || currentMember.financial_standing}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Peso de voto</Label>
                <p className="text-sm font-medium">
                  {(currentMember as any)?.voting_weight || 1}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Miembro desde</Label>
                <p className="text-sm font-medium">
                  {formatDate(currentMember.joined_at || currentMember.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Data Section */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <ScrollText className="h-5 w-5" />
          Datos y Privacidad
        </h2>
        <ARCORightsPanel />
      </div>
    </div>
  )
}
