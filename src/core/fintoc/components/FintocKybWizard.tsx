import { useState, useCallback } from 'react'
import {
  useFintocApplication,
  useCreateApplication,
  useUpdateApplication,
  useSubmitApplication,
  useUploadKybDoc,
} from '../hooks/useKyb'
import type {
  FintocApplication,
  KybShareholder,
  KybDashboardUser,
  KybEscalationContact,
  KybFundOrigin,
  KybDocuments,
} from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useToast } from '@/shared/components/ui/toast'
import {
  Building2, User, Users, FileText, Landmark, Mail, Shield,
  ChevronLeft, ChevronRight, Check, Upload, Plus, Trash2, AlertCircle,
} from 'lucide-react'

const STEPS = [
  { id: 'company', label: 'Datos de Empresa', icon: Building2 },
  { id: 'representative', label: 'Representante Legal', icon: User },
  { id: 'shareholders', label: 'Accionistas', icon: Users },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'bank', label: 'Cuenta Bancaria', icon: Landmark },
  { id: 'annex-a', label: 'Anexo A — Contacto', icon: Mail },
  { id: 'annex-b', label: 'Anexo B — Usuarios', icon: Shield },
  { id: 'annex-d', label: 'Anexo D — Perfil', icon: Shield },
  { id: 'review', label: 'Revisión y Envío', icon: Check },
]

const REQUIRED_DOCS: { key: keyof KybDocuments; label: string; multi?: boolean }[] = [
  { key: 'acta_constitutiva', label: 'Acta constitutiva con datos de inscripción en Registro Público' },
  { key: 'constancia_fiscal', label: 'Constancia de Situación Fiscal (no mayor a 3 meses)' },
  { key: 'comprobante_domicilio', label: 'Comprobante de domicilio vigente (no mayor a 3 meses)' },
  { key: 'poder_representante', label: 'Instrumento notarial con poder del representante legal' },
  { key: 'id_representante', label: 'Identificación del Representante Legal (INE o pasaporte)' },
  { key: 'estructura_accionaria', label: 'Documento de estructura accionaria vigente' },
  { key: 'estado_cuenta_banco', label: 'Estado de cuenta bancario (no mayor a 3 meses, a nombre de la empresa)' },
]

