import { Outlet } from 'react-router-dom'
import { Shield } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Shield className="h-8 w-8" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">RYVE</h1>
          <p className="text-sm text-muted-foreground">Infrastructure for Network States</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
