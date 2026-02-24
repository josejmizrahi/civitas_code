import { useState, useEffect } from 'react'
import { useFintechStatus, useActivateProvider, useDeactivateProvider } from '../hooks/useFintech'
import { useKybApplication } from '../hooks/useKyb'
import { KybWizard } from './KybWizard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { useToast } from '@/shared/components/ui/toast'
import { cn } from '@/shared/lib/utils'
import {
  CheckCircle2, XCircle, Banknote, Shield, Copy,
  ArrowRight, KeyRound, FileText, Clock, Zap, ArrowLeft,
  BadgeCheck, AlertTriangle, RefreshCw,
} from 'lucide-react'

type OnboardingPhase = 'loading' | 'welcome' | 'credentials' | 'kyb' | 'pending' | 'active' | 'suspended'

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

function OnboardingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-xl overflow-hidden">
        <div className="h-1.5 bg-muted animate-pulse" />
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
          <div className="mx-auto max-w-sm space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const FEATURES = [
  { icon: Zap, title: 'Pagos SPEI en tiempo real', desc: 'Recibe transferencias SPEI y concilia automáticamente con cuotas.' },
  { icon: Shield, title: 'CLABEs individuales', desc: 'Genera CLABEs únicas por miembro para conciliación instantánea.' },
  { icon: Banknote, title: 'Dispersiones con gobernanza', desc: 'Paga a proveedores con aprobación del comité de vigilancia.' },
]

