import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { acceptInvitation } from '@/core/identity/services/identity.service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { ConsentCheckbox } from '@/core/privacy/components/ConsentCheckbox'
import { PrivacyNoticeModal } from '@/core/privacy/components/PrivacyNoticeModal'

export function RegisterPage() {
  const { signUp, user } = useAuth()
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
      setTimeout(() => {
        setNeedsConfirmation(true)
        setLoading(false)
      }, 500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && inviteToken) {
      acceptInvitation(inviteToken, user.id)
        .then(() => navigate('/dashboard', { replace: true }))
        .catch(() => navigate('/dashboard', { replace: true }))
    } else if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, inviteToken])

  if (needsConfirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de confirmación a <strong>{email}</strong>. Confirma tu correo para acceder.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/login" className="w-full">
            <Button className="w-full">Ir a Iniciar Sesión</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>Regístrate en Civitas</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Juan Pérez" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
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
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to={inviteToken ? `/login?invite=${inviteToken}` : '/login'} className="font-medium text-primary hover:underline">Inicia Sesión</Link>
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
