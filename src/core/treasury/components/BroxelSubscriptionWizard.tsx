import { useState, useEffect } from 'react'
import { useCommunityContext } from '@/app/providers'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  useBroxelApplication,
  useUpsertBroxelDraft,
  useSubmitBroxelApplication,
  useCommunityIfpeStatus,
} from '../hooks/useBroxelSubscription'
import { uploadBroxelDocument } from '../services/broxel-subscription.service'
import type { IfpeApplicationPayload } from '../services/broxel-subscription.service'
import { FileText, Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Building2, Shield } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'

const STEPS = [
  { id: 'info', title: 'Qué es BROXEL' },
  { id: 'form', title: 'Datos legales' },
  { id: 'docs', title: 'Documentación' },
  { id: 'send', title: 'Enviar solicitud' },
]

export function BroxelSubscriptionWizard({ onClose }: { onClose?: () => void }) {
  const { communityId } = useCommunityContext()
  const { data: status } = useCommunityIfpeStatus()
  const { data: application, isLoading: appLoading } = useBroxelApplication()
  const upsertDraft = useUpsertBroxelDraft()
  const submitApp = useSubmitBroxelApplication()
  const { success: toastSuccess, error: toastError } = useToast()

  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState({
    legal_name: '',
    rfc: '',
    representative_name: '',
    representative_role: 'Representante legal',
    fiscal_address: '',
    contact_email: '',
    contact_phone: '',
  })
  const [docPaths, setDocPaths] = useState<{ id?: string; address?: string; legal_rep?: string }>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const isActive = status?.ifpe_status === 'active'
  const isPending = status?.ifpe_status === 'pending_kyb' || application?.status === 'submitted' || application?.status === 'pending_kyb'
  const isRejected = application?.status === 'rejected'

  useEffect(() => {
    if (application) {
      setForm({
        legal_name: application.legal_name ?? '',
        rfc: application.rfc ?? '',
        representative_name: application.representative_name ?? '',
        representative_role: application.representative_role ?? 'Representante legal',
        fiscal_address: application.fiscal_address ?? '',
        contact_email: application.contact_email ?? '',
        contact_phone: application.contact_phone ?? '',
      })
      setDocPaths({
        id: application.id_document_path ?? undefined,
        address: application.address_document_path ?? undefined,
        legal_rep: application.legal_rep_document_path ?? undefined,
      })
    }
  }, [application])

  const saveDraft = async (payload?: Partial<IfpeApplicationPayload>) => {
    try {
      await upsertDraft.mutateAsync({
        ...form,
        ...payload,
        id_document_path: docPaths.id,
        address_document_path: docPaths.address,
        legal_rep_document_path: docPaths.legal_rep,
      })
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  const handleFileUpload = async (type: 'id' | 'address' | 'legal_rep', file: File) => {
    if (!communityId) return
    setUploading(type)
    try {
      const url = await uploadBroxelDocument(communityId, file, type)
      setDocPaths((prev) => ({ ...prev, [type]: url }))
      await saveDraft({
        id_document_path: type === 'id' ? url : docPaths.id,
        address_document_path: type === 'address' ? url : docPaths.address,
        legal_rep_document_path: type === 'legal_rep' ? url : docPaths.legal_rep,
      })
      toastSuccess('Documento subido')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async () => {
    try {
      await saveDraft({
        id_document_path: docPaths.id,
        address_document_path: docPaths.address,
        legal_rep_document_path: docPaths.legal_rep,
      })
      await submitApp.mutateAsync()
      toastSuccess('Solicitud enviada. Revisaremos tu documentación y te notificaremos.')
      onClose?.()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Error al enviar')
    }
  }

  if (appLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (isActive) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            Acceso BROXEL activo
          </CardTitle>
          <CardDescription>
            Tu comunidad ya tiene pagos electrónicos. Configura el modo de tesorería en Reglas si aún no lo has hecho.
          </CardDescription>
        </CardHeader>
        {onClose && (
          <CardContent>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </CardContent>
        )}
      </Card>
    )
  }

  if (isPending) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Loader2 className="h-5 w-5 animate-spin" />
            Solicitud en revisión
          </CardTitle>
          <CardDescription>
            Hemos recibido tu solicitud y documentación. El proceso de verificación puede tardar 24–72 horas. Te notificaremos cuando tu cuenta BROXEL esté lista.
          </CardDescription>
        </CardHeader>
        {onClose && (
          <CardContent>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </CardContent>
        )}
      </Card>
    )
  }

  const stepId = STEPS[stepIndex].id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Solicitar acceso a BROXEL
            </CardTitle>
            <CardDescription>
              Paso {stepIndex + 1} de {STEPS.length}: {STEPS[stepIndex].title}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIndex(i)}
              className={`
                h-2 flex-1 rounded-full transition-colors
                ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}
              `}
              aria-label={`Ir a ${s.title}`}
            />
          ))}
        </div>

        {/* Step: Info */}
        {stepId === 'info' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              BROXEL es nuestro socio IFPE (Institución de Fondos de Pago Electrónico). Con acceso BROXEL tu comunidad puede:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Recibir pagos SPEI en una CLABE a nombre de la comunidad</li>
              <li>Conciliar automáticamente cuotas con los depósitos</li>
              <li>Dispersar pagos a proveedores desde la app (con gobernanza)</li>
              <li>Generar rendimientos sobre el fondo de reserva</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Para activar el acceso debes suscribirte y subir la documentación requerida. La revisión suele tardar 24–72 horas.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setStepIndex(1)} className="gap-2">
                Comenzar solicitud <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Form */}
        {stepId === 'form' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razón social / Nombre legal</Label>
                <Input
                  id="legal_name"
                  value={form.legal_name}
                  onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
                  placeholder="Ej. Edificio Norte A.C."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={form.rfc}
                  onChange={(e) => setForm((f) => ({ ...f, rfc: e.target.value.toUpperCase() }))}
                  placeholder="EXX010101XXX"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="representative_name">Representante legal</Label>
                <Input
                  id="representative_name"
                  value={form.representative_name}
                  onChange={(e) => setForm((f) => ({ ...f, representative_name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representative_role">Cargo</Label>
                <Input
                  id="representative_role"
                  value={form.representative_role}
                  onChange={(e) => setForm((f) => ({ ...f, representative_role: e.target.value }))}
                  placeholder="Representante legal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal_address">Domicilio fiscal</Label>
              <Input
                id="fiscal_address"
                value={form.fiscal_address}
                onChange={(e) => setForm((f) => ({ ...f, fiscal_address: e.target.value }))}
                placeholder="Calle, número, colonia, CP, ciudad"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Correo de contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  placeholder="contacto@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Teléfono (opcional)</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStepIndex(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button
                onClick={async () => {
                  await saveDraft(form)
                  setStepIndex(2)
                }}
                className="gap-2"
              >
                Siguiente: Documentación <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Docs */}
        {stepId === 'docs' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sube los documentos solicitados (PDF o imagen). Ayudan a verificar la identidad y el domicilio.
            </p>
            {[
              { key: 'id' as const, label: 'Identificación del representante (INE/pasaporte)', path: docPaths.id },
              { key: 'address' as const, label: 'Comprobante de domicilio', path: docPaths.address },
              { key: 'legal_rep' as const, label: 'Documento que acredite representación legal (opcional)', path: docPaths.legal_rep },
            ].map(({ key, label, path }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    id={`file-${key}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload(key, f)
                    }}
                  />
                  <Label htmlFor={`file-${key}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm hover:bg-muted/50">
                    <Upload className="h-4 w-4" />
                    {uploading === key ? 'Subiendo…' : path ? 'Reemplazar archivo' : 'Seleccionar archivo'}
                  </Label>
                  {path && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" /> Subido
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStepIndex(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button onClick={() => setStepIndex(3)} className="gap-2">
                Siguiente: Enviar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Send */}
        {stepId === 'send' && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Resumen</p>
              <p><strong>Razón social:</strong> {form.legal_name || '—'}</p>
              <p><strong>RFC:</strong> {form.rfc || '—'}</p>
              <p><strong>Representante:</strong> {form.representative_name || '—'}</p>
              <p><strong>Documentos:</strong> {docPaths.id ? 'Identificación ✓' : '—'} {docPaths.address ? 'Domicilio ✓' : ''}</p>
            </div>
            {isRejected && application?.rejection_reason && (
              <p className="text-sm text-destructive">Motivo de rechazo anterior: {application.rejection_reason}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Al enviar, tu solicitud y documentación serán revisadas. Recibirás una notificación cuando el acceso esté aprobado.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStepIndex(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitApp.isPending || !form.legal_name?.trim() || !form.rfc?.trim() || !form.representative_name?.trim() || !form.fiscal_address?.trim() || !form.contact_email?.trim()}
                className="gap-2"
              >
                {submitApp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Enviar solicitud
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
