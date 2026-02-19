import { useState } from 'react'
import { useTasks, useCreateTask, useUpdateTask } from '../hooks/useImplementation'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { cn } from '@/shared/lib/utils'
import { Plus, CheckCircle2, Clock, AlertTriangle, XCircle, ListTodo } from 'lucide-react'
import { TASK_STATUS_CONFIG, type TaskStatus } from '../types'

interface Props {
  proposalId: string
}

export function ImplementationTracker({ proposalId }: Props) {
  const { isAdmin } = usePermissions()
  const { data: tasks, isLoading } = useTasks(proposalId)
  const { data: members } = useMembers()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask(proposalId)

  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newResponsible, setNewResponsible] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  const handleCreate = () => {
    if (!newTitle.trim()) return
    createTask.mutate(
      {
        proposal_id: proposalId,
        title: newTitle.trim(),
        responsible_member_id: newResponsible || undefined,
        due_date: newDueDate || undefined,
      },
      {
        onSuccess: () => {
          setNewTitle('')
          setNewResponsible('')
          setNewDueDate('')
          setShowForm(false)
        },
      }
    )
  }

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ taskId, updates: { status } })
  }

  const handleProgressChange = (taskId: string, progress: number) => {
    updateTask.mutate({ taskId, updates: { progress_pct: progress } })
  }

  const completedCount = tasks?.filter((t) => t.status === 'completed').length ?? 0
  const totalCount = tasks?.length ?? 0
  const overallProgress = totalCount > 0
    ? Math.round(tasks!.reduce((s, t) => s + t.progress_pct, 0) / totalCount)
    : 0

  if (isLoading) return <LoadingSpinner message="Cargando tareas..." className="py-4" />

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4" />
            Seguimiento de Implementación
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </CardTitle>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tarea
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso general</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  overallProgress === 100 ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* New task form */}
        {showForm && (
          <div className="rounded-md border border-dashed p-3 space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título de la tarea"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={newResponsible} onChange={(e) => setNewResponsible(e.target.value)}>
                <option value="">Responsable (opcional)</option>
                {(members ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.display_name ?? m.name}</option>
                ))}
              </Select>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="Fecha límite"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createTask.isPending || !newTitle.trim()}>
                {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Task list */}
        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay tareas de implementación aún.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks!.map((task) => {
              const statusConfig = TASK_STATUS_CONFIG[task.status as TaskStatus]
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-start gap-3 rounded-md border p-3',
                    task.status === 'completed' && 'opacity-60'
                  )}
                >
                  {/* Status icon */}
                  <button
                    onClick={() => {
                      if (!isAdmin) return
                      const next: Record<string, TaskStatus> = {
                        pending: 'in_progress',
                        in_progress: 'completed',
                        completed: 'pending',
                        blocked: 'in_progress',
                        cancelled: 'pending',
                      }
                      handleStatusChange(task.id, next[task.status] ?? 'pending')
                    }}
                    className={cn('mt-0.5 shrink-0', isAdmin && 'cursor-pointer')}
                    title={statusConfig.label}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : task.status === 'blocked' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : task.status === 'cancelled' ? (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                  </button>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through')}>
                        {task.title}
                      </p>
                      <Badge className={cn('text-[10px]', statusConfig.bgColor, statusConfig.color)} variant="outline">
                        {statusConfig.label}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[10px]">Vencida</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.responsible_name && <span>Responsable: {task.responsible_name}</span>}
                      {task.due_date && <span>Fecha: {new Date(task.due_date).toLocaleDateString('es-MX')}</span>}
                    </div>
                    {/* Progress slider */}
                    {isAdmin && task.status !== 'completed' && task.status !== 'cancelled' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={task.progress_pct}
                          onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                          className="h-1.5 w-full appearance-none rounded-full bg-muted accent-primary"
                        />
                        <span className="text-[10px] font-medium w-8 text-right">{task.progress_pct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
