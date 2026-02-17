import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useCreateRating } from '../hooks/useRatings'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Star } from 'lucide-react'
import { RATING_DIMENSION_LABELS } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: 'entity' | 'member'
  targetId: string
  targetName: string
  contractId?: string
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hovered || value) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function RatingForm({ open, onOpenChange, targetType, targetId, targetName, contractId }: Props) {
  const { currentMember } = useCommunityContext()
  const createRating = useCreateRating()

  const [overall, setOverall] = useState(0)
  const [dimensions, setDimensions] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setOverall(0)
    setDimensions({})
    setComment('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overall) { setError('Selecciona una calificacion general'); return }
    if (!currentMember) { setError('No se encontro tu membresia'); return }

    try {
      await createRating.mutateAsync({
        target_type: targetType,
        target_id: targetId,
        rated_by: currentMember.id,
        overall_score: overall,
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : undefined,
        comment: comment || undefined,
        contract_id: contractId,
      })
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar calificacion')
    }
  }

  const setDim = (key: string, val: number) => {
    setDimensions({ ...dimensions, [key]: val })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Calificar: {targetName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            {/* Overall Score */}
            <div className="space-y-2">
              <Label>Calificacion General *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setOverall(star)} className="p-1">
                    <Star className={`h-8 w-8 transition-colors ${star <= overall ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
                {overall > 0 && <span className="text-lg font-bold ml-2">{overall}/5</span>}
              </div>
            </div>

            {/* Dimension Scores */}
            <div className="space-y-3">
              <Label>Dimensiones (opcional)</Label>
              <div className="rounded-md border p-3 space-y-2">
                {Object.entries(RATING_DIMENSION_LABELS).map(([key, label]) => (
                  <StarRating
                    key={key}
                    label={label}
                    value={dimensions[key] || 0}
                    onChange={(v) => setDim(key, v)}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label>Comentario (opcional)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe tu experiencia..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancelar</Button>
            <Button type="submit" disabled={createRating.isPending}>
              {createRating.isPending ? 'Guardando...' : 'Enviar Calificacion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
