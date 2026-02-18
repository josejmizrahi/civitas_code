// Accountability System Types — AC-001..AC-007
// Implementation tracking and decision archive

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'

export interface ImplementationTask {
  id: string
  community_id: string
  proposal_id: string
  title: string
  description: string
  responsible_member_id: string | null
  status: TaskStatus
  progress_pct: number
  due_date: string | null
  completed_at: string | null
  notes: string
  created_at: string
  updated_at: string
  // Joined
  responsible_name?: string
  proposal_title?: string
}

export interface DecisionArchiveEntry {
  id: string
  community_id: string
  title: string
  description: string
  type: string
  status: string
  result: string | null
  template_id: string | null
  voting_model: string
  quorum_required: number
  majority_required: number
  created_at: string
  closed_at: string | null
  executed_at: string | null
  outcome_declared: string | null
  vote_count: number
  comment_count: number
  task_count: number
  tasks_completed: number
  avg_progress: number
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'En progreso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completed: { label: 'Completada', color: 'text-green-700', bgColor: 'bg-green-100' },
  blocked: { label: 'Bloqueada', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelada', color: 'text-gray-500', bgColor: 'bg-gray-50' },
}
