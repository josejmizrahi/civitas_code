import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './providers'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { CommunitySlugLayout } from './CommunitySlugLayout'
import { DashboardRedirect } from './DashboardRedirect'
import { MinimalAuthenticatedLayout } from '@/layouts/MinimalAuthenticatedLayout'
const LandingPage = lazy(() => import('@/pages/landing/LandingPage').then(m => ({ default: m.LandingPage })))
const WhitepaperPage = lazy(() => import('@/pages/whitepaper/WhitepaperPage').then(m => ({ default: m.WhitepaperPage })))
import { useCommunityContext } from './providers'
import { hasPermission, type CommunityType, type Role } from '@/shared/types'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

// Lazy-loaded pages (heavy, code-split into separate chunks)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const InviteAcceptPage = lazy(() => import('@/pages/auth/InviteAcceptPage').then(m => ({ default: m.InviteAcceptPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MemberDetailPage = lazy(() => import('@/pages/members/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })))
const TreasuryPage = lazy(() => import('@/pages/treasury/TreasuryPage').then(m => ({ default: m.TreasuryPage })))
const SpendRequestsPage = lazy(() => import('@/pages/treasury/SpendRequestsPage').then(m => ({ default: m.SpendRequestsPage })))
const SpendRequestNewPage = lazy(() => import('@/pages/treasury/SpendRequestNewPage').then(m => ({ default: m.SpendRequestNewPage })))
const SpendRequestDetailPage = lazy(() => import('@/pages/treasury/SpendRequestDetailPage').then(m => ({ default: m.SpendRequestDetailPage })))

const GovernancePage = lazy(() => import('@/pages/governance/GovernancePage').then(m => ({ default: m.GovernancePage })))
const ProposalDetailPage = lazy(() => import('@/pages/governance/ProposalDetailPage').then(m => ({ default: m.ProposalDetailPage })))
const AssemblyDetailPage = lazy(() => import('@/pages/governance/AssemblyDetailPage').then(m => ({ default: m.AssemblyDetailPage })))

