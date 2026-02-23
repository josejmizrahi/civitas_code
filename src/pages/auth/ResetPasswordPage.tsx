import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/app/providers'
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

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Al menos una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número', test: (p) => /\d/.test(p) },
]

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  if (passed <= 1) return { level: 1, label: 'Débil', color: 'bg-red-500' }
  if (passed === 2) return { level: 2, label: 'Regular', color: 'bg-orange-500' }
  if (passed === 3) return { level: 3, label: 'Buena', color: 'bg-yellow-500' }
  return { level: 4, label: 'Fuerte', color: 'bg-green-500' }
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
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

  const strength = getPasswordStrength(password)
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!allRequirementsMet) {
      setError('La contraseña no cumple con todos los requisitos')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => navigate('/communities'), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (checkingSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificando enlace...</CardTitle>
          <CardDescription>Estamos validando tu solicitud de restablecimiento.</CardDescription>
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
          <CardTitle>Enlace inválido o expirado</CardTitle>
          <CardDescription>
            El enlace de restablecimiento de contraseña no es válido o ha expirado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Los enlaces de restablecimiento expiran después de un tiempo por seguridad.
            Solicita uno nuevo para continuar.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link to="/forgot-password" className="w-full">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline">
            Volver al inicio de sesión
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
              <CardTitle>Contraseña actualizada</CardTitle>
              <CardDescription>
                Tu contraseña ha sido actualizada exitosamente. Redirigiendo al panel...
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
        <CardTitle>Nueva Contraseña</CardTitle>
        <CardDescription>Crea una contraseña segura para tu cuenta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu nueva contraseña"
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
                  <span className="text-muted-foreground">Fortaleza:</span>
                  <span className="font-medium">{strength.label}</span>
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
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
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
                {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
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
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline">
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
