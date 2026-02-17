import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './providers'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { InviteAcceptPage } from '@/pages/auth/InviteAcceptPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { MembersPage } from '@/pages/members/MembersPage'
import { TreasuryPage } from '@/pages/treasury/TreasuryPage'
import { IngestionPage } from '@/pages/ingestion/IngestionPage'
import { GovernancePage } from '@/pages/governance/GovernancePage'
import { ProposalDetailPage } from '@/pages/governance/ProposalDetailPage'
import { AssemblyDetailPage } from '@/pages/governance/AssemblyDetailPage'
import { ResidentialPage } from '@/pages/residential/ResidentialPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { CensusPage } from '@/pages/census/CensusPage'
import { DocumentsPage } from '@/pages/documents/DocumentsPage'
import { OnboardingWizard } from '@/pages/onboarding/OnboardingWizard'
import { EntitiesPage } from '@/pages/entities/EntitiesPage'
import { EntityDetailPage } from '@/pages/entities/EntityDetailPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { MemberDetailPage } from '@/pages/members/MemberDetailPage'
import { useCommunityContext } from './providers'
import { hasPermission, type Role } from '@/shared/types'
import type { ReactNode } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

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

function LandingRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Cargando..." fullPage />
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

function RoleGuard({ requiredRole, children }: { requiredRole: string; children: ReactNode }) {
  const { currentMember } = useCommunityContext()
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

        {/* Auth routes */}
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Reset password (needs auth session from email link) */}
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Invitation acceptance (standalone, no layout) */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />

        {/* Onboarding wizard (standalone, no AppLayout) */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:memberId" element={<MemberDetailPage />} />
          <Route path="/treasury" element={<TreasuryPage />} />
          <Route path="/ingestion" element={<RoleGuard requiredRole="tesorero"><IngestionPage /></RoleGuard>} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/governance/assemblies/:assemblyId" element={<AssemblyDetailPage />} />
          <Route path="/governance/:proposalId" element={<ProposalDetailPage />} />
          <Route path="/residential" element={<ResidentialPage />} />
          <Route path="/census" element={<CensusPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/entities" element={<EntitiesPage />} />
          <Route path="/entities/:entityId" element={<EntityDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<RoleGuard requiredRole="admin"><SettingsPage /></RoleGuard>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
