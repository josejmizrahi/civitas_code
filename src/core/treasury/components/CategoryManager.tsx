import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '../services/treasury.service'
import { supabase } from '@/shared/lib/supabase'
import type { Category } from '../types'
import type { CategoryType } from '@/shared/types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'

async function createCategory(communityId: string, name: string, type: CategoryType): Promise<Category> {
  const { data, error } = await (supabase.from('categories') as any)
    .insert({ community_id: communityId, name, type })
    .select()
    .single()
  if (error) throw error
  return data as Category
}

async function updateCategory(categoryId: string, name: string): Promise<Category> {
  const { data, error } = await (supabase.from('categories') as any)
    .update({ name })
    .eq('id', categoryId)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await (supabase.from('categories') as any)
    .delete()
    .eq('id', categoryId)
  if (error) throw error
}

export function CategoryManager() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  const toast = useToast()
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

  if (isLoading) return <LoadingSpinner message="Cargando categorías..." className="py-8" />

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="flex gap-2">
        <Input
          placeholder="Nombre de categoría"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Select value={newType} onChange={(e) => setNewType(e.target.value as CategoryType)} className="w-32">
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </Select>
        <Button
          onClick={() => createMut.mutate(undefined, {
            onSuccess: () => toast.success('Categoría creada exitosamente'),
            onError: () => toast.error('Error al crear categoría'),
          })}
          disabled={!newName.trim() || createMut.isPending}
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          Crear
        </Button>
      </div>

      {/* Category list */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
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
                          onSuccess: () => toast.success('Categoría actualizada'),
                          onError: () => toast.error('Error al actualizar categoría'),
                        })}
                        disabled={!editName.trim()}
                        aria-label="Guardar"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancelar">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={cat.type === 'income' ? 'success' : 'secondary'}>
                    {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {cat.is_system && <Badge variant="outline">Sistema</Badge>}
                </TableCell>
                <TableCell>
                  {!cat.is_system && editingId !== cat.id && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(cat)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('¿Eliminar esta categoría?')) deleteMut.mutate(cat.id, {
                            onSuccess: () => toast.success('Categoría eliminada'),
                            onError: () => toast.error('Error al eliminar categoría'),
                          })
                        }}
                        aria-label="Eliminar"
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
                  No hay categorías configuradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
