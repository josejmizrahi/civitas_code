import { DecisionArchive } from '@/core/accountability/components/DecisionArchive'
import { PageHeader } from '@/shared/components/ui/page-header'

export function DecisionArchivePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Archivo de Decisiones"
        subtitle="Historial completo de propuestas, resultados y seguimiento de implementación."
      />
      <DecisionArchive />
    </div>
  )
}
