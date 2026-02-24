import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '../services/treasury.service'
import { supabase } from '@/shared/lib/supabase'
import type { Category } from '../types'
import type { CategoryType } from '@/shared/types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useConfirm } from '@/shared/components/ConfirmDialog'

async function createCategory(communityId: string, name: string, type: CategoryType): Promise<Category> {
  const { data, error } = await supabase.from('categories')
    .insert({ community_id: communityId, name, type })
    .select()
    .single()
  if (error) throw error
  return data as Category
}

async function updateCategory(categoryId: string, name: string): Promise<Category> {
  const { data, error } = await supabase.from('categories')
    .update({ name })
    .eq('id', categoryId)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories')
    .delete()
    .eq('id', categoryId)
  if (error) throw error
}

export function CategoryManager() {
  const { t } = useI18n()
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CategoryType>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories', communityId] })

  const createMut = useMutation({
    mutationFn: () => createCategory(communityId!, newName.trim(), newType),
    onSuccess: () => { invalidate(); setNewName('') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCategory(id, name),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: invalidate,
  })

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  if (isLoading) return <LoadingSpinner message={t('treasury.loadingCategories')} className="py-8" />

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="flex gap-2">
        <Input
          placeholder={t('treasury.categoryNamePlaceholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Select value={newType} onChange={(e) => setNewType(e.target.value as CategoryType)} className="w-32">
          <option value="expense">{t('treasury.expense')}</option>
          <option value="income">{t('treasury.income')}</option>
        </Select>
        <Button
          onClick={() => createMut.mutate(undefined, {
            onSuccess: () => toast.success(t('treasury.categoryCreated')),
            onError: () => toast.error(t('treasury.errorCreatingCategory')),
          })}
          disabled={!newName.trim() || createMut.isPending}
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('treasury.create')}
        </Button>
      </div>

      {/* Category list */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('entities.type')}</TableHead>
              <TableHead>{t('treasury.system')}</TableHead>
              <TableHead className="w-24">{t('entities.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateMut.mutate({ id: cat.id, name: editName }, {
                          onSuccess: () => toast.success(t('treasury.categoryUpdated')),
                          onError: () => toast.error(t('treasury.errorUpdatingCategory')),
                        })}
                        disabled={!editName.trim()}
                        aria-label={t('common.save')}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} aria-label={t('common.cancel')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={cat.type === 'income' ? 'success' : 'secondary'}>
                    {cat.type === 'income' ? t('treasury.income') : t('treasury.expense')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {cat.is_system && <Badge variant="outline">{t('treasury.system')}</Badge>}
                </TableCell>
                <TableCell>
                  {!cat.is_system && editingId !== cat.id && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(cat)} aria-label={t('common.edit')}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          const ok = await confirm({
                            title: t('treasury.deleteCategory'),
                            description: t('treasury.confirmDeleteCategory'),
                            confirmLabel: t('common.delete'),
                            variant: 'destructive',
                          })
                          if (!ok) return
                          deleteMut.mutate(cat.id, {
                            onSuccess: () => toast.success(t('treasury.categoryDeleted')),
                            onError: () => toast.error(t('treasury.errorDeletingCategory')),
                          })
                        }}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!categories || categories.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t('treasury.noCategories')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
