import { MemberDirectory } from '@/core/identity/components/MemberDirectory'
import { Button } from '@/shared/components/ui/button'
import { Download } from 'lucide-react'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { exportToExcel } from '@/shared/services/export.service'
import { formatDate } from '@/shared/lib/utils'

const roleLabels: Record<string, string> = {
  platform_admin: 'Admin Plataforma',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  comite_vigilancia: 'Comité de Vigilancia',
  miembro: 'Miembro',
  observador: 'Observador',
}

export function MembersPage() {
  const { data: members } = useMembers()

  const handleExport = () => {
    const rows = (members ?? []).map((m) => ({
      Nombre: m.full_name || '',
      Correo: m.email || '',
      Rol: roleLabels[m.role] || m.role,
      Estado: m.status === 'active' ? 'Activo' : m.status,
      'Fecha Ingreso': formatDate(m.joined_at),
    }))
    exportToExcel(rows, { filename: 'miembros', sheetName: 'Miembros' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Miembros</h1>
          <p className="text-sm text-muted-foreground">Directorio de miembros de la comunidad</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!members?.length}>
          <Download className="mr-1 h-4 w-4" />
          Exportar
        </Button>
      </div>
      <MemberDirectory />
    </div>
  )
}
