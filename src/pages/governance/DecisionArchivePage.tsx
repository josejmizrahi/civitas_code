import { DecisionArchive } from '@/core/accountability/components/DecisionArchive'

export function DecisionArchivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Archivo de Decisiones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historial completo de propuestas, resultados y seguimiento de implementación.
        </p>
      </div>
      <DecisionArchive />
    </div>
  )
}
