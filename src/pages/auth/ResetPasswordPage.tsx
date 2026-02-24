import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { useI18n } from '@/shared/hooks/useI18n'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_TESTS = [
  (p: string) => p.length >= 8,
  (p: string) => /[A-Z]/.test(p),
  (p: string) => /[a-z]/.test(p),
  (p: string) => /\d/.test(p),
]

function getPasswordStrength(requirements: PasswordRequirement[], password: string): { level: number; label: string; color: string } {
  const passed = requirements.filter((r) => r.test(password)).length
  // label will be replaced with translated string in the component
  if (passed <= 1) return { level: 1, label: 'weak', color: 'bg-red-500' }
  if (passed === 2) return { level: 2, label: 'fair', color: 'bg-orange-500' }
  if (passed === 3) return { level: 3, label: 'good', color: 'bg-yellow-500' }
  return { level: 4, label: 'strong', color: 'bg-green-500' }
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const PASSWORD_REQUIREMENTS: PasswordRequirement[] = useMemo(() => [
    { label: t('auth.resetPassword.req.minChars' as any), test: PASSWORD_TESTS[0] },
    { label: t('auth.resetPassword.req.uppercase' as any), test: PASSWORD_TESTS[1] },
    { label: t('auth.resetPassword.req.lowercase' as any), test: PASSWORD_TESTS[2] },
    { label: t('auth.resetPassword.req.number' as any), test: PASSWORD_TESTS[3] },
  ], [t])

  const strengthLabels: Record<string, string> = useMemo(() => ({
    weak: t('auth.resetPassword.strength.weak' as any),
    fair: t('auth.resetPassword.strength.fair' as any),
    good: t('auth.resetPassword.strength.good' as any),
    strong: t('auth.resetPassword.strength.strong' as any),
  }), [t])

  // Only allow password reset through a valid PASSWORD_RECOVERY flow
  // or if the URL contains recovery tokens (hash fragment from email link)
  useEffect(() => {
    let receivedRecoveryEvent = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'PASSWORD_RECOVERY') {
        receivedRecoveryEvent = true
        setIsValidSession(true)
        setCheckingSession(false)
      }
    })

    // Check for recovery tokens in the URL hash (from Supabase email link)
    const hash = window.location.hash
    const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('type=magiclink')

    // Give the auth state change a moment to fire before falling back
    setTimeout(() => {
      if (!receivedRecoveryEvent) {
        if (hasRecoveryToken) {
          setIsValidSession(true)
        }
        setCheckingSession(false)
      }
    }, 2000)

    return () => subscription.unsubscribe()
  }, [])

  const strength = getPasswordStrength(PASSWORD_REQUIREMENTS, password)
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!allRequirementsMet) {
      setError(t('auth.resetPassword.requirementsNotMet' as any))
      return
    }

    if (!passwordsMatch) {
      setError(t('auth.resetPassword.passwordsNoMatch' as any))
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => navigate('/communities'), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.resetPassword.updateError' as any))
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (checkingSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.resetPassword.verifyingLink' as any)}</CardTitle>
          <CardDescription>{t('auth.resetPassword.validatingRequest' as any)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Invalid or expired session
  if (!isValidSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.resetPassword.invalidLink' as any)}</CardTitle>
          <CardDescription>
            {t('auth.resetPassword.invalidLinkDesc' as any)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('auth.resetPassword.linksExpire' as any)}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link to="/forgot-password" className="w-full">
            <Button className="w-full">{t('auth.resetPassword.requestNewLink' as any)}</Button>
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline">
            {t('auth.resetPassword.backToLogin' as any)}
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (success) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle>{t('auth.resetPassword.successTitle' as any)}</CardTitle>
              <CardDescription>
                {t('auth.resetPassword.successDesc' as any)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.resetPassword.title' as any)}</CardTitle>
        <CardDescription>{t('auth.resetPassword.subtitle' as any)}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.resetPassword.newPassword' as any)}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('auth.resetPassword.enterNewPassword' as any)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('auth.resetPassword.strengthLabel' as any)}</span>
                  <span className="font-medium">{strengthLabels[strength.label]}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= strength.level ? strength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Requirements Checklist */}
              <ul className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(password)
                  return (
                    <li key={req.label} className="flex items-center gap-2 text-xs">
                      {met ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={met ? 'text-green-700' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword' as any)}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('auth.resetPassword.repeatPassword' as any)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                {passwordsMatch ? t('auth.resetPassword.passwordsMatch' as any) : t('auth.resetPassword.passwordsNoMatch' as any)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !allRequirementsMet || !passwordsMatch}
          >
            {loading ? t('auth.resetPassword.updating' as any) : t('auth.resetPassword.updatePassword' as any)}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline">
            {t('auth.resetPassword.backToLogin' as any)}
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
