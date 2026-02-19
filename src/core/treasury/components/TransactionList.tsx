import { useState } from 'react'
import { useTransactions, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { getCategories } from '../services/treasury.service'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency, formatDate, downloadAsCSV, downloadAsExcel } from '@/shared/lib/utils'
import { Pencil, Trash2, Check, X, Download, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyTransaction } from '../services/receipt.service'
import type { Transaction } from '../types'

export function TransactionList() {
  const [type, setType] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})

  const { communityId } = useCommunityContext()
  const { canManageTreasury } = usePermissions()
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()
  const toast = useToast()
  const queryClient = useQueryClient()

  const verifyMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'disputed' }) =>
      verifyTransaction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Estado de verificacion actualizado')
    },
    onError: () => toast.error('Error al verificar transaccion'),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const filters = {
    ...(type && { type }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  }

  const { data: transactions, isLoading } = useTransactions(
    Object.keys(filters).length > 0 ? filters : undefined
  )

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setEditValues({
      type: tx.type,
      amount: tx.amount,
      category_id: tx.category_id,
      description: tx.description,
      date: tx.date,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateTx.mutateAsync({ id: editingId, updates: editValues })
      setEditingId(null)
      setEditValues({})
    } catch {
      toast.error('Error al actualizar transacción')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      deleteTx.mutate(id, {
        onSuccess: () => toast.success('Transacción eliminada'),
        onError: () => toast.error('Error al eliminar transacción'),
      })
    }
  }

  const exportData = (transactions ?? []).map(tx => ({
    Fecha: tx.date,
    Tipo: tx.type === 'income' ? 'Ingreso' : 'Egreso',
    Monto: tx.amount,
    Categoria: tx.category_name || '',
    Descripcion: tx.description || '',
    Referencia: tx.external_ref || '',
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-full sm:w-40">
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Egresos</option>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 sm:w-40" placeholder="Desde" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 sm:w-40" placeholder="Hasta" />
          </div>
        </div>
        {(transactions?.length ?? 0) > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadAsCSV(exportData, 'transacciones')}>
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadAsExcel(exportData, 'transacciones', 'Transacciones')}>
              <Download className="mr-1 h-3 w-3" />
              Excel
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Verificacion</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              {canManageTreasury && <TableHead className="w-28">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 7 : 6} className="text-center text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 7 : 6} className="text-center text-muted-foreground">
                  Sin transacciones. Importa datos para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => {
                const isEditing = editingId === tx.id

                if (isEditing) {
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Input
                          type="date"
                          value={editValues.date || ''}
                          onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editValues.category_id || ''}
                          onChange={(e) => setEditValues({ ...editValues, category_id: e.target.value || null })}
                          className="w-36"
                        >
                          <option value="">Sin categoría</option>
                          {categories?.filter((c) => c.type === editValues.type).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editValues.type || ''}
                          onChange={(e) => setEditValues({ ...editValues, type: e.target.value as any })}
                          className="w-28"
                        >
                          <option value="income">Ingreso</option>
                          <option value="expense">Egreso</option>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell" />
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues.amount || ''}
                          onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateTx.isPending} aria-label="Guardar">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Cancelar">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description || '\u2014'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {tx.category_name ? (
                        <Badge variant="secondary">{tx.category_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={tx.type === 'income' ? 'success' : 'destructive'}>
                        {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(() => {
                        const vs = (tx as any).verification_status || 'reported'
                        if (vs === 'verified') return <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" />Verificada</Badge>
                        if (vs === 'disputed') return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Disputada</Badge>
                        return <Badge variant="secondary" className="gap-1"><ShieldQuestion className="h-3 w-3" />Reportada</Badge>
                      })()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    {canManageTreasury && (
                      <TableCell>
                        <div className="flex gap-1">
                          {(tx as any).verification_status !== 'verified' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => verifyMut.mutate({ id: tx.id, status: 'verified' })}
                              disabled={verifyMut.isPending}
                              aria-label="Verificar"
                              title="Verificar transaccion"
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => startEdit(tx)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(tx.id)} disabled={deleteTx.isPending} aria-label="Eliminar">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
