import { useState, useRef, useEffect } from 'react'
import {
  RULES_CATALOG,
  getRuleCatalogEntry,
  CATEGORY_LABELS,
} from '@/shared/config/rules-catalog'
import type { CommunityRules } from '@/shared/types/rules'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Search, BookOpen, Scale } from 'lucide-react'

interface RulePickerProps {
  rules: CommunityRules
  value: string | null
  onChange: (ruleId: string | null) => void
  label?: string
  placeholder?: string
}

export function RulePicker({
  rules,
  value: selectedRuleId,
  onChange,
  label = 'Regla a modificar',
  placeholder = 'Buscar regla que quieres cambiar...',
}: RulePickerProps) {
  const [ruleSearch, setRuleSearch] = useState('')
  const [showRulePicker, setShowRulePicker] = useState(false)
  const rulePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rulePickerRef.current && !rulePickerRef.current.contains(e.target as Node)) {
        setShowRulePicker(false)
      }
    }
    if (showRulePicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showRulePicker])

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-4 w-4" />
        {label}
      </Label>
      <div className="relative" ref={rulePickerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={selectedRuleId ? (getRuleCatalogEntry(selectedRuleId)?.label ?? ruleSearch) : ruleSearch}
            onChange={(e) => {
              setRuleSearch(e.target.value)
              onChange(null)
              setShowRulePicker(true)
            }}
            onFocus={() => setShowRulePicker(true)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        {showRulePicker && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-y-auto">
            {(['governance', 'treasury', 'identity'] as const).map((cat) => {
              const catRules = RULES_CATALOG.filter(
                (r) =>
                  r.category === cat &&
                  (!ruleSearch ||
                    r.label.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                    r.description.toLowerCase().includes(ruleSearch.toLowerCase()))
              )
              if (catRules.length === 0) return null
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {catRules.map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                      onClick={() => {
                        onChange(rule.id)
                        setRuleSearch('')
                        setShowRulePicker(false)
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{rule.label}</span>
                        <p className="text-xs text-muted-foreground truncate">{rule.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                        {rule.format(rules)}
                      </Badge>
                    </button>
                  ))}
                </div>
              )
            })}
            {RULES_CATALOG.filter(
              (r) =>
                !ruleSearch ||
                r.label.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                r.description.toLowerCase().includes(ruleSearch.toLowerCase())
            ).length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No se encontraron reglas
              </div>
            )}
          </div>
        )}
      </div>
      {selectedRuleId && (() => {
        const rule = getRuleCatalogEntry(selectedRuleId)
        if (!rule) return null
        return (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{rule.label}</span>
              <Badge variant="secondary" className="text-[10px]">
                {CATEGORY_LABELS[rule.category]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{rule.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Valor actual:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {rule.format(rules)}
              </Badge>
            </div>
            {rule.legalRef && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                <Scale className="h-3 w-3" />
                {rule.legalRef}
              </p>
            )}
          </div>
        )
      })()}
    </div>
  )
}
