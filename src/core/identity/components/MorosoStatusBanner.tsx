import { useCommunityContext } from '@/app/providers'
import { useMemberDebt } from '../hooks/useMoroso'
import { formatCurrency } from '@/shared/lib/utils'
import { AlertTriangle, Ban, UserX, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'

// ---------------------------------------------------------------------------
// Restriction label map (Spanish)
// ---------------------------------------------------------------------------

const restrictionLabels: Record<string, { label: string; icon: typeof Ban }> = {
  vote: { label: 'No puede votar', icon: Ban },
  be_elected: { label: 'No puede ser electo', icon: UserX },
  quorum_excluded: { label: 'Excluido del quórum', icon: UsersRound },
}

// ---------------------------------------------------------------------------
// MorosoStatusBanner
// Shows at the top of the dashboard when the current user is moroso.
// ---------------------------------------------------------------------------

export function MorosoStatusBanner() {
  const { currentMember } = useCommunityContext()

  // Only render if user is moroso
  const isMoroso = (currentMember as any)?.financial_standing === 'moroso'

  const { data: debt } = useMemberDebt(
    isMoroso && currentMember ? currentMember.id : '',
  )

  if (!isMoroso || !currentMember) return null

  const restrictions = debt?.restrictions ?? []

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-red-800">
              Estado: Moroso
            </h3>
            <p className="text-sm text-red-700">
              Tienes cuotas vencidas que exceden los umbrales permitidos.
              {debt && debt.total_debt > 0 && (
                <> Deuda total: <span className="font-semibold">{formatCurrency(debt.total_debt)}</span></>
              )}
            </p>
          </div>

          {debt && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-red-700">
              {debt.ordinary_unpaid > 0 && (
                <span>Cuotas ordinarias pendientes: <span className="font-semibold">{debt.ordinary_unpaid}</span></span>
              )}
              {debt.extraordinary_unpaid > 0 && (
                <span>Cuotas extraordinarias pendientes: <span className="font-semibold">{debt.extraordinary_unpaid}</span></span>
              )}
            </div>
          )}

          {restrictions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {restrictions.map((r: string) => {
                const info = restrictionLabels[r]
                if (!info) return null
                const Icon = info.icon
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                  >
                    <Icon className="h-3 w-3" />
                    {info.label}
                  </span>
                )
              })}
            </div>
          )}

          <div>
            <Link to="/treasury">
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                Ver mis adeudos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
