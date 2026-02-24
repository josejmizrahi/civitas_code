import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useI18n } from '@/shared/hooks/useI18n'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Try the Edge Function first for branded email
      const { error: fnError } = await supabase.functions.invoke('reset-password', {
        body: { email: email.trim().toLowerCase() },
      })

      if (fnError) {
        // Fallback to Supabase native reset if Edge Function is unavailable
        await resetPassword(email)
      }

      setSent(true)
    } catch {
      // Even on error, show success to prevent email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{t('auth.forgotPassword.checkEmail')}</CardTitle>
              <CardDescription>
                {t('auth.forgotPassword.ifAccountExists')} <strong>{email}</strong>{t('auth.forgotPassword.willReceiveLink')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-2">
            <p>{t('auth.forgotPassword.checkInbox')}</p>
            <p>{t('auth.forgotPassword.linkExpiry')}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
          >
            {t('auth.forgotPassword.sendAgain')}
          </Button>
          <Link to="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.forgotPassword.backToLogin')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.forgotPassword.title')}</CardTitle>
        <CardDescription>
          {t('auth.forgotPassword.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            <Mail className="mr-2 h-4 w-4" />
            {loading ? t('common.sending') : t('auth.forgotPassword.sendResetLink')}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
