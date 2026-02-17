import { MemberDirectory } from '@/core/identity/components/MemberDirectory'

export function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Miembros</h1>
          <p className="text-sm text-muted-foreground">Directorio de miembros de la comunidad</p>
        </div>
      </div>
      <MemberDirectory />
    </div>
  )
}
