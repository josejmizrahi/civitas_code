import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/toast'
import { useRecordAttendance } from '../hooks/useAssemblies'
import { UserCheck, UserX, Search, Save, Users } from 'lucide-react'
import type { AttendanceRecord } from '../types'

interface Props {
  assemblyId: string
  initialAttendance: AttendanceRecord[]
  memberList: Array<{ id: string; name: string; indiviso_pct: number }>
  disabled?: boolean
}

export function AttendanceManager({
  assemblyId,
  initialAttendance,
  memberList,
  disabled = false,
}: Props) {
  const toast = useToast()
  const recordAttendance = useRecordAttendance()
  const [search, setSearch] = useState('')

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    if (initialAttendance && initialAttendance.length > 0) {
      return initialAttendance
    }
    return memberList.map((m) => ({
      member_id: m.id,
      member_name: m.name,
      present: false,
      indiviso_pct: m.indiviso_pct,
    }))
  })

  const togglePresent = (memberId: string) => {
    if (disabled) return
    setAttendance((prev) =>
      prev.map((r) =>
        r.member_id === memberId
          ? {
              ...r,
              present: !r.present,
              checked_in_at: !r.present ? new Date().toISOString() : undefined,
            }
          : r
      )
    )
  }

  const markAllPresent = () => {
    if (disabled) return
    setAttendance((prev) =>
      prev.map((r) => ({
        ...r,
        present: true,
        checked_in_at: r.checked_in_at || new Date().toISOString(),
      }))
    )
  }

  const filteredAttendance = useMemo(() => {
    if (!search.trim()) return attendance
    const q = search.toLowerCase()
    return attendance.filter((r) => r.member_name.toLowerCase().includes(q))
  }, [attendance, search])

  const presentCount = attendance.filter((r) => r.present).length
  const totalCount = attendance.length
  const presentIndiviso = attendance
    .filter((r) => r.present)
    .reduce((sum, r) => sum + r.indiviso_pct, 0)
  const totalIndiviso = attendance.reduce((sum, r) => sum + r.indiviso_pct, 0)
  const quorumPct = totalIndiviso > 0 ? presentIndiviso / totalIndiviso : 0

  const handleSave = async () => {
    try {
      await recordAttendance.mutateAsync({ assemblyId, records: attendance })
      toast.success('Asistencia registrada exitosamente')
    } catch {
      toast.error('Error al registrar asistencia')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Control de Asistencia
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={presentCount > 0 ? 'success' : 'secondary'}>
              {presentCount}/{totalCount} presentes
            </Badge>
            <Badge variant="secondary">
              {(quorumPct * 100).toFixed(1)}% indiviso
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Marcar todos
              </Button>
              <Button size="sm" onClick={handleSave} disabled={recordAttendance.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {recordAttendance.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {filteredAttendance.map((record) => (
            <button
              key={record.member_id}
              type="button"
              disabled={disabled}
              onClick={() => togglePresent(record.member_id)}
              className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                record.present
                  ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                  : 'bg-card border hover:bg-muted/50'
              } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                {record.present ? (
                  <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <UserX className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={record.present ? 'font-medium' : 'text-muted-foreground'}>
                  {record.member_name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {record.indiviso_pct.toFixed(2)}% indiviso
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