const FUND_ORIGINS: { value: KybFundOrigin; label: string }[] = [
  { value: 'fideicomisos', label: 'Fideicomisos' },
  { value: 'partidas_presupuestales', label: 'Partidas presupuestales' },
  { value: 'regalias', label: 'Regalías' },
  { value: 'venta_activos', label: 'Venta de activos' },
  { value: 'inversion', label: 'Inversión' },
  { value: 'utilidades', label: 'Utilidades' },
  { value: 'donaciones', label: 'Donaciones' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  documents_pending: { label: 'Documentos pendientes', variant: 'secondary' },
  submitted: { label: 'Enviada', variant: 'default' },
  under_review: { label: 'En revisión', variant: 'default' },
  approved: { label: 'Aprobada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  requires_info: { label: 'Requiere información', variant: 'destructive' },
}

export function FintocKybWizard() {
  const { data: app, isLoading } = useFintocApplication()
  const create = useCreateApplication()
  const update = useUpdateApplication()
  const submit = useSubmitApplication()
  const uploadDoc = useUploadKybDoc()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<FintocApplication>>({})
  const [initialized, setInitialized] = useState(false)

  // Initialize form from existing application
  if (app && !initialized) {
    setForm(app)
    setInitialized(true)
  }

  const set = useCallback((field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleStart = async () => {
    try {
      const newApp = await create.mutateAsync()
      setForm(newApp)
      setInitialized(true)
      setStep(0)
    } catch {
      toast.error('Error al crear solicitud')
    }
  }

  const saveStep = async () => {
    if (!app?.id && !form.id) return
    const appId = (form.id || app?.id)!
    try {
      await update.mutateAsync({ appId, updates: form })
    } catch {
      toast.error('Error al guardar')
    }
  }

  const nextStep = async () => {
    await saveStep()
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    const appId = (form.id || app?.id)!
    await saveStep()
    try {
      await submit.mutateAsync(appId)
      toast.success('Solicitud enviada a Fintoc para revisión')
    } catch {
      toast.error('Error al enviar solicitud')
    }
  }

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const path = await uploadDoc.mutateAsync({ file, docType })
      const docs = { ...(form.documents || {}), [docType]: path } as KybDocuments
      set('documents', docs)
      toast.success(`${file.name} subido`)
    } catch {
      toast.error('Error al subir archivo')
    }
  }

  if (isLoading) return <LoadingSpinner className="py-12" />

  // If already submitted, show status
  if (app && ['submitted', 'under_review', 'approved'].includes(app.status)) {
    const cfg = STATUS_CONFIG[app.status]
    return (
      <Card className="rounded-xl">
        <CardContent className="py-8 text-center space-y-3">
          <Check className="mx-auto h-10 w-10 text-green-600" />
          <h3 className="text-lg font-semibold">Solicitud KYB enviada</h3>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tu solicitud fue enviada a Fintoc el {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('es-MX') : '—'}.
            El equipo de compliance revisará la documentación y te notificará cuando sea aprobada.
          </p>
          {app.fintoc_notes && (
            <div className="rounded-lg bg-muted p-3 text-sm text-left mt-4">
              <p className="font-medium">Notas de Fintoc:</p>
              <p className="text-muted-foreground">{app.fintoc_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Rejected — allow restart
  if (app?.status === 'rejected') {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h3 className="text-lg font-semibold">Solicitud rechazada</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{app.rejection_reason || 'Contacta a soporte@fintoc.com para más detalles.'}</p>
          <Button onClick={handleStart}>Iniciar nueva solicitud</Button>
        </CardContent>
      </Card>
    )
  }

  // No application yet — show start
  if (!app && !form.id) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-8 text-center space-y-4">
          <Building2 className="mx-auto h-12 w-12 text-blue-600/60" />
          <h3 className="text-lg font-semibold">Solicitud KYB para Fintoc</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Para activar pagos SPEI necesitas completar el proceso de conocimiento del cliente (KYB).
            Recopila los documentos de tu empresa y completa los anexos requeridos por Fintoc.
          </p>
          <Button onClick={handleStart} disabled={create.isPending} className="gap-1.5">
            {create.isPending ? 'Creando...' : 'Iniciar solicitud'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Requires info — allow editing
  // Draft or documents_pending — show wizard

  const currentStep = STEPS[step]
  const isSaving = update.isPending

  return (
    <div className="space-y-4">
      {/* Progress stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isCurrent = i === step
          const isDone = i < step
          return (
            <button
              key={s.id}
              onClick={() => { saveStep(); setStep(i) }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                isCurrent ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          )
        })}
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {(() => { const I = currentStep.icon; return <I className="h-5 w-5" /> })()}
            Paso {step + 1}: {currentStep.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && <StepCompany form={form} set={set} />}
          {step === 1 && <StepRepresentative form={form} set={set} />}
          {step === 2 && <StepShareholders form={form} set={set} />}
          {step === 3 && <StepDocuments form={form} onUpload={handleFileUpload} uploading={uploadDoc.isPending} />}
          {step === 4 && <StepBank form={form} set={set} />}
          {step === 5 && <StepAnnexA form={form} set={set} />}
          {step === 6 && <StepAnnexB form={form} set={set} />}
          {step === 7 && <StepAnnexD form={form} set={set} />}
          {step === 8 && <StepReview form={form} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep} disabled={isSaving} className="gap-1">
            {isSaving ? 'Guardando...' : 'Siguiente'} <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submit.isPending} className="gap-1 bg-green-700 hover:bg-green-800">
            {submit.isPending ? 'Enviando...' : 'Enviar solicitud a Fintoc'} <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Step Components ──────────────────────────────────────────────

function StepCompany({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>Razón social</Label>
        <Input value={form.company_legal_name || ''} onChange={(e) => set('company_legal_name', e.target.value)} placeholder="Administradora de Condominios S.A. de C.V." />
      </div>
      <div className="space-y-2">
        <Label>RFC</Label>
        <Input value={form.company_rfc || ''} onChange={(e) => set('company_rfc', e.target.value.toUpperCase())} placeholder="ACO123456AB1" maxLength={13} className="font-mono uppercase" />
      </div>
      <div className="space-y-2">
        <Label>Fecha de constitución</Label>
        <Input type="date" value={form.company_incorporation_date || ''} onChange={(e) => set('company_incorporation_date', e.target.value)} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Datos de inscripción en Registro Público del Comercio</Label>
        <Input value={form.company_registro_publico || ''} onChange={(e) => set('company_registro_publico', e.target.value)} placeholder="Folio mercantil 12345, Libro X..." />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Domicilio fiscal</Label>
        <Input value={form.company_address || ''} onChange={(e) => set('company_address', e.target.value)} placeholder="Calle, número, colonia" />
      </div>
      <div className="space-y-2">
        <Label>Ciudad</Label>
        <Input value={form.company_city || ''} onChange={(e) => set('company_city', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Estado</Label>
        <Input value={form.company_state || ''} onChange={(e) => set('company_state', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Código postal</Label>
        <Input value={form.company_zip || ''} onChange={(e) => set('company_zip', e.target.value)} maxLength={5} />
      </div>
    </div>
  )
}

function StepRepresentative({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Persona que firmará el contrato con Fintoc y que cuenta con poder notarial.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nombre completo del Representante Legal</Label>
          <Input value={form.rep_legal_name || ''} onChange={(e) => set('rep_legal_name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Correo electrónico</Label>
          <Input type="email" value={form.rep_legal_email || ''} onChange={(e) => set('rep_legal_email', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={form.rep_legal_phone || ''} onChange={(e) => set('rep_legal_phone', e.target.value)} placeholder="+52..." />
        </div>
        <div className="space-y-2">
          <Label>Tipo de identificación</Label>
          <Select value={form.rep_legal_id_type || ''} onChange={(e) => set('rep_legal_id_type', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="ine">Credencial para votar (INE)</option>
            <option value="passport">Pasaporte mexicano</option>
          </Select>
        </div>
      </div>
    </div>
  )
}

function StepShareholders({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  const shareholders = (form.shareholders || []) as KybShareholder[]

  const add = () => set('shareholders', [...shareholders, { name: '', id_type: 'ine', id_number: '', ownership_pct: 0, is_foreign: false, is_moral: false }])
  const remove = (i: number) => set('shareholders', shareholders.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: unknown) => {
    const updated = [...shareholders]
    updated[i] = { ...updated[i], [field]: value }
    set('shareholders', updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Accionistas personas físicas con participación directa o indirecta ≥ 25%. Para personas morales, indicar su acta constitutiva.
      </p>
      {shareholders.map((sh, i) => (
        <Card key={i} className="rounded-lg">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accionista {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Nombre completo</Label>
                <Input value={sh.name} onChange={(e) => update(i, 'name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% Participación</Label>
                <Input type="number" min={0} max={100} value={sh.ownership_pct} onChange={(e) => update(i, 'ownership_pct', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de ID</Label>
                <Select value={sh.id_type} onChange={(e) => update(i, 'id_type', e.target.value)}>
                  <option value="ine">INE</option>
                  <option value="passport">Pasaporte</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Número de ID</Label>
                <Input value={sh.id_number} onChange={(e) => update(i, 'id_number', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sh.is_moral} onChange={(e) => update(i, 'is_moral', e.target.checked)} className="h-4 w-4 rounded" />
                Es persona moral
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sh.is_foreign} onChange={(e) => update(i, 'is_foreign', e.target.checked)} className="h-4 w-4 rounded" />
                Extranjero (requiere apostilla)
              </label>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="gap-1.5"><Plus className="h-4 w-4" /> Agregar accionista</Button>
    </div>
  )
}

function StepDocuments({ form, onUpload, uploading }: { form: Partial<FintocApplication>; onUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) {
  const docs = (form.documents || {}) as KybDocuments

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Sube los documentos requeridos por Fintoc. Formatos aceptados: PDF, JPG, PNG.</p>
      {REQUIRED_DOCS.map((doc) => {
        const uploaded = !!(docs as Record<string, unknown>)[doc.key]
        return (
          <div key={doc.key} className="flex items-center gap-3 rounded-lg border p-3">
            <div className={`rounded-full p-1.5 ${uploaded ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
              {uploaded ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{doc.label}</p>
              {uploaded && <p className="text-xs text-green-600">Documento subido</p>}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onUpload(doc.key, e)} disabled={uploading} />
              <span className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted ${uploading ? 'opacity-50' : ''}`}>
                <Upload className="h-3 w-3" /> {uploaded ? 'Reemplazar' : 'Subir'}
              </span>
            </label>
          </div>
        )
      })}
      <p className="text-xs text-muted-foreground">
        Si hay accionistas personas morales, sube también su acta constitutiva (apostillada si es extranjera) en el paso anterior.
      </p>
    </div>
  )
}

function StepBank({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cuenta bancaria a nombre de la empresa para la liquidación de pagos recibidos vía Fintoc.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Titular de la cuenta</Label>
          <Input value={form.settlement_account_holder || ''} onChange={(e) => set('settlement_account_holder', e.target.value)} placeholder="Mismo que razón social" />
        </div>
        <div className="space-y-2">
          <Label>Banco</Label>
          <Input value={form.settlement_bank_name || ''} onChange={(e) => set('settlement_bank_name', e.target.value)} placeholder="BBVA, Banorte, etc." />
        </div>
        <div className="space-y-2">
          <Label>Número de cuenta</Label>
          <Input value={form.settlement_account_number || ''} onChange={(e) => set('settlement_account_number', e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>CLABE interbancaria (18 dígitos)</Label>
          <Input value={form.settlement_clabe || ''} onChange={(e) => set('settlement_clabe', e.target.value)} maxLength={18} className="font-mono" placeholder="012180..." />
        </div>
      </div>
    </div>
  )
}

function StepAnnexA({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  const escalation = (form.annex_a_escalation || []) as KybEscalationContact[]

  const addEscalation = () => set('annex_a_escalation', [...escalation, { area: '', email: '' }])
  const removeEscalation = (i: number) => set('annex_a_escalation', escalation.filter((_, idx) => idx !== i))
  const updateEscalation = (i: number, field: string, value: string) => {
    const updated = [...escalation]
    updated[i] = { ...updated[i], [field]: value }
    set('annex_a_escalation', updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Datos de contacto para facturación, conciliación y notificaciones contractuales (Anexo A).</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Correo para facturación y conciliación</Label>
          <Input type="email" value={form.annex_a_billing_email || ''} onChange={(e) => set('annex_a_billing_email', e.target.value)} placeholder="finanzas@tuempresa.com" />
        </div>
        <div className="space-y-2">
          <Label>Correo para notificaciones contractuales</Label>
          <Input type="email" value={form.annex_a_contract_email || ''} onChange={(e) => set('annex_a_contract_email', e.target.value)} placeholder="legal@tuempresa.com" />
        </div>
        <div className="space-y-2">
          <Label>Correo de soporte</Label>
          <Input type="email" value={form.annex_a_support_email || ''} onChange={(e) => set('annex_a_support_email', e.target.value)} placeholder="soporte@tuempresa.com" />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Matriz de escalamiento</Label>
        {escalation.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={c.area} onChange={(e) => updateEscalation(i, 'area', e.target.value)} placeholder="Área (Soporte, Ops...)" className="flex-1" />
            <Input type="email" value={c.email} onChange={(e) => updateEscalation(i, 'email', e.target.value)} placeholder="email@empresa.com" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeEscalation(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEscalation} className="gap-1"><Plus className="h-3 w-3" /> Agregar contacto</Button>
      </div>
    </div>
  )
}

function StepAnnexB({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  const users = (form.annex_b_users || []) as KybDashboardUser[]

  const add = () => set('annex_b_users', [...users, { name: '', email: '', role: 'admin' }])
  const remove = (i: number) => set('annex_b_users', users.filter((_, idx) => idx !== i))
  const upd = (i: number, field: string, value: string) => {
    const updated = [...users]
    updated[i] = { ...updated[i], [field]: value }
    set('annex_b_users', updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Usuarios que tendrán acceso al dashboard de Fintoc. Debe ser un correo electrónico empresarial.
      </p>
      <div className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3 space-y-1">
        <p><strong>Administrador:</strong> Gestiona usuarios y permisos.</p>
        <p><strong>Operador Individual:</strong> Captura y ejecuta transferencias individualmente.</p>
        <p><strong>Capturador:</strong> Captura operaciones que requieren autorización mancomunada.</p>
        <p><strong>Autorizador:</strong> Autoriza operaciones capturadas por otros.</p>
      </div>
      {users.map((u, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <Input value={u.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="Nombre completo" className="flex-1 min-w-[150px]" />
          <Input type="email" value={u.email} onChange={(e) => upd(i, 'email', e.target.value)} placeholder="email@empresa.com" className="flex-1 min-w-[150px]" />
          <Select value={u.role} onChange={(e) => upd(i, 'role', e.target.value)} className="w-40">
            <option value="admin">Administrador</option>
            <option value="operator">Operador Individual</option>
            <option value="capturer">Capturador</option>
            <option value="authorizer">Autorizador</option>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Agregar usuario</Button>
    </div>
  )
}

function StepAnnexD({ form, set }: { form: Partial<FintocApplication>; set: (k: string, v: unknown) => void }) {
  const origins = (form.annex_d_fund_origin || []) as KybFundOrigin[]

  const toggleOrigin = (val: KybFundOrigin) => {
    set('annex_d_fund_origin', origins.includes(val) ? origins.filter((o) => o !== val) : [...origins, val])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Origen de los recursos (selecciona todos los que apliquen)</Label>
        <div className="grid grid-cols-2 gap-2">
          {FUND_ORIGINS.map((fo) => (
            <label key={fo.value} className="flex items-center gap-2 text-sm rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={origins.includes(fo.value)} onChange={() => toggleOrigin(fo.value)} className="h-4 w-4 rounded" />
              {fo.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Monto transaccional mensual esperado</Label>
        <Select value={form.annex_d_monthly_volume || ''} onChange={(e) => set('annex_d_monthly_volume', e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="up_to_2m">Hasta $2,000,000 MXN</option>
          <option value="2m_to_10m">De $2,000,001 a $10,000,000 MXN</option>
          <option value="over_10m">Más de $10,000,001 MXN</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Número de operaciones mensuales (payins + payouts)</Label>
        <Select value={form.annex_d_monthly_operations || ''} onChange={(e) => set('annex_d_monthly_operations', e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="up_to_15k">Hasta 15,000</option>
          <option value="15k_to_50k">De 15,001 a 50,000</option>
          <option value="over_50k">Más de 50,000</option>
        </Select>
      </div>
    </div>
  )
}

function StepReview({ form }: { form: Partial<FintocApplication> }) {
  const docs = (form.documents || {}) as KybDocuments
  const uploadedCount = REQUIRED_DOCS.filter((d) => !!(docs as Record<string, unknown>)[d.key]).length
  const shareholders = (form.shareholders || []) as KybShareholder[]
  const users = (form.annex_b_users || []) as KybDashboardUser[]
  const missingFields: string[] = []

  if (!form.company_legal_name) missingFields.push('Razón social')
  if (!form.company_rfc) missingFields.push('RFC')
  if (!form.rep_legal_name) missingFields.push('Representante legal')
  if (!form.rep_legal_id_type) missingFields.push('ID del representante')
  if (shareholders.length === 0) missingFields.push('Accionistas')
  if (uploadedCount < REQUIRED_DOCS.length) missingFields.push(`Documentos (${uploadedCount}/${REQUIRED_DOCS.length})`)
  if (!form.settlement_clabe) missingFields.push('CLABE de liquidación')
  if (!form.annex_a_billing_email) missingFields.push('Correo de facturación')
  if (users.length === 0) missingFields.push('Usuarios del dashboard')
  if (!(form.annex_d_fund_origin as string[] | undefined)?.length) missingFields.push('Origen de recursos')

  return (
    <div className="space-y-4">
      {missingFields.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Campos pendientes por completar:
          </p>
          <ul className="text-sm text-amber-800 list-disc pl-5 space-y-0.5">
            {missingFields.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <ReviewRow label="Razón social" value={form.company_legal_name} />
        <ReviewRow label="RFC" value={form.company_rfc} />
        <ReviewRow label="Domicilio" value={[form.company_address, form.company_city, form.company_state, form.company_zip].filter(Boolean).join(', ')} />
        <ReviewRow label="Representante Legal" value={form.rep_legal_name} />
        <ReviewRow label="Accionistas" value={shareholders.length > 0 ? shareholders.map((s) => `${s.name} (${s.ownership_pct}%)`).join(', ') : null} />
        <ReviewRow label="Documentos subidos" value={`${uploadedCount} de ${REQUIRED_DOCS.length}`} />
        <ReviewRow label="Banco liquidación" value={form.settlement_bank_name ? `${form.settlement_bank_name} — ${form.settlement_clabe}` : null} />
        <ReviewRow label="Email facturación" value={form.annex_a_billing_email} />
        <ReviewRow label="Usuarios dashboard" value={users.length > 0 ? users.map((u) => `${u.name} (${u.role})`).join(', ') : null} />
        <ReviewRow label="Volumen mensual" value={form.annex_d_monthly_volume} />
      </div>

      {missingFields.length === 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <Check className="inline h-4 w-4 mr-1" />
          Toda la información está completa. Puedes enviar la solicitud a Fintoc.
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span className={value ? 'font-medium' : 'text-amber-600'}>{value || '— Pendiente —'}</span>
    </div>
  )
}
