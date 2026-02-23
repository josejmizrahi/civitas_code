import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { hasPermission, type Role } from '@/shared/types'
import {
  LayoutDashboard, Users, Wallet, Vote, FileText, Settings, Shield,
  Search, BarChart3, Building2, Home, BookOpen, User, ChevronRight,
  Receipt, Megaphone, Calendar,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface CommandItem {
  id: string
  label: string
  section: string
  icon: typeof Search
  path?: string
  action?: () => void
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { community, currentMember } = useCommunityContext()
  const { data: members } = useMembers()
  const { data: proposals } = useProposals(undefined)

  const userRole = (currentMember?.role ?? 'observador') as Role
  const isAdmin = hasPermission(userRole, 'admin')
  const isResidential = community?.type === 'residential'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const items = useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = [
      { id: 'nav-dashboard', label: 'Dashboard', section: 'Navegación', icon: LayoutDashboard, path: path('dashboard'), keywords: 'inicio home' },
      { id: 'nav-community', label: 'Comunidad', section: 'Navegación', icon: Users, path: path('community'), keywords: 'miembros directorio' },
      { id: 'nav-treasury', label: 'Finanzas', section: 'Navegación', icon: Wallet, path: path('treasury'), keywords: 'tesoreria pagos cobros balance' },
      { id: 'nav-governance', label: 'Gobernanza', section: 'Navegación', icon: Vote, path: path('governance'), keywords: 'propuestas votaciones asambleas' },
      { id: 'nav-documents', label: 'Documentos', section: 'Navegación', icon: FileText, path: path('documents'), keywords: 'archivos actas' },
      { id: 'nav-census', label: 'Censo', section: 'Navegación', icon: BarChart3, path: path('census'), keywords: 'estadisticas metricas' },
      { id: 'nav-entities', label: 'Proveedores', section: 'Navegación', icon: Building2, path: path('entities'), keywords: 'partes relacionadas contratistas' },
      { id: 'nav-rules', label: 'Reglamento', section: 'Navegación', icon: BookOpen, path: path('rules'), keywords: 'normas reglas' },
      { id: 'nav-my-payments', label: 'Mi Estado de Cuenta', section: 'Navegación', icon: Receipt, path: path('my-payments'), keywords: 'pagos cuotas obligaciones' },
      { id: 'nav-announcements', label: 'Anuncios', section: 'Navegación', icon: Megaphone, path: path('announcements'), keywords: 'avisos comunicados noticias' },
      { id: 'nav-calendar', label: 'Calendario', section: 'Navegación', icon: Calendar, path: path('calendar'), keywords: 'eventos fechas agenda asambleas pagos' },
    ]

    if (isResidential) {
      nav.push({ id: 'nav-residential', label: 'Residencial', section: 'Navegación', icon: Home, path: path('residential'), keywords: 'unidades mantenimiento areas comunes' })
    }

    if (isAdmin) {
      nav.push(
        { id: 'nav-settings', label: 'Configuración', section: 'Administración', icon: Settings, path: path('settings'), keywords: 'ajustes reglas categorias' },
        { id: 'nav-vigilancia', label: 'Vigilancia', section: 'Administración', icon: Shield, path: path('vigilancia'), keywords: 'comite supervision auditoria' },
      )
    }

    const memberItems: CommandItem[] = (members ?? []).slice(0, 50).map((m) => ({
      id: `member-${m.id}`,
      label: m.full_name || m.email || 'Sin nombre',
      section: 'Miembros',
      icon: User,
      path: path(`members/${m.id}`),
      keywords: `${m.email || ''} ${m.role || ''}`,
    }))

    const proposalItems: CommandItem[] = (proposals ?? []).slice(0, 20).map((p) => ({
      id: `proposal-${p.id}`,
      label: p.title,
      section: 'Propuestas',
      icon: Vote,
      path: path(`governance/${p.id}`),
      keywords: `${p.type || ''} ${p.status || ''}`,
    }))

    return [...nav, ...memberItems, ...proposalItems]
  }, [path, isAdmin, isResidential, members, proposals])

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 15)
    const q = query.toLowerCase()
    return items.filter((item) => {
      const searchText = `${item.label} ${item.section} ${item.keywords || ''}`.toLowerCase()
      return q.split(' ').every((word) => searchText.includes(word))
    }).slice(0, 15)
  }, [query, items])

  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const arr = map.get(item.section) || []
      arr.push(item)
      map.set(item.section, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  const flatFiltered = useMemo(() => filtered, [filtered])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const executeItem = useCallback((item: CommandItem) => {
    setOpen(false)
    if (item.path) navigate(item.path)
    else if (item.action) item.action()
  }, [navigate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % flatFiltered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + flatFiltered.length) % flatFiltered.length)
    } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      e.preventDefault()
      executeItem(flatFiltered[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [flatFiltered, selectedIndex, executeItem])

  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Búsqueda rápida">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
        <div className="relative z-50 w-full max-w-lg rounded-xl border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Search input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Buscar secciones, miembros, propuestas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {flatFiltered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados para "{query}"</p>
            ) : (
              sections.map(([section, sectionItems]) => (
                <div key={section} className="mb-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{section}</p>
                  {sectionItems.map((item) => {
                    flatIndex++
                    const isSelected = flatIndex === selectedIndex
                    const Icon = item.icon
                    const idx = flatIndex
                    return (
                      <button
                        key={item.id}
                        data-selected={isSelected}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        )}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-70" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {isSelected && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> navegar
              <span className="mx-2">·</span>
              <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> abrir
            </span>
            <span>
              <kbd className="rounded border bg-muted px-1 font-mono">⌘K</kbd> abrir/cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
