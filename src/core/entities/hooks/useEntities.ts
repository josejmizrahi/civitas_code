import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityContacts,
  createEntityContact,
  deleteEntityContact,
} from '../services/entities.service'
import type { Entity, EntityContact } from '../types'

const entityKeys = {
  all: ['entities'] as const,
  list: (communityId: string, filters?: any) => [...entityKeys.all, communityId, filters] as const,
  detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
  contacts: (entityId: string) => [...entityKeys.all, 'contacts', entityId] as const,
}

export function useEntities(filters?: { type?: string; status?: string }) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: entityKeys.list(communityId!, filters),
    queryFn: () => getEntities(communityId!, filters),
    enabled: !!communityId,
  })
}

export function useEntity(entityId: string | null) {
  return useQuery({
    queryKey: entityKeys.detail(entityId!),
    queryFn: () => getEntity(entityId!),
    enabled: !!entityId,
  })
}

export function useCreateEntity() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (entity: Omit<Entity, 'id' | 'community_id' | 'created_at' | 'updated_at' | 'metadata'>) =>
      createEntity(communityId!, { ...entity, created_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

export function useUpdateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateEntity>[1] }) =>
      updateEntity(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

export function useDeleteEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

export function useEntityContacts(entityId: string | null) {
  return useQuery({
    queryKey: entityKeys.contacts(entityId!),
    queryFn: () => getEntityContacts(entityId!),
    enabled: !!entityId,
  })
}

export function useCreateEntityContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, contact }: { entityId: string; contact: Omit<EntityContact, 'id' | 'entity_id' | 'created_at'> }) =>
      createEntityContact(entityId, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}

export function useDeleteEntityContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) => deleteEntityContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}
