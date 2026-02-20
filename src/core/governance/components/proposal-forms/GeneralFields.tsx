import { useState, useEffect } from 'react'
import type { TemplateFieldsProps } from './types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'

export function GeneralFields({ onFieldsChange, initialData }: TemplateFieldsProps) {
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
        <Label>Título</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la propuesta"
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describa la propuesta..."
          rows={4}
        />
      </div>
    </div>
  )
}
