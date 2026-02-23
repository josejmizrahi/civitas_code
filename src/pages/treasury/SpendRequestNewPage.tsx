import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useCreateSpendRequest, useClassifySpendRequest } from '@/core/treasury/hooks/useSpendRequests'
import { getCategories } from '@/core/treasury/services/treasury.service'
import { useToast } from '@/shared/components/ui/toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

export function SpendRequestNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const createSpendRequest = useCreateSpendRequest()
  const classifySpendRequest = useClassifySpendRequest()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [fund, setFund] = useState('general')
  const [isEmergency, setIsEmergency] = useState(false)
  const [previewLevel, setPreviewLevel] = useState<number | null>(null)

  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''
  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId),
    enabled: !!communityId,
  })
  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []

  const handleCreateDraft = async () => {
    const num = parseFloat(amount)
    if (!title.trim() || Number.isNaN(num) || num <= 0 || !categoryId) {
      toast.error('Completa título, monto positivo y categoría.')
      return
    }
    if (!user?.id) {
      toast.error('Debes iniciar sesión.')
      return
    }
    try {
      const sr = await createSpendRequest.mutateAsync({
        requestedByUserId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: num,
        category_id: categoryId,
        fund: fund === 'general' ? undefined : fund,
        is_emergency: isEmergency,
      })
      toast.success('Solicitud creada en borrador.')
      navigate(`/treasury/requests/${sr.id}`)
    } catch {
      toast.error('No se pudo crear la solicitud.')
    }
  }

  const handlePreviewClassification = async () => {
    const num = parseFloat(amount)
    if (!categoryId || Number.isNaN(num) || num <= 0) {
      toast.error('Ingresa monto y categoría para previsualizar.')
      return
    }
    try {
      const sr = await createSpendRequest.mutateAsync({
        requestedByUserId: user!.id,
        title: title.trim() || 'Vista previa',
        description: description.trim() || undefined,
        amount: num,
        category_id: categoryId,
        fund: fund === 'general' ? undefined : fund,
        is_emergency: isEmergency,
      })
      const level = await classifySpendRequest.mutateAsync(sr.id)
      setPreviewLevel(level ?? null)
      toast.success(level != null ? `Clasificación: Nivel ${level}` : 'No se pudo clasificar.')
      navigate(`/treasury/requests/${sr.id}`)
    } catch {
      toast.error('Error al previsualizar.')
    }
  }

  const levelLabel =
    previewLevel != null
      ? { 1: 'Dentro de presupuesto (auto-aprobado)', 2: 'Discrecional (vigilancia)', 3: 'Votación asamblea', 4: 'Emergencia' }[
          previewLevel
        ]
      : null

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/treasury/requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nueva solicitud de gasto</h1>
          <p className="text-sm text-muted-foreground">
            Crea un borrador; luego en el detalle podrás enviarla y ver su nivel (N1–N4).
          </p>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          handleCreateDraft()
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Pago proveedor X"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalle del gasto"
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fund">Fondo</Label>
          <select
            id="fund"
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="general">General</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reserva">Reserva</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emergency"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="emergency">Gasto de emergencia (N4)</Label>
        </div>
        {levelLabel && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{levelLabel}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={createSpendRequest.isPending} className="gap-2">
            {createSpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear borrador
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviewClassification}
            disabled={classifySpendRequest.isPending || !user?.id}
          >
            {classifySpendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Previsualizar nivel
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/treasury/requests')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
