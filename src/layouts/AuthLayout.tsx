import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Civitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Infrastructure for Network States</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
