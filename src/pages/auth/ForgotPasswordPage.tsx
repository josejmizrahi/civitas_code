import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
    } catch (err: unknown) {
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
              <CardTitle>Revisa tu correo</CardTitle>
              <CardDescription>
                Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-2">
            <p>Revisa tu bandeja de entrada y la carpeta de spam.</p>
            <p>El enlace expirará en 1 hora por seguridad.</p>
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
            Enviar de nuevo
          </Button>
          <Link to="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
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
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