export function FintechOnboarding() {
  const { data: status, isLoading: statusLoading } = useFintechStatus()
  const { data: kybApp, isLoading: kybLoading } = useKybApplication()
  const activate = useActivateProvider()
  const deactivate = useDeactivateProvider()
  const toast = useToast()

  const [phase, setPhase] = useState<OnboardingPhase>('loading')
  const [showCredentials, setShowCredentials] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [rootClabe, setRootClabe] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [fadeIn, setFadeIn] = useState(false)

  const isLoading = statusLoading || kybLoading

  useEffect(() => {
    if (isLoading) { setPhase('loading'); return }

    const fintechStatus = status?.fintech_status || 'inactive'

    if (fintechStatus === 'active') setPhase('active')
    else if (fintechStatus === 'suspended') setPhase('suspended')
    else if (fintechStatus === 'pending' || (kybApp && ['submitted', 'under_review'].includes(kybApp.status))) setPhase('pending')
    else if (kybApp && ['draft', 'documents_pending', 'requires_info'].includes(kybApp.status)) setPhase('kyb')
    else setPhase('welcome')
  }, [isLoading, status, kybApp])

  useEffect(() => {
    if (phase !== 'loading') {
      setFadeIn(false)
      const t = requestAnimationFrame(() => setFadeIn(true))
      return () => cancelAnimationFrame(t)
    }
  }, [phase])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await activate.mutateAsync({
        account_id: accountId.trim(),
        root_clabe: rootClabe.trim(),
        public_key: publicKey.trim(),
      })
      toast.success('Integración financiera activada')
      setShowCredentials(false)
    } catch {
      toast.error('Error al activar la integración')
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('¿Desactivar la integración financiera? Los pagos automáticos dejarán de funcionar.')) return
    try {
      await deactivate.mutateAsync()
      toast.success('Integración desactivada')
    } catch {
      toast.error('Error al desactivar')
    }
  }

  const copyClabe = () => {
    if (status?.fintech_root_clabe) {
      navigator.clipboard.writeText(status.fintech_root_clabe)
      toast.success('CLABE copiada al portapapeles')
    }
  }

  if (phase === 'loading') return <OnboardingSkeleton />

  return (
    <div className={cn('space-y-6 transition-opacity duration-300', fadeIn ? 'opacity-100' : 'opacity-0')}>

      {/* ─── PHASE: WELCOME ──────────────────────────────────── */}
      {phase === 'welcome' && (
        <>
          <Card className="rounded-xl overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="rounded-full bg-muted p-4">
                  <Banknote className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">Activa pagos electrónicos</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Conecta tu proveedor financiero para recibir pagos SPEI, conciliar cuotas
                    automáticamente y dispersar pagos a proveedores con gobernanza.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => setPhase('kyb')}
                  >
                    <FileText className="h-4 w-4" />
                    Solicitar activación
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => setShowCredentials(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                    Ya tengo credenciales
                  </Button>
                </div>
              </div>

              <div className="mt-10 mx-auto max-w-lg">
                <div className="grid gap-4">
                  {FEATURES.map((f) => (
                    <div key={f.title} className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
                      <div className="rounded-lg bg-muted p-2 shrink-0">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── PHASE: KYB ──────────────────────────────────────── */}
      {phase === 'kyb' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => !kybApp ? setPhase('welcome') : undefined}
              disabled={!!kybApp}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => setShowCredentials(true)}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Ingresar credenciales
            </Button>
          </div>
          <KybWizard onBack={() => setPhase('welcome')} />
        </div>
      )}

      {/* ─── PHASE: PENDING ──────────────────────────────────── */}
      {phase === 'pending' && (
        <Card className="rounded-xl overflow-hidden">
          <div className="h-1.5 bg-muted-foreground animate-pulse" />
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="rounded-full bg-muted p-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                  <div className="h-4 w-4 rounded-full bg-muted-foreground animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Solicitud en revisión</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Tu solicitud fue enviada
                  {kybApp?.submitted_at ? ` el ${new Date(kybApp.submitted_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.
                  El equipo de compliance está revisando tu documentación.
                </p>
              </div>

              <div className="w-full max-w-sm space-y-4 pt-4">
                <PendingTimeline status={kybApp?.status || 'submitted'} />
              </div>

              {kybApp?.fintoc_notes && (
                <div className="rounded-lg bg-muted border p-4 text-sm text-left w-full max-w-md">
                  <p className="font-medium text-foreground mb-1">Notas del equipo:</p>
                  <p className="text-muted-foreground">{kybApp.fintoc_notes}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-2">
                Te notificaremos por correo cuando tu solicitud sea aprobada.
                El proceso suele tomar de 3 a 5 días hábiles.
              </p>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={() => setShowCredentials(true)}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Ya recibí mis credenciales
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PHASE: ACTIVE ───────────────────────────────────── */}
      {phase === 'active' && (
        <Card className="rounded-xl overflow-hidden">
          <div className="h-1.5 bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Integración financiera activa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pagos SPEI habilitados</p>
                  <p className="text-xs text-muted-foreground">Recibiendo transferencias en tiempo real</p>
                </div>
              </div>
              <Badge variant="secondary">Activo</Badge>
            </div>

            {status?.fintech_root_clabe && (
              <div className="rounded-lg border bg-muted p-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CLABE principal</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold tracking-wider">{status.fintech_root_clabe}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyClabe}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Account ID</p>
                    <code className="text-sm font-mono text-muted-foreground">{status.fintech_account_id}</code>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Regulado Banxico</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Conciliación automática</span>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeactivate}>
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Desactivar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PHASE: SUSPENDED ────────────────────────────────── */}
      {phase === 'suspended' && (
        <Card className="rounded-xl overflow-hidden border-destructive">
          <div className="h-1.5 bg-destructive" />
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Integración suspendida</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  La integración financiera ha sido suspendida. Contacta a soporte para resolver
                  esta situación y reactivar los pagos electrónicos.
                </p>
              </div>
              <Button variant="outline" className="gap-1.5" onClick={() => setShowCredentials(true)}>
                <RefreshCw className="h-4 w-4" /> Reingresar credenciales
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── CREDENTIALS DIALOG ──────────────────────────────── */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent onClose={() => setShowCredentials(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Configurar credenciales
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActivate}>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Ingresa las credenciales proporcionadas por tu proveedor financiero.
              </p>

              <div className="space-y-2">
                <Label htmlFor="cred-pk">Public Key</Label>
                <Input
                  id="cred-pk"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  required
                  placeholder="pk_live_..."
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred-aid">Account ID</Label>
                <Input
                  id="cred-aid"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  placeholder="acc_..."
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred-clabe">CLABE principal (root)</Label>
                <Input
                  id="cred-clabe"
                  value={rootClabe}
                  onChange={(e) => setRootClabe(e.target.value)}
                  required
                  placeholder="646180..."
                  maxLength={18}
                  className="font-mono text-sm"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  CLABE de 18 dígitos asignada para recibir transferencias SPEI.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCredentials(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={activate.isPending} className="gap-1.5">
                {activate.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Activar integración
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PendingTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'submitted', label: 'Solicitud enviada', desc: 'Documentación recibida' },
    { id: 'under_review', label: 'En revisión', desc: 'Equipo de compliance revisando' },
    { id: 'approved', label: 'Aprobada', desc: 'Credenciales generadas' },
  ]

  const currentIdx = steps.findIndex((s) => s.id === status)
  const progressPct = currentIdx >= 0 ? ((currentIdx + 1) / steps.length) * 100 : 33

  return (
    <div className="space-y-3">
      <Progress value={progressPct} className="h-1.5" />
      <div className="space-y-3">
        {steps.map((s, i) => {
          const isComplete = i < (currentIdx >= 0 ? currentIdx + 1 : 1)
          const isCurrent = s.id === status
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0 transition-colors',
                isComplete ? 'bg-primary text-primary-foreground' : isCurrent ? 'bg-muted text-foreground ring-2 ring-ring' : 'bg-muted text-muted-foreground',
              )}>
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div>
                <p className={cn('text-sm', (isComplete || isCurrent) ? 'font-medium' : 'text-muted-foreground')}>{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
