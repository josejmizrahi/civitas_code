import { useState, useCallback, useRef, useEffect } from 'react'
import {
  useKybApplication,
  useCreateApplication,
  useUpdateApplication,
  useSubmitApplication,
  useUploadKybDoc,
} from '../hooks/useKyb'
import type {
  KybApplication,
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
import { Progress } from '@/shared/components/ui/progress'
import { useToast } from '@/shared/components/ui/toast'
import { cn } from '@/shared/lib/utils'
import {
  Building2, User, Users, FileText, Landmark, Mail, Shield,
  ChevronLeft, ChevronRight, Check, Upload, Plus, Trash2, AlertCircle,
  Loader2, CheckCircle2,
} from 'lucide-react'

interface KybWizardProps {
  onBack?: () => void
}

const STEPS = [
  { id: 'company', label: 'Empresa', fullLabel: 'Datos de la empresa', icon: Building2 },
  { id: 'representative', label: 'Representante', fullLabel: 'Representante legal', icon: User },
  { id: 'shareholders', label: 'Accionistas', fullLabel: 'Estructura accionaria', icon: Users },
  { id: 'documents', label: 'Documentos', fullLabel: 'Documentos requeridos', icon: FileText },
  { id: 'bank', label: 'Banco', fullLabel: 'Cuenta de liquidación', icon: Landmark },
  { id: 'annex-a', label: 'Contacto', fullLabel: 'Anexo A — Datos de contacto', icon: Mail },
  { id: 'annex-b', label: 'Usuarios', fullLabel: 'Anexo B — Usuarios del portal', icon: Shield },
  { id: 'annex-d', label: 'Perfil', fullLabel: 'Anexo D — Perfil transaccional', icon: Shield },
  { id: 'review', label: 'Envío', fullLabel: 'Revisión y envío', icon: Check },
]

const REQUIRED_DOCS: { key: keyof KybDocuments; label: string }[] = [
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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

function KybSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Card className="rounded-xl">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
      status === 'saving' && 'text-muted-foreground',
      status === 'saved' && 'text-emerald-600',
      status === 'error' && 'text-destructive',
    )}>
      {status === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
      {status === 'saved' && <><CheckCircle2 className="h-3 w-3" /> Guardado</>}
      {status === 'error' && <><AlertCircle className="h-3 w-3" /> Error al guardar</>}
    </div>
  )
}

function stepIsComplete(step: number, form: Partial<KybApplication>): boolean {
  const docs = (form.documents || {}) as Record<string, unknown>
  const shareholders = (form.shareholders || []) as KybShareholder[]
  const users = (form.annex_b_users || []) as KybDashboardUser[]

  switch (step) {
    case 0: return !!(form.company_legal_name && form.company_rfc)
    case 1: return !!(form.rep_legal_name && form.rep_legal_id_type)
    case 2: return shareholders.length > 0
    case 3: return REQUIRED_DOCS.filter((d) => !!docs[d.key]).length >= 5
    case 4: return !!(form.settlement_clabe && form.settlement_bank_name)
    case 5: return !!form.annex_a_billing_email
    case 6: return users.length > 0
    case 7: return !!((form.annex_d_fund_origin as string[] | undefined)?.length)
    case 8: return true
    default: return false
  }
}

