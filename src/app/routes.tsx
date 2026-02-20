import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './providers'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LandingPage } from '@/pages/landing/LandingPage'
import { WhitepaperPage } from '@/pages/whitepaper/WhitepaperPage'
import { useCommunityContext } from './providers'
import { hasPermission, type Role } from '@/shared/types'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

// Lazy-loaded pages (heavy, code-split into separate chunks)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const InviteAcceptPage = lazy(() => import('@/pages/auth/InviteAcceptPage').then(m => ({ default: m.InviteAcceptPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MembersPage = lazy(() => import('@/pages/members/MembersPage').then(m => ({ default: m.MembersPage })))
const MemberDetailPage = lazy(() => import('@/pages/members/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })))
const TreasuryPage = lazy(() => import('@/pages/treasury/TreasuryPage').then(m => ({ default: m.TreasuryPage })))
const IngestionPage = lazy(() => import('@/pages/ingestion/IngestionPage').then(m => ({ default: m.IngestionPage })))
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
const OnboardingWizard = lazy(() => import('@/pages/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

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
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (user) return <Navigate to="/dashboard" replace />
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
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

function RoleGuard({ requiredRole, children }: { requiredRole: string; children: ReactNode }) {
  const { currentMember, communityLoading } = useCommunityContext()
  if (communityLoading) return <LoadingSpinner message="Cargando..." className="py-20" />
  const role = (currentMember?.role ?? 'observador') as Role
  if (!hasPermission(role, requiredRole as Role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — public */}
        <Route path="/" element={<LandingRedirect />} />
        <Route path="/whitepaper" element={<WhitepaperPage />} />

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

        {/* Protected routes */}
        <Route element={<ProtectedRouteWithReturnUrl><AppLayout /></ProtectedRouteWithReturnUrl>}>
          <Route path="/dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
          <Route path="/members" element={<LazyPage><MembersPage /></LazyPage>} />
          <Route path="/members/:memberId" element={<LazyPage><MemberDetailPage /></LazyPage>} />
          <Route path="/treasury" element={<LazyPage><TreasuryPage /></LazyPage>} />
          <Route path="/ingestion" element={<RoleGuard requiredRole="tesorero"><LazyPage><IngestionPage /></LazyPage></RoleGuard>} />
          <Route path="/governance" element={<LazyPage><GovernancePage /></LazyPage>} />
          <Route path="/governance/assemblies/:assemblyId" element={<LazyPage><AssemblyDetailPage /></LazyPage>} />
          <Route path="/governance/vigilancia" element={<RoleGuard requiredRole="comite_vigilancia"><LazyPage><VigilanciaPage /></LazyPage></RoleGuard>} />
          <Route path="/governance/archive" element={<LazyPage><DecisionArchivePage /></LazyPage>} />
          <Route path="/governance/:proposalId" element={<LazyPage><ProposalDetailPage /></LazyPage>} />
          <Route path="/rules" element={<LazyPage><RulesPage /></LazyPage>} />

          <Route path="/census" element={<LazyPage><CensusPage /></LazyPage>} />
          <Route path="/documents" element={<LazyPage><DocumentsPage /></LazyPage>} />
          <Route path="/entities" element={<LazyPage><EntitiesPage /></LazyPage>} />
          <Route path="/entities/:entityId" element={<LazyPage><EntityDetailPage /></LazyPage>} />
          <Route path="/profile" element={<LazyPage><ProfilePage /></LazyPage>} />
          <Route path="/settings" element={<RoleGuard requiredRole="admin"><LazyPage><SettingsPage /></LazyPage></RoleGuard>} />
          <Route path="/settings/audit" element={<RoleGuard requiredRole="admin"><LazyPage><AuditLogPage /></LazyPage></RoleGuard>} />
          <Route path="/governance/assemblies" element={<Navigate to="/governance" replace />} />

          {/* Authenticated 404 — keeps sidebar visible */}
          <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
        </Route>

        {/* Unauthenticated 404 — same layout as login/register (AuthLayout uses Outlet) */}
        <Route path="*" element={<AuthLayout />}>
          <Route index element={<LazyPage><NotFoundPage /></LazyPage>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
