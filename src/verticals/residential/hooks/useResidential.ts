import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getUnitsWithMembers,
  createUnit,
  updateUnit,
  deleteUnit,
  getCommonAreas,
  createCommonArea,
  updateCommonArea,
  deleteCommonArea,
  updateMaintenanceStatus,
  assignMaintenanceRequest,
} from '../services/residential.service'
import type { MaintenanceStatus } from '@/shared/types'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const unitKeys = {
  all: ['units'] as const,
  list: (communityId: string) => [...unitKeys.all, 'list', communityId] as const,
}

const commonAreaKeys = {
  all: ['common-areas'] as const,
  list: (communityId: string) => [...commonAreaKeys.all, 'list', communityId] as const,
}

const maintenanceKeys = {
  all: ['maintenance-requests'] as const,
  list: (communityId: string) => [...maintenanceKeys.all, communityId] as const,
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export function useUnitsWithMembers() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: unitKeys.list(communityId!),
    queryFn: () => getUnitsWithMembers(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateUnit() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unit: Omit<Parameters<typeof createUnit>[1], never>) =>
      createUnit(communityId!, unit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.list(communityId!) })
      // Also invalidate old 'units' key used by useUnits
      queryClient.invalidateQueries({ queryKey: ['units', communityId] })
    },
  })
}

export function useUpdateUnit() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ unitId, updates }: { unitId: string; updates: Parameters<typeof updateUnit>[1] }) =>
      updateUnit(unitId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: ['units', communityId] })
    },
  })
}

export function useDeleteUnit() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unitId: string) => deleteUnit(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: ['units', communityId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Common Areas
// ---------------------------------------------------------------------------

export function useCommonAreas() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: commonAreaKeys.list(communityId!),
    queryFn: () => getCommonAreas(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateCommonArea() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (area: { name: string; rules?: string | null; reservation_enabled?: boolean }) =>
      createCommonArea(communityId!, area),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonAreaKeys.list(communityId!) })
    },
  })
}

export function useUpdateCommonArea() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ areaId, updates }: { areaId: string; updates: Parameters<typeof updateCommonArea>[1] }) =>
      updateCommonArea(areaId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonAreaKeys.list(communityId!) })
    },
  })
}

export function useDeleteCommonArea() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (areaId: string) => deleteCommonArea(areaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commonAreaKeys.list(communityId!) })
    },
  })
}

// ---------------------------------------------------------------------------
// Maintenance Requests
// ---------------------------------------------------------------------------

export function useUpdateMaintenanceStatus() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: MaintenanceStatus }) =>
      updateMaintenanceStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(communityId!) })
    },
  })
}

export function useAssignMaintenance() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, memberId }: { requestId: string; memberId: string | null }) =>
      assignMaintenanceRequest(requestId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(communityId!) })
    },
  })
}
