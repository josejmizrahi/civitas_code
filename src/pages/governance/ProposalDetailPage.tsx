import { useParams, Link } from 'react-router-dom'
import { ProposalDetail } from '@/core/governance/components/ProposalDetail'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function ProposalDetailPage() {
  const { proposalId: id } = useParams<{ proposalId: string }>()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/governance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Detalle de Propuesta</h1>
      </div>

      {id ? (
        <ProposalDetail proposalId={id} />
      ) : (
        <p className="text-muted-foreground">Propuesta no encontrada.</p>
      )}
    </div>
  )
}
