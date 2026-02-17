import { Link } from 'react-router-dom'
import { buttonVariants } from '@/shared/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">
          Pagina no encontrada
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          La pagina que buscas no existe o fue movida. Verifica la URL o regresa
          al inicio.
        </p>
      </div>
      <Link to="/dashboard" className={buttonVariants({ variant: 'default' })}>
        Volver al inicio
      </Link>
    </div>
  )
}
