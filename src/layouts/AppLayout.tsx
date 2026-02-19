import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useCommunityContext } from '@/app/providers'
import { NoCommunityView } from '@/core/identity/components/NoCommunityView'
import { VERTICALS } from '@/shared/config/verticals'
import { hasPermission, type Role } from '@/shared/types'
import {
  LayoutDashboard,
  Users,
  Wallet,
  Vote,
  Upload,
  LogOut,
  Building2,
  Settings,
  BarChart3,
  FileText,
  ChevronsUpDown,
  Check,
  Plus,
  Menu,
  X,
  User,
  Shield,
  BookOpen,
} from 'lucide-react'
import { Avatar } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/shared/components/NotificationBell'
import { cn } from '@/shared/lib/utils'
import { PrivacyGate } from '@/core/privacy/components/PrivacyGate'
import { XpBar } from '@/core/gamification/components/XpBar'
import { StreakCounter } from '@/core/gamification/components/StreakCounter'
import { useMyGamification } from '@/core/gamification/hooks/useGamification'

const coreNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, minRole: 'observador' as Role },
  { name: 'Tesorería', href: '/treasury', icon: Wallet, minRole: 'observador' as Role },
  { name: 'Gobernanza', href: '/governance', icon: Vote, minRole: 'observador' as Role },
  { name: 'Reglamento', href: '/rules', icon: BookOpen, minRole: 'observador' as Role },
  { name: 'Miembros', href: '/members', icon: Users, minRole: 'observador' as Role },
  { name: 'Partes Relacionadas', href: '/entities', icon: Building2, minRole: 'observador' as Role },
  { name: 'Documentos', href: '/documents', icon: FileText, minRole: 'observador' as Role },
  { name: 'Censo', href: '/census', icon: BarChart3, minRole: 'observador' as Role },
  { name: 'Importar Datos', href: '/ingestion', icon: Upload, minRole: 'tesorero' as Role },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { communityId, community, currentMember, userCommunities, setCommunityId } = useCommunityContext()
  const navigate = useNavigate()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    if (switcherOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [switcherOpen])

  const handleSwitchCommunity = (id: string) => {
    setCommunityId(id)
    setSwitcherOpen(false)
  }

  const userRole = (currentMember?.role ?? 'observador') as Role
  const { data: gamProfile } = useMyGamification()

  // Build navigation: core items filtered by role + vertical items
  const navigation = [
    ...coreNavigation.filter((item) => hasPermission(userRole, item.minRole)),
  ]

  // Add vertical-specific nav items
  if (community?.type) {
    const vertical = VERTICALS[community.type]
    if (vertical?.navItems) {
      navigation.push(
        ...vertical.navItems.map((item) => ({
          ...item,
          minRole: 'observador' as Role,
        })),
      )
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    )

  return (
    <div className="flex h-screen">
      {/* Mobile top bar - only visible on mobile */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 truncate font-semibold">{community?.name || 'Civitas'}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Avatar name={user?.user_metadata?.full_name || user?.email || '?'} size="sm" className="shrink-0" />
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar-background transition-transform md:static md:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Community Switcher */}
        <div className="relative border-b" ref={switcherRef}>
          <div className="flex h-14 items-center gap-2">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex min-w-0 flex-1 items-center gap-2 px-4 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sidebar-primary">
                  {community?.name || 'Civitas'}
                </p>
                {community && (
                  <p className="truncate text-xs text-muted-foreground">
                    {currentMember?.role ? currentMember.role.charAt(0).toUpperCase() + currentMember.role.slice(1) : ''}
                  </p>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={closeMobileSidebar}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Dropdown */}
          {switcherOpen && (
            <div className="absolute left-2 right-2 top-[calc(100%+4px)] z-50 rounded-md border bg-popover p-1 shadow-lg">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Tus comunidades</p>
              {userCommunities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitchCommunity(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                    c.id === communityId && 'bg-accent'
                  )}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate flex-1 text-left">{c.name}</span>
                  {c.id === communityId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))}
              <div className="my-1 border-t" />
              <button
                onClick={() => {
                  setSwitcherOpen(false)
                  navigate('/onboarding')
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Nueva Comunidad
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={navLinkClassName}
              end={item.href === '/dashboard'}
              onClick={closeMobileSidebar}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </NavLink>
          ))}

          {/* Community settings - admin only */}
          {hasPermission(userRole, 'admin') && (
            <>
              <div className="my-2 border-t" />
              <NavLink
                to="/settings"
                className={navLinkClassName}
                onClick={closeMobileSidebar}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Admin Comunidad
              </NavLink>
            </>
          )}

          {/* Comite de Vigilancia — admin or comite_vigilancia only */}
          {(userRole === 'admin' || userRole === 'comite_vigilancia') && (
            <NavLink
              to="/governance/vigilancia"
              className={navLinkClassName}
              onClick={closeMobileSidebar}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Vigilancia
            </NavLink>
          )}
        </nav>

        {/* Level + Streak */}
        {gamProfile && communityId && (
          <div className="border-t px-3 py-2.5 space-y-1.5">
            <XpBar compact />
            <div className="flex items-center justify-between text-xs">
              {gamProfile.current_streak > 0 ? (
                <StreakCounter streak={gamProfile.current_streak} compact />
              ) : (
                <span className="text-muted-foreground">Empieza tu racha hoy</span>
              )}
              <span className="text-muted-foreground">
                {gamProfile.badges.length} logros
              </span>
            </div>
          </div>
        )}

        <div className="border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to="/profile"
              className="min-w-0 flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent/50 group"
            >
              <User className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-sidebar-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentMember?.role ? currentMember.role.charAt(0).toUpperCase() + currentMember.role.slice(1) : user?.email}
                </p>
              </div>
            </NavLink>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <PrivacyGate communityName={community?.name}>
          {!communityId ? (
            <NoCommunityView />
          ) : (
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          )}
        </PrivacyGate>
      </main>
    </div>
  )
}
