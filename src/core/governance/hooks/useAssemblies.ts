import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '@/app/providers'
import {
  getAssemblies,
  getAssembly,
  createAssembly,
  updateAssemblyStatus,
  recordAttendance,
  getConvocatorias,
} from '../services/assembly.service'
import type { AgendaItem, AssemblyStatus, AttendanceRecord } from '../types'
import { awardXp } from '@/core/gamification/services/gamification.service'

export function useAssemblies(status?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['assemblies', communityId, status],
    queryFn: () => getAssemblies(communityId!, status),
    enabled: !!communityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useAssembly(assemblyId: string | undefined) {
  return useQuery({
    queryKey: ['assembly', assemblyId],
    queryFn: () => getAssembly(assemblyId!),
    enabled: !!assemblyId,
  })
}

export function useCreateAssembly() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      type: string
      title: string
      scheduled_date: string
      location: string
      agenda: AgendaItem[]
    }) =>
      createAssembly(communityId!, {
        ...data,
        called_by: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies', communityId] })
    },
  })
}

export function useUpdateAssemblyStatus() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assemblyId,
      status,
      callAt,
    }: {
      assemblyId: string
      status: AssemblyStatus
      callAt?: string
    }) => updateAssemblyStatus(assemblyId, status, callAt),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies', communityId] })
      queryClient.invalidateQueries({
        queryKey: ['assembly', variables.assemblyId],
      })
    },
  })
}

export function useRecordAttendance() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assemblyId,
      records,
    }: {
      assemblyId: string
      records: AttendanceRecord[]
    }) => recordAttendance(assemblyId, records),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies', communityId] })
      queryClient.invalidateQueries({
        queryKey: ['assembly', variables.assemblyId],
      })
      // Award XP for attending (each present member)
      if (communityId) {
        const present = variables.records.filter((r) => r.present)
        for (const r of present) {
          awardXp(r.member_id, communityId, 'attend_assembly').catch(() => {})
        }
      }
    },
  })
}

export function useConvocatorias(assemblyId: string | undefined) {
  return useQuery({
    queryKey: ['convocatorias', assemblyId],
    queryFn: () => getConvocatorias(assemblyId!),
    enabled: !!assemblyId,
  })
}