const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CensusPage = lazy(() => import('@/pages/census/CensusPage').then(m => ({ default: m.CensusPage })))
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })))
const EntitiesPage = lazy(() => import('@/pages/entities/EntitiesPage').then(m => ({ default: m.EntitiesPage })))
const EntityDetailPage = lazy(() => import('@/pages/entities/EntityDetailPage').then(m => ({ default: m.EntityDetailPage })))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const VigilanciaPage = lazy(() => import('@/pages/governance/VigilanciaPage').then(m => ({ default: m.VigilanciaPage })))
const DecisionArchivePage = lazy(() => import('@/pages/governance/DecisionArchivePage').then(m => ({ default: m.DecisionArchivePage })))
const RulesPage = lazy(() => import('@/pages/rules/RulesPage').then(m => ({ default: m.RulesPage })))
const AuditLogPage = lazy(() => import('@/pages/settings/AuditLogPage').then(m => ({ default: m.AuditLogPage })))
const ResidentialPage = lazy(() => import('@/pages/residential/ResidentialPage').then(m => ({ default: m.ResidentialPage })))
const OnboardingWizard = lazy(() => import('@/pages/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })))
const MultiCommunityPage = lazy(() => import('@/pages/admin/MultiCommunityPage').then(m => ({ default: m.MultiCommunityPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const CommunitiesPage = lazy(() => import('@/pages/communities/CommunitiesPage').then(m => ({ default: m.CommunitiesPage })))
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage').then(m => ({ default: m.CommunityPage })))
const MyPaymentsPage = lazy(() => import('@/pages/treasury/MyPaymentsPage').then(m => ({ default: m.MyPaymentsPage })))
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const AnnouncementsPage = lazy(() => import('@/pages/announcements/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })))
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingSpinner message="Cargando..." className="py-20" />}>{children}</Suspense>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/communities'} replace />
  }
  return <>{children}</>
}

function ProtectedRouteWithReturnUrl({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function LandingRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (user) return <Navigate to="/communities" replace />
  return <LazyPage><LandingPage /></LazyPage>
}

function RoleGuard({ requiredRole, children }: { requiredRole: Role; children: ReactNode }) {
  const { currentMember, community, communityLoading } = useCommunityContext()
  if (communityLoading) return <LoadingSpinner message="Cargando..." className="py-20" />
  const role = (currentMember?.role ?? 'observador') as Role
  if (!hasPermission(role, requiredRole as Role)) {
    const slug = community?.slug
    const to = slug ? `/c/${slug}/dashboard` : '/communities'
    return <Navigate to={to} replace />
  }
  return <>{children}</>
}

function CommunityTypeGuard({ requiredType, children }: { requiredType: CommunityType; children: ReactNode }) {
  const { community, communityLoading } = useCommunityContext()
  if (communityLoading) return <LoadingSpinner message="Cargando..." className="py-20" />
  if (!community || community.type !== requiredType) {
    const to = community?.slug ? `/c/${community.slug}/dashboard` : '/communities'
    return <Navigate to={to} replace />
  }
  return <>{children}</>
}

/**
 * Catch-all for unauthenticated users.
 * Renders the landing page for "/" or the 404 page for everything else.
 * IMPORTANT: This must NOT be wrapped in AuthLayout — the landing page
 * is a full-width page and AuthLayout constrains content to max-w-md.
 */
function UnauthenticatedCatchAll() {
  const { pathname } = useLocation()
  if (pathname === '/' || pathname === '') {
    return <LandingRedirect />
  }
  return <LazyPage><NotFoundPage /></LazyPage>
}

/** Protected 404: redirect /dashboard to slug dashboard; else show 404. */
function ProtectedCatchAll() {
  const { pathname } = useLocation()
  if (pathname === '/' || pathname === '') {
    return <Navigate to="/communities" replace />
  }
  if (pathname === '/dashboard') {
    return <DashboardRedirect />
  }
  return <LazyPage><NotFoundPage /></LazyPage>
}

/** Inside /c/:slug: unknown path → redirect to community dashboard. */
function SlugCatchAll() {
  const { slug } = useParams<{ slug: string }>()
  const to = slug ? `/c/${slug}/dashboard` : '/communities'
  return <Navigate to={to} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — public */}
        <Route path="/" element={<LandingRedirect />} />
        <Route path="/whitepaper" element={<LazyPage><WhitepaperPage /></LazyPage>} />

        {/* Auth routes */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
          <Route path="/register" element={<LazyPage><RegisterPage /></LazyPage>} />
          <Route path="/forgot-password" element={<LazyPage><ForgotPasswordPage /></LazyPage>} />
        </Route>

        {/* Reset password (needs auth session from email link) */}
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<LazyPage><ResetPasswordPage /></LazyPage>} />
        </Route>

        {/* Invitation acceptance (standalone, no layout) */}
        <Route path="/invite/:token" element={<LazyPage><InviteAcceptPage /></LazyPage>} />

        {/* Onboarding wizard (standalone, no AppLayout) */}
        <Route path="/onboarding" element={<ProtectedRoute><LazyPage><OnboardingWizard /></LazyPage></ProtectedRoute>} />

        {/* Protected: routes without community (profile, communities) */}
        <Route element={<ProtectedRouteWithReturnUrl><MinimalAuthenticatedLayout /></ProtectedRouteWithReturnUrl>}>
          <Route path="/profile" element={<LazyPage><ProfilePage /></LazyPage>} />
          <Route path="/communities" element={<LazyPage><CommunitiesPage /></LazyPage>} />
        </Route>

        {/* Redirect /dashboard to /c/:slug/dashboard or /communities */}
        <Route path="/dashboard" element={<ProtectedRouteWithReturnUrl><DashboardRedirect /></ProtectedRouteWithReturnUrl>} />

        {/* Community-scoped routes: /c/:slug/... */}
        <Route path="/c/:slug" element={<ProtectedRouteWithReturnUrl><CommunitySlugLayout /></ProtectedRouteWithReturnUrl>}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />

            {/* Comunidad */}
            <Route path="community" element={<LazyPage><CommunityPage /></LazyPage>} />
            <Route path="members" element={<Navigate to="../community" replace />} />
            <Route path="members/:memberId" element={<LazyPage><MemberDetailPage /></LazyPage>} />

            {/* Finanzas */}
            <Route path="treasury" element={<LazyPage><TreasuryPage /></LazyPage>} />
            <Route path="treasury/requests" element={<LazyPage><SpendRequestsPage /></LazyPage>} />
            <Route path="treasury/requests/new" element={<LazyPage><SpendRequestNewPage /></LazyPage>} />
            <Route path="treasury/requests/:id" element={<LazyPage><SpendRequestDetailPage /></LazyPage>} />
            <Route path="entities" element={<LazyPage><EntitiesPage /></LazyPage>} />
            <Route path="entities/:entityId" element={<LazyPage><EntityDetailPage /></LazyPage>} />

            {/* Gobernanza */}
            <Route path="governance" element={<LazyPage><GovernancePage /></LazyPage>} />
            <Route path="governance/assemblies/:assemblyId" element={<LazyPage><AssemblyDetailPage /></LazyPage>} />
            <Route path="governance/archive" element={<LazyPage><DecisionArchivePage /></LazyPage>} />
            <Route path="governance/:proposalId" element={<LazyPage><ProposalDetailPage /></LazyPage>} />
            <Route path="governance/assemblies" element={<Navigate to="governance" replace />} />
            <Route path="rules" element={<LazyPage><RulesPage /></LazyPage>} />

            {/* Vigilancia (top-level) */}
            <Route path="vigilancia" element={<RoleGuard requiredRole="comite_vigilancia"><LazyPage><VigilanciaPage /></LazyPage></RoleGuard>} />
            <Route path="governance/vigilancia" element={<Navigate to="../vigilancia" replace />} />

            {/* Configuración */}
            <Route path="settings" element={<RoleGuard requiredRole="admin"><LazyPage><SettingsPage /></LazyPage></RoleGuard>} />
            <Route path="settings/audit" element={<RoleGuard requiredRole="admin"><LazyPage><AuditLogPage /></LazyPage></RoleGuard>} />

            {/* Vertical-specific */}
            <Route
              path="residential"
              element={<CommunityTypeGuard requiredType="residential"><LazyPage><ResidentialPage /></LazyPage></CommunityTypeGuard>}
            />

            {/* Pagos (fintech integration, reconciliación, dispersiones) */}
            <Route path="payments" element={<RoleGuard requiredRole="admin"><LazyPage><PaymentsPage /></LazyPage></RoleGuard>} />

            {/* Mi estado de cuenta (acceso directo) */}
            <Route path="my-payments" element={<LazyPage><MyPaymentsPage /></LazyPage>} />

            {/* Anuncios + Calendario */}
            <Route path="announcements" element={<LazyPage><AnnouncementsPage /></LazyPage>} />
            <Route path="calendar" element={<LazyPage><CalendarPage /></LazyPage>} />

            {/* Misc */}
            <Route path="census" element={<LazyPage><CensusPage /></LazyPage>} />
            <Route path="documents" element={<LazyPage><DocumentsPage /></LazyPage>} />
            <Route path="admin/communities" element={<RoleGuard requiredRole="platform_admin"><LazyPage><MultiCommunityPage /></LazyPage></RoleGuard>} />
            <Route path="*" element={<SlugCatchAll />} />
          </Route>
        </Route>

        {/* Authenticated catch-all (e.g. /members, /treasury without slug) */}
        <Route path="*" element={<ProtectedRouteWithReturnUrl><ProtectedCatchAll /></ProtectedRouteWithReturnUrl>} />

        {/* Unauthenticated catch-all — NOT wrapped in AuthLayout so the landing page renders full-width */}
        <Route path="*" element={<UnauthenticatedCatchAll />} />
      </Routes>
    </BrowserRouter>
  )
}
