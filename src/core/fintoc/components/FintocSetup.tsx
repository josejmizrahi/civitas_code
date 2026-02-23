import { useState } from 'react'
import { useFintocStatus, useActivateFintoc, useDeactivateFintoc } from '../hooks/useFintoc'
import { FintocKybWizard } from './FintocKybWizard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { useToast } from '@/shared/components/ui/toast'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { CheckCircle2, XCircle, Settings2, Banknote, Shield, Globe, Copy, ExternalLink } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'destructive' | 'secondary'; icon: typeof CheckCircle2 }> = {
  active: { label: 'Activo', color: 'default', icon: CheckCircle2 },
  inactive: { label: 'Inactivo', color: 'secondary', icon: XCircle },
  pending: { label: 'Pendiente', color: 'secondary', icon: Settings2 },
  suspended: { label: 'Suspendido', color: 'destructive', icon: XCircle },
}

export function FintocSetup() {
  const { data: status, isLoading } = useFintocStatus()
  const activate = useActivateFintoc()
  const deactivate = useDeactivateFintoc()
  const toast = useToast()

  const [showSetup, setShowSetup] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [rootClabe, setRootClabe] = useState('')
  const [publicKey, setPublicKey] = useState('')

  if (isLoading) return <LoadingSpinner className="py-8" />

  const fintocStatus = status?.fintoc_status || 'inactive'
  const config = STATUS_CONFIG[fintocStatus] || STATUS_CONFIG.inactive
  const StatusIcon = config.icon

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await activate.mutateAsync({
        account_id: accountId.trim(),
        root_clabe: rootClabe.trim(),
        public_key: publicKey.trim(),
      })
      toast.success('Fintoc activado correctamente')
      setShowSetup(false)
    } catch {
      toast.error('Error al activar Fintoc')
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('¿Desactivar Fintoc? Los pagos automáticos dejarán de funcionar.')) return
    try {
      await deactivate.mutateAsync()
      toast.success('Fintoc desactivado')
    } catch {
      toast.error('Error al desactivar')
    }
  }

  const copyClabe = () => {
    if (status?.fintoc_root_clabe) {
      navigator.clipboard.writeText(status.fintoc_root_clabe)
      toast.success('CLABE copiada')
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-green-600" />
            Fintoc — Pagos SPEI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-5 w-5 ${fintocStatus === 'active' ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Estado de integración</p>
                <Badge variant={config.color}>{config.label}</Badge>
              </div>
            </div>
            {fintocStatus === 'active' ? (
              <Button variant="outline" size="sm" onClick={handleDeactivate}>Desactivar</Button>
            ) : (
              <Button onClick={() => setShowSetup(true)} className="gap-1.5">
                <Settings2 className="h-4 w-4" /> Configurar Fintoc
              </Button>
            )}
          </div>

          {fintocStatus === 'active' && status?.fintoc_root_clabe && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">CLABE principal</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-semibold">{status.fintoc_root_clabe}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyClabe}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account ID</p>
                  <code className="text-sm font-mono">{status.fintoc_account_id}</code>
                </div>
              </div>
            </div>
          )}

          {fintocStatus !== 'active' && (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
              <Globe className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">Conecta con Fintoc</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Recibe pagos SPEI automáticamente, genera CLABEs por miembro para conciliación instantánea,
                  y realiza dispersiones a proveedores.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Regulado por Banxico</span>
                <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> SPEI en tiempo real</span>
              </div>
              <a href="https://fintoc.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                Más información <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYB Application Wizard */}
      {fintocStatus !== 'active' && (
        <FintocKybWizard />
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent onClose={() => setShowSetup(false)}>
          <DialogHeader>
            <DialogTitle>Configurar Fintoc</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActivate}>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Ingresa las credenciales de tu cuenta Fintoc. Puedes obtenerlas en{' '}
                <a href="https://app.fintoc.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  app.fintoc.com
                </a>.
              </p>
              <div className="space-y-2">
                <Label>Public Key</Label>
                <Input
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  required
                  placeholder="pk_live_..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Account ID</Label>
                <Input
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  placeholder="acc_..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>CLABE principal (root)</Label>
                <Input
                  value={rootClabe}
                  onChange={(e) => setRootClabe(e.target.value)}
                  required
                  placeholder="738969..."
                  maxLength={18}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  La CLABE de 18 dígitos asignada a tu cuenta Fintoc para recibir transferencias SPEI.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSetup(false)}>Cancelar</Button>
              <Button type="submit" disabled={activate.isPending}>
                {activate.isPending ? 'Activando...' : 'Activar Fintoc'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
