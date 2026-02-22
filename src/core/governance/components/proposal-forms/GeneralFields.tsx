import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useI18n } from '@/shared/hooks/useI18n'

export function GeneralFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')

  useEffect(() => {
    onFieldsChange({
      title: title || undefined,
      description: description || undefined,
    })
  }, [title, description, onFieldsChange])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('generalFields.title')}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('generalFields.titlePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('generalFields.description')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('generalFields.descriptionPlaceholder')}
          rows={4}
        />
      </div>
    </div>
  )
}
