import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Avatar } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Building2, LogOut } from 'lucide-react'
import { useTheme } from '@/shared/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

/**
 * Minimal layout for routes that don't require a community context: /profile, /communities.
 * Header with logo (link to /communities), theme toggle, user, logout.
 */
export function MinimalAuthenticatedLayout() {
  const { user, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
        <Link to="/communities" className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          Civitas
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title={resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/profile">
            <Avatar name={user?.user_metadata?.full_name || user?.email || '?'} size="sm" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