export function KybWizard(_props: KybWizardProps) {
  const { data: app, isLoading } = useKybApplication()
  const create = useCreateApplication()
  const update = useUpdateApplication()
  const submit = useSubmitApplication()
  const uploadDoc = useUploadKybDoc()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<KybApplication>>({})
  const [initialized, setInitialized] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stepTransition, setStepTransition] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (app && !initialized) {
      setForm(app)
      setInitialized(true)
    }
  }, [app, initialized])

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
    setSaveStatus('saving')
    try {
      await update.mutateAsync({ appId, updates: form })
      setSaveStatus('saved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      toast.error('Error al guardar')
    }
  }

  const goToStep = (target: number) => {
    setStepTransition(true)
    saveStep()
    setTimeout(() => {
      setStep(target)
      setStepTransition(false)
    }, 150)
  }

  const nextStep = () => goToStep(Math.min(step + 1, STEPS.length - 1))
  const prevStep = () => goToStep(Math.max(step - 1, 0))

  const handleSubmit = async () => {
    const appId = (form.id || app?.id)!
    await saveStep()
    try {
      await submit.mutateAsync(appId)
      toast.success('Solicitud enviada para revisión')
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
      toast.success(`${file.name} subido correctamente`)
    } catch {
      toast.error('Error al subir archivo')
    }
  }

  if (isLoading) return <KybSkeleton />

  if (app?.status === 'rejected') {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h3 className="text-lg font-semibold">Solicitud rechazada</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{app.rejection_reason || 'Contacta a soporte para más detalles.'}</p>
          <Button onClick={handleStart}>Iniciar nueva solicitud</Button>
        </CardContent>
      </Card>
    )
  }

  if (!app && !form.id) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-10 text-center space-y-5">
          <div className="mx-auto rounded-full bg-blue-50 p-4 w-fit">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Proceso de conocimiento del cliente (KYB)</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Para activar pagos SPEI necesitas completar una solicitud con datos de tu empresa,
              representante legal, accionistas y documentos requeridos.
              <br />
              <span className="text-xs opacity-75">El proceso toma aproximadamente 15 minutos. Tu progreso se guarda automáticamente.</span>
            </p>
          </div>
          <Button onClick={handleStart} disabled={create.isPending} size="lg" className="gap-2">
            {create.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creando solicitud...</>
            ) : (
              <><FileText className="h-4 w-4" /> Comenzar solicitud</>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const progressPct = ((step + 1) / STEPS.length) * 100
  const currentStep = STEPS[step]

  return (
    <div className="space-y-4">
      {/* Progress bar + step pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Paso {step + 1} de {STEPS.length}
          </span>
          <SaveIndicator status={saveStatus} />
        </div>
        <Progress value={progressPct} className="h-1.5" indicatorClassName="bg-emerald-500 transition-all duration-500" />

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isCurrent = i === step
            const complete = i < step || (i < STEPS.length - 1 && stepIsComplete(i, form))
            return (
              <button
                key={s.id}
                onClick={() => goToStep(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all shrink-0',
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : complete
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {complete && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {(() => { const I = currentStep.icon; return <I className="h-5 w-5 text-primary" /> })()}
            {currentStep.fullLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('transition-opacity duration-150', stepTransition ? 'opacity-0' : 'opacity-100')}>
          {step === 0 && <StepCompany form={form} set={set} />}
          {step === 1 && <StepRepresentative form={form} set={set} />}
          {step === 2 && <StepShareholders form={form} set={set} />}
          {step === 3 && <StepDocuments form={form} onUpload={handleFileUpload} uploading={uploadDoc.isPending} />}
          {step === 4 && <StepBank form={form} set={set} />}
          {step === 5 && <StepAnnexA form={form} set={set} />}
          {step === 6 && <StepAnnexB form={form} set={set} />}
          {step === 7 && <StepAnnexD form={form} set={set} />}
          {step === 8 && <StepReview form={form} onGoToStep={goToStep} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep} className="gap-1">
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-200/50"
          >
            {submit.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Check className="h-4 w-4" /> Enviar solicitud</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Step Components ──────────────────────────────────────────────

function StepCompany({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>Razón social <span className="text-destructive">*</span></Label>
        <Input value={form.company_legal_name || ''} onChange={(e) => set('company_legal_name', e.target.value)} placeholder="Administradora de Condominios S.A. de C.V." />
      </div>
      <div className="space-y-2">
        <Label>RFC <span className="text-destructive">*</span></Label>
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

function StepRepresentative({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Persona que firmará el contrato y que cuenta con poder notarial.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nombre completo <span className="text-destructive">*</span></Label>
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
          <Label>Tipo de identificación <span className="text-destructive">*</span></Label>
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

function StepShareholders({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
  const shareholders = (form.shareholders || []) as KybShareholder[]

  const add = () => set('shareholders', [...shareholders, { name: '', id_type: 'ine', id_number: '', ownership_pct: 0, is_foreign: false, is_moral: false }])
  const remove = (i: number) => set('shareholders', shareholders.filter((_, idx) => idx !== i))
  const upd = (i: number, field: string, value: unknown) => {
    const updated = [...shareholders]
    updated[i] = { ...updated[i], [field]: value }
    set('shareholders', updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Accionistas personas físicas con participación directa o indirecta ≥ 25%.
      </p>
      {shareholders.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No hay accionistas registrados.</p>
        </div>
      )}
      {shareholders.map((sh, i) => (
        <Card key={i} className="rounded-lg">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accionista {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => remove(i)} className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Nombre completo</Label>
                <Input value={sh.name} onChange={(e) => upd(i, 'name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% Participación</Label>
                <Input type="number" min={0} max={100} value={sh.ownership_pct} onChange={(e) => upd(i, 'ownership_pct', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de ID</Label>
                <Select value={sh.id_type} onChange={(e) => upd(i, 'id_type', e.target.value)}>
                  <option value="ine">INE</option>
                  <option value="passport">Pasaporte</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Número de ID</Label>
                <Input value={sh.id_number} onChange={(e) => upd(i, 'id_number', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={sh.is_moral} onChange={(e) => upd(i, 'is_moral', e.target.checked)} className="h-4 w-4 rounded" />
                Es persona moral
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={sh.is_foreign} onChange={(e) => upd(i, 'is_foreign', e.target.checked)} className="h-4 w-4 rounded" />
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

function StepDocuments({ form, onUpload, uploading }: { form: Partial<KybApplication>; onUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) {
  const docs = (form.documents || {}) as KybDocuments
  const uploadedCount = REQUIRED_DOCS.filter((d) => !!(docs as Record<string, unknown>)[d.key]).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Sube los documentos requeridos. PDF, JPG o PNG.</p>
        <Badge variant="secondary" className="text-xs">
          {uploadedCount}/{REQUIRED_DOCS.length} subidos
        </Badge>
      </div>
      <div className="space-y-2">
        {REQUIRED_DOCS.map((doc) => {
          const uploaded = !!(docs as Record<string, unknown>)[doc.key]
          return (
            <div key={doc.key} className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-colors',
              uploaded ? 'border-emerald-200 bg-emerald-50/30' : 'hover:bg-muted/30',
            )}>
              <div className={cn(
                'rounded-full p-1.5 shrink-0',
                uploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
              )}>
                {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{doc.label}</p>
                {uploaded && <p className="text-xs text-emerald-600 mt-0.5">Documento subido</p>}
              </div>
              <label className="cursor-pointer shrink-0">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onUpload(doc.key, e)} disabled={uploading} />
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted',
                  uploading ? 'opacity-50 cursor-wait' : '',
                )}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {uploaded ? 'Reemplazar' : 'Subir'}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepBank({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cuenta bancaria a nombre de la empresa para la liquidación de pagos recibidos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Titular de la cuenta <span className="text-destructive">*</span></Label>
          <Input value={form.settlement_account_holder || ''} onChange={(e) => set('settlement_account_holder', e.target.value)} placeholder="Mismo que razón social" />
        </div>
        <div className="space-y-2">
          <Label>Banco <span className="text-destructive">*</span></Label>
          <Input value={form.settlement_bank_name || ''} onChange={(e) => set('settlement_bank_name', e.target.value)} placeholder="BBVA, Banorte, etc." />
        </div>
        <div className="space-y-2">
          <Label>Número de cuenta</Label>
          <Input value={form.settlement_account_number || ''} onChange={(e) => set('settlement_account_number', e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>CLABE interbancaria (18 dígitos) <span className="text-destructive">*</span></Label>
          <Input value={form.settlement_clabe || ''} onChange={(e) => set('settlement_clabe', e.target.value)} maxLength={18} className="font-mono" placeholder="012180..." />
        </div>
      </div>
    </div>
  )
}

function StepAnnexA({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
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
      <p className="text-sm text-muted-foreground">Datos de contacto para facturación, conciliación y notificaciones contractuales.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Correo para facturación y conciliación <span className="text-destructive">*</span></Label>
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
            <Button variant="ghost" size="icon" onClick={() => removeEscalation(i)} className="h-8 w-8 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEscalation} className="gap-1"><Plus className="h-3 w-3" /> Agregar contacto</Button>
      </div>
    </div>
  )
}

function StepAnnexB({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
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
        Usuarios que tendrán acceso al portal del proveedor de pagos.
      </p>
      <div className="text-xs rounded-lg bg-muted/50 p-3 space-y-1">
        <p><strong>Administrador:</strong> Gestiona usuarios y permisos.</p>
        <p><strong>Operador:</strong> Captura y ejecuta transferencias.</p>
        <p><strong>Capturador:</strong> Captura operaciones (requiere autorización).</p>
        <p><strong>Autorizador:</strong> Autoriza operaciones de otros.</p>
      </div>
      {users.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
        </div>
      )}
      {users.map((u, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <Input value={u.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="Nombre completo" className="flex-1 min-w-[150px]" />
          <Input type="email" value={u.email} onChange={(e) => upd(i, 'email', e.target.value)} placeholder="email@empresa.com" className="flex-1 min-w-[150px]" />
          <Select value={u.role} onChange={(e) => upd(i, 'role', e.target.value)} className="w-40">
            <option value="admin">Administrador</option>
            <option value="operator">Operador</option>
            <option value="capturer">Capturador</option>
            <option value="authorizer">Autorizador</option>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1"><Plus className="h-3 w-3" /> Agregar usuario</Button>
    </div>
  )
}

function StepAnnexD({ form, set }: { form: Partial<KybApplication>; set: (k: string, v: unknown) => void }) {
  const origins = (form.annex_d_fund_origin || []) as KybFundOrigin[]

  const toggleOrigin = (val: KybFundOrigin) => {
    set('annex_d_fund_origin', origins.includes(val) ? origins.filter((o) => o !== val) : [...origins, val])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Origen de los recursos <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {FUND_ORIGINS.map((fo) => (
            <label key={fo.value} className={cn(
              'flex items-center gap-2 text-sm rounded-lg border p-2.5 cursor-pointer transition-colors',
              origins.includes(fo.value)
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'hover:bg-muted/50',
            )}>
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

function StepReview({ form, onGoToStep }: { form: Partial<KybApplication>; onGoToStep: (step: number) => void }) {
  const docs = (form.documents || {}) as KybDocuments
  const uploadedCount = REQUIRED_DOCS.filter((d) => !!(docs as Record<string, unknown>)[d.key]).length
  const shareholders = (form.shareholders || []) as KybShareholder[]
  const users = (form.annex_b_users || []) as KybDashboardUser[]

  const sections: { label: string; value: string | null | undefined; step: number; required?: boolean }[] = [
    { label: 'Razón social', value: form.company_legal_name, step: 0, required: true },
    { label: 'RFC', value: form.company_rfc, step: 0, required: true },
    { label: 'Domicilio', value: [form.company_address, form.company_city, form.company_state].filter(Boolean).join(', ') || null, step: 0 },
    { label: 'Representante Legal', value: form.rep_legal_name, step: 1, required: true },
    { label: 'Accionistas', value: shareholders.length > 0 ? shareholders.map((s) => `${s.name} (${s.ownership_pct}%)`).join(', ') : null, step: 2, required: true },
    { label: 'Documentos', value: uploadedCount > 0 ? `${uploadedCount} de ${REQUIRED_DOCS.length}` : null, step: 3, required: true },
    { label: 'CLABE liquidación', value: form.settlement_clabe ? `${form.settlement_bank_name || ''} — ${form.settlement_clabe}` : null, step: 4, required: true },
    { label: 'Email facturación', value: form.annex_a_billing_email, step: 5, required: true },
    { label: 'Usuarios portal', value: users.length > 0 ? users.map((u) => `${u.name} (${u.role})`).join(', ') : null, step: 6, required: true },
    { label: 'Origen recursos', value: ((form.annex_d_fund_origin as string[] | undefined)?.length) ? `${(form.annex_d_fund_origin as string[]).length} seleccionados` : null, step: 7, required: true },
  ]

  const missingCount = sections.filter((s) => s.required && !s.value).length

  return (
    <div className="space-y-4">
      {missingCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm">
          <p className="font-medium text-amber-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {missingCount} campo{missingCount > 1 ? 's' : ''} pendiente{missingCount > 1 ? 's' : ''} por completar
          </p>
        </div>
      )}

      <div className="space-y-1">
        {sections.map((s) => (
          <button
            key={s.label}
            onClick={() => !s.value && s.required ? onGoToStep(s.step) : undefined}
            className={cn(
              'flex items-start gap-3 text-sm w-full text-left rounded-lg p-2.5 transition-colors',
              !s.value && s.required ? 'hover:bg-amber-50 cursor-pointer' : 'cursor-default',
            )}
          >
            <div className={cn(
              'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs',
              s.value ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
            )}>
              {s.value ? <CheckCircle2 className="h-3.5 w-3.5" /> : '!'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground">{s.label}</span>
              <p className={cn('font-medium truncate', !s.value && 'text-amber-600 font-normal')}>
                {s.value || 'Pendiente — click para completar'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {missingCount === 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Toda la información está completa</p>
            <p className="text-emerald-700 mt-0.5">Puedes enviar la solicitud. El equipo de compliance revisará tu documentación en 3-5 días hábiles.</p>
          </div>
        </div>
      )}
    </div>
  )
}
