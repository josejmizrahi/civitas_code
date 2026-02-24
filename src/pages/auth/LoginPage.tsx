import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useI18n } from '@/shared/hooks/useI18n'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteToken = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Post-login: redirect to invite accept page so user can click "Aceptar invitación"
  useEffect(() => {
    if (user && inviteToken) {
      navigate(`/invite/${inviteToken}`, { replace: true })
    }
  }, [user, inviteToken, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {inviteToken && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              {t('auth.login.inviteMessage')}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.login.signingIn') : t('auth.login.title')}
          </Button>
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:underline">
            {t('auth.login.forgotPassword')}
          </Link>
          <p className="text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link to={inviteToken ? `/register?invite=${inviteToken}` : '/register'} className="font-medium text-primary hover:underline">{t('auth.login.signUp')}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
