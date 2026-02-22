import { useState, useEffect, useMemo } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useI18n } from '@/shared/hooks/useI18n'

const DOCS_CHECKLIST = [
  { id: 'identificacion' },
  { id: 'comprobante_domicilio' },
  { id: 'solicitud_firmada' },
  { id: 'otros' },
] as const

export function AdmisionFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const docsChecklist = useMemo(() => [
    { id: 'identificacion', label: t('admisionFields.doc.id') },
    { id: 'comprobante_domicilio', label: t('admisionFields.doc.address') },
    { id: 'solicitud_firmada', label: t('admisionFields.doc.signedRequest') },
    { id: 'otros', label: t('admisionFields.doc.others') },
  ] as const, [t])
  const [candidato, setCandidato] = useState(
    (initialData?.metadata?.candidato as string) ?? ''
  )
  const [email, setEmail] = useState(
    (initialData?.metadata?.email as string) ?? ''
  )
  const [unidad, setUnidad] = useState(
    (initialData?.metadata?.unidad as string) ?? ''
  )
  const [docsPresentados, setDocsPresentados] = useState<Record<string, boolean>>(() => {
    const prev = (initialData?.metadata?.docsPresentados as Record<string, boolean>) ?? {}
    return DOCS_CHECKLIST.reduce((acc, { id }) => ({ ...acc, [id]: prev[id] ?? false }), {} as Record<string, boolean>)
  })

  useEffect(() => {
    const title = candidato ? `${t('admisionFields.titlePrefix')}: ${candidato}` : initialData?.title ?? ''
    const description = [
      candidato && t('admisionFields.desc.candidate').replace('{value}', candidato),
      email && t('admisionFields.desc.email').replace('{value}', email),
      unidad && t('admisionFields.desc.unit').replace('{value}', unidad),
      t('admisionFields.desc.docs'),
      ...docsChecklist.map((d) => t('admisionFields.desc.docLine')
        .replace('{label}', d.label)
        .replace('{value}', docsPresentados[d.id] ? t('admisionFields.yes') : t('admisionFields.no'))),
    ]
      .filter(Boolean)
      .join('\n')
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
      metadata: {
        ...((initialData?.metadata as Record<string, unknown>) ?? {}),
        candidato: candidato || undefined,
        email: email || undefined,
        unidad: unidad || undefined,
        docsPresentados,
      },
    })
  }, [candidato, email, unidad, docsPresentados, onFieldsChange, initialData, t, docsChecklist])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('admisionFields.candidateLabel')}</Label>
        <Input
          value={candidato}
          onChange={(e) => setCandidato(e.target.value)}
          placeholder={t('admisionFields.candidatePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('admisionFields.emailLabel')}</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('admisionFields.emailPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('admisionFields.unitLabel')}</Label>
        <Input
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          placeholder={t('admisionFields.unitPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('admisionFields.docsLabel')}</Label>
        <div className="space-y-2 rounded-md border p-3">
          {docsChecklist.map((d) => (
            <label key={d.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={docsPresentados[d.id] ?? false}
                onChange={(e) =>
                  setDocsPresentados((prev) => ({ ...prev, [d.id]: e.target.checked }))
                }
                className="rounded border-input"
              />
              <span className="text-sm">{d.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
