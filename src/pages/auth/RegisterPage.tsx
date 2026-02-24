import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useI18n } from '@/shared/hooks/useI18n'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { ConsentCheckbox } from '@/core/privacy/components/ConsentCheckbox'
import { PrivacyNoticeModal } from '@/core/privacy/components/PrivacyNoticeModal'

export function RegisterPage() {
  const { signUp, user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, fullName)
      setNeedsConfirmation(true)
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.register.error'))
      setLoading(false)
    }
  }

  // Post-register: redirect to invite accept page or dashboard
  useEffect(() => {
    if (user && inviteToken) {
      navigate(`/invite/${inviteToken}`, { replace: true })
    } else if (user) {
      navigate('/communities', { replace: true })
    }
  }, [user, inviteToken, navigate])

  if (needsConfirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.register.checkEmail')}</CardTitle>
          <CardDescription>
            {t('auth.register.confirmationSent')} <strong>{email}</strong>. {t('auth.register.confirmToAccess')}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to={inviteToken ? `/login?invite=${inviteToken}` : '/login'} className="w-full">
            <Button className="w-full">{t('auth.register.goToLogin')}</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.register.title')}</CardTitle>
        <CardDescription>{t('auth.register.subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('auth.register.fullName')}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Juan Pérez" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder={t('auth.register.minChars')} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="w-full">
            <ConsentCheckbox
              checked={privacyAccepted}
              onChange={setPrivacyAccepted}
              onViewNotice={() => setShowPrivacy(true)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !privacyAccepted}>
            {loading ? t('auth.register.registering') : t('auth.register.title')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link to={inviteToken ? `/login?invite=${inviteToken}` : '/login'} className="font-medium text-primary hover:underline">{t('auth.register.signIn')}</Link>
          </p>
        </CardFooter>
      </form>
      <PrivacyNoticeModal
        open={showPrivacy}
        onAccept={() => {
          setPrivacyAccepted(true)
          setShowPrivacy(false)
        }}
        onClose={() => setShowPrivacy(false)}
      />
    </Card>
  )
}
