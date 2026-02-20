import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import { getCommunity, getCurrentMember, getUserCommunities } from '@/core/identity/services/identity.service'
import type { Community, Member } from '@/core/identity/types'
import { useToast } from '@/shared/components/ui/toast'

// ============================================
// Auth Context
// ============================================
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { info: toastInfo } = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setSession(null)
      setUser(null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const hadUser = !!user
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'PASSWORD_RECOVERY' && !window.location.pathname.includes('/reset-password')) {
        // Full-page redirect is intentional here: this event fires on initial
        // load from the email link, before the SPA router is ready.
        window.location.href = '/reset-password'
      }

      if (event === 'SIGNED_OUT' && hadUser) {
        toastInfo('Tu sesión ha finalizado')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Community Context (enriched)
// ============================================
interface CommunityContextType {
  communityId: string | null
  community: Community | null
  currentMember: Member | null
  userCommunities: Community[]
  communityLoading: boolean
  communityError: string | null
  setCommunityId: (id: string | null) => void
  refreshCommunities: () => void
}

const CommunityContext = createContext<CommunityContextType | null>(null)

export function useCommunityContext() {
  const ctx = useContext(CommunityContext)
  if (!ctx) throw new Error('useCommunityContext must be used within CommunityProvider')
  return ctx
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { error: toastError } = useToast()
  const [communityId, setCommunityIdState] = useState<string | null>(() => {
    return localStorage.getItem('ryve_community_id')
  })
  const [community, setCommunity] = useState<Community | null>(null)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityError, setCommunityError] = useState<string | null>(null)

  const handleSetCommunityId = (id: string | null) => {
    setCommunityIdState(id)
    if (id) {
      localStorage.setItem('ryve_community_id', id)
    } else {
      localStorage.removeItem('ryve_community_id')
      setCommunity(null)
      setCurrentMember(null)
    }
  }

  const refreshCommunities = useCallback(() => {
    if (!user) return
    getUserCommunities(user.id)
      .then((data) => {
        setCommunityError(null)
        setUserCommunities(data)
      })
      .catch((err) => {
        const msg = err?.message || 'Error al cargar comunidades'
        setCommunityError(msg)
        toastError(msg)
      })
  }, [user, toastError])

  // Fetch user communities list on login
  useEffect(() => {
    refreshCommunities()
  }, [refreshCommunities])

  // Auto-select if user has exactly one community and none is selected
  useEffect(() => {
    if (userCommunities.length === 1 && !communityId) {
      queueMicrotask(() => handleSetCommunityId(userCommunities[0].id))
    }
  }, [userCommunities, communityId])

  // Fetch community and current member when communityId or user changes
  useEffect(() => {
    if (!communityId || !user) {
      queueMicrotask(() => {
        setCommunity(null)
        setCurrentMember(null)
      })
      return
    }

    let cancelled = false
    queueMicrotask(() => setCommunityLoading(true))

    Promise.all([
      getCommunity(communityId),
      getCurrentMember(communityId, user.id),
    ])
      .then(([comm, member]) => {
        if (!cancelled) {
          setCommunityError(null)
          setCommunity(comm)
          setCurrentMember(member)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.message || 'Error al cargar comunidad'
          setCommunityError(msg)
          toastError(msg)
          setCommunity(null)
          setCurrentMember(null)
          handleSetCommunityId(null)
        }
      })
      .finally(() => {
        if (!cancelled) setCommunityLoading(false)
      })

    return () => { cancelled = true }
  }, [communityId, user])

  return (
    <CommunityContext.Provider
      value={{
        communityId,
        community,
        currentMember,
        userCommunities,
        communityLoading,
        communityError,
        setCommunityId: handleSetCommunityId,
        refreshCommunities,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}
