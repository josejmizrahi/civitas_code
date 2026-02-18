import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getTasks, createTask, updateTask } from '../services/accountability.service'

export function useTasks(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['implementation-tasks', proposalId],
    queryFn: () => getTasks(proposalId!),
    enabled: !!proposalId,
  })
}

export function useCreateTask() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: {
      proposal_id: string
      title: string
      description?: string
      responsible_member_id?: string
      due_date?: string
    }) =>
      createTask({ community_id: communityId!, ...task }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['implementation-tasks', variables.proposal_id] })
    },
  })
}

export function useUpdateTask(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, updates }: {
      taskId: string
      updates: {
        title?: string
        description?: string
        responsible_member_id?: string | null
        status?: string
        progress_pct?: number
        due_date?: string | null
        notes?: string
      }
    }) =>
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implementation-tasks', proposalId] })
    },
  })
}
