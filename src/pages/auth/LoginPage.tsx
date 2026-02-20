import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { acceptInvitation } from '@/core/identity/services/identity.service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteToken = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (user && inviteToken) {
      acceptInvitation(inviteToken, user.id)
        .then(() => navigate('/dashboard'))
        .catch((err) => {
          setInviteError(err instanceof Error ? err.message : 'No se pudo aceptar la invitación')
          navigate('/dashboard')
        })
    }
  }, [user, inviteToken, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa a tu cuenta de RYVE</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {inviteToken && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              Inicia sesión para aceptar tu invitación
            </div>
          )}
          {inviteError && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              No se pudo aceptar la invitación: {inviteError}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to={inviteToken ? `/register?invite=${inviteToken}` : '/register'} className="font-medium text-primary hover:underline">Regístrate</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
