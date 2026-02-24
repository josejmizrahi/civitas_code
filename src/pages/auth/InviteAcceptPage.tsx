import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth, useCommunityContext } from '@/app/providers'
import { useI18n } from '@/shared/hooks/useI18n'
import { getInvitationByToken, acceptInvitation, getCommunity } from '@/core/identity/services/identity.service'
import type { Invitation } from '@/core/identity/types'
import { Button } from '@/shared/components/ui/button'
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const { refreshCommunities, setCommunityId } = useCommunityContext()
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [communityName, setCommunityName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  // Fetch invitation details and community name
  useEffect(() => {
    if (!token) return
    getInvitationByToken(token)
      .then((inv) => {
        setInvitation(inv)
        if (inv?.community_id) {
          getCommunity(inv.community_id)
            .then((c) => setCommunityName(c.name))
            .catch(() => setCommunityName(null))
        }
        setLoading(false)
      })
      .catch(() => {
        setError(t('auth.invite.verifyError' as any))
        setLoading(false)
      })
  }, [token])

  const handleAccept = async () => {
    if (!token || !user || !invitation) return
    setAccepting(true)
    setError(null)
    try {
      await acceptInvitation(token, user.id)
      // Refresh communities and select the new community
      refreshCommunities()
      setCommunityId(invitation.community_id)
      setAccepted(true)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => navigate('/communities'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.invite.acceptError' as any))
    } finally {
      setAccepting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">{t('auth.invite.verifying' as any)}</p>
        </div>
      </div>
    )
  }

  // Invalid or expired invitation
  if (!invitation || invitation.status !== 'pending') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">{t('auth.invite.invalidTitle' as any)}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('auth.invite.invalidDesc' as any)}
          </p>
          <Link to="/login">
            <Button className="mt-6">{t('auth.invite.goHome' as any)}</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to register with token preserved
  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">{t('auth.invite.youAreInvited' as any)}</h1>
          <p className="mt-2 text-muted-foreground">
            {communityName ? (
              <>{t('auth.invite.invitedTo' as any)} <strong>{communityName}</strong> {t('auth.invite.withRole' as any)} <strong>{invitation.role}</strong>.</>
            ) : (
              <>{t('auth.invite.invitedWithRole' as any)} <strong>{invitation.role}</strong>.</>
            )}
            {' '}{t('auth.invite.createOrLogin' as any)}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to={`/register?invite=${token}`}>
              <Button>{t('auth.invite.createAccount' as any)}</Button>
            </Link>
            <Link to={`/login?invite=${token}`}>
              <Button variant="outline">{t('auth.invite.signIn' as any)}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Accepted successfully
  if (accepted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-semibold">{t('auth.invite.welcome' as any)}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('auth.invite.acceptedRedirecting' as any)}
          </p>
        </div>
      </div>
    )
  }

  // Logged in - show accept button
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <Building2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">{t('auth.invite.pendingTitle' as any)}</h1>
        <p className="mt-2 text-muted-foreground">
          {communityName ? (
            <>{t('auth.invite.invitedTo' as any)} <strong>{communityName}</strong> {t('auth.invite.asRole' as any)} <strong>{invitation.role}</strong>.</>
          ) : (
            <>{t('auth.invite.invitedAsRole' as any)} <strong>{invitation.role}</strong>.</>
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('auth.invite.invitedEmail' as any)} <strong>{invitation.email}</strong>
        </p>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        <Button
          className="mt-6 w-full"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.invite.accepting' as any)}
            </>
          ) : (
            t('auth.invite.acceptInvitation' as any)
          )}
        </Button>
      </div>
    </div>
  )
}
