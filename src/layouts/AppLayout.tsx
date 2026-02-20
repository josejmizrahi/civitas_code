import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
  Ellipsis,
  Sun,
  Moon,
} from 'lucide-react'
import { Avatar } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/shared/components/NotificationBell'
import { cn } from '@/shared/lib/utils'
import { PrivacyGate } from '@/core/privacy/components/PrivacyGate'
import { useTheme } from '@/shared/hooks/useTheme'
import { XpBar } from '@/core/gamification/components/XpBar'
import { StreakCounter } from '@/core/gamification/components/StreakCounter'
import { useMyGamification } from '@/core/gamification/hooks/useGamification'

const coreNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, minRole: 'observador' as Role },
  { name: 'Tesoreria', href: '/treasury', icon: Wallet, minRole: 'observador' as Role },
  { name: 'Gobernanza', href: '/governance', icon: Vote, minRole: 'observador' as Role },
  { name: 'Reglamento', href: '/rules', icon: BookOpen, minRole: 'observador' as Role },
  { name: 'Miembros', href: '/members', icon: Users, minRole: 'observador' as Role },
  { name: 'Partes Relacionadas', href: '/entities', icon: Building2, minRole: 'observador' as Role },
  { name: 'Documentos', href: '/documents', icon: FileText, minRole: 'observador' as Role },
  { name: 'Censo', href: '/census', icon: BarChart3, minRole: 'observador' as Role },
  { name: 'Importar Datos', href: '/ingestion', icon: Upload, minRole: 'tesorero' as Role },
]

/* Bottom nav shows the 4 most important items + a "More" toggle */
const BOTTOM_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tesoreria', href: '/treasury', icon: Wallet },
  { name: 'Gobernanza', href: '/governance', icon: Vote },
  { name: 'Miembros', href: '/members', icon: Users },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const { communityId, community, currentMember, userCommunities, setCommunityId } = useCommunityContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  // Close sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Lock scroll when sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

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
  const { resolvedTheme, setTheme } = useTheme()

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

  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // Network error — still clear local state
    }
    localStorage.removeItem('civitas_community_id')
    queryClient.clear()
    navigate('/login')
  }

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    )

  const isBottomNavActive = (href: string) => location.pathname.startsWith(href)

  return (
    <div className="flex h-dvh flex-col overflow-x-hidden md:flex-row">
      {/* ============ MOBILE TOP BAR ============ */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-2"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="truncate text-sm font-semibold">{community?.name || 'Civitas'}</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <NavLink to="/profile" className="shrink-0">
            <Avatar name={user?.user_metadata?.full_name || user?.email || '?'} size="sm" />
          </NavLink>
        </div>
      </header>

      {/* ============ MOBILE SIDEBAR OVERLAY ============ */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ============ SIDEBAR ============ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar-background transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Community Switcher */}
        <div className="relative border-b" ref={switcherRef}>
          <div className="flex h-14 items-center">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {community?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sidebar-primary">
                  {community?.name || 'Civitas'}
                </p>
                {currentMember?.role && (
                  <p className="truncate text-xs text-muted-foreground capitalize">
                    {currentMember.role}
                  </p>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 shrink-0 md:hidden"
              onClick={closeMobileSidebar}
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Switcher Dropdown */}
          {switcherOpen && (
            <div className="absolute left-2 right-2 top-[calc(100%+4px)] z-50 rounded-lg border bg-popover p-1 shadow-lg">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Tus comunidades</p>
              {userCommunities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitchCommunity(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent',
                    c.id === communityId && 'bg-accent'
                  )}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
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
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Nueva Comunidad
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-0.5">
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
          </div>

          {/* Admin section */}
          {(hasPermission(userRole, 'admin') || userRole === 'comite_vigilancia') && (
            <>
              <div className="my-3 border-t" />
              <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">Administracion</p>
              <div className="flex flex-col gap-0.5">
                {hasPermission(userRole, 'admin') && (
                  <NavLink
                    to="/settings"
                    className={navLinkClassName}
                    onClick={closeMobileSidebar}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    Admin Comunidad
                  </NavLink>
                )}
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
              </div>
            </>
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

        {/* User section */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              onClick={closeMobileSidebar}
              className="min-w-0 flex-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent/50"
            >
              <Avatar name={user?.user_metadata?.full_name || user?.email || '?'} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {currentMember?.role || user?.email}
                </p>
              </div>
            </NavLink>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="shrink-0"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesion" className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-[4.5rem] md:pt-0 md:pb-0 min-w-0">
        <PrivacyGate communityName={community?.name}>
          {!communityId ? (
            <NoCommunityView />
          ) : (
            <div className="mx-auto max-w-7xl w-full p-4 md:p-6 overflow-hidden">
              <Outlet />
            </div>
          )}
        </PrivacyGate>
      </main>

      {/* ============ MOBILE BOTTOM NAVIGATION ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm pb-safe md:hidden">
        <div className="flex items-stretch justify-around">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = isBottomNavActive(item.href)
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 px-1"
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] leading-tight transition-colors',
                    active ? 'font-semibold text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </span>
              </NavLink>
            )
          })}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 px-1"
          >
            <Ellipsis className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] leading-tight text-muted-foreground">Mas</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
