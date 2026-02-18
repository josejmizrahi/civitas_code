import { cn } from '@/shared/lib/utils'
import { ThumbsUp, ThumbsDown, Minus, HelpCircle } from 'lucide-react'
import type { SentimentSummary } from '../types'

interface Props {
  summary: SentimentSummary | undefined
  className?: string
}

export function ProConSummary({ summary, className }: Props) {
  if (!summary || summary.total_count === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed p-4 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          No hay comentarios aún. Sé el primero en opinar.
        </p>
      </div>
    )
  }

  const { pro_count, con_count, neutral_count, question_count, total_count } = summary
  const proPct = total_count > 0 ? (pro_count / total_count) * 100 : 0
  const conPct = total_count > 0 ? (con_count / total_count) * 100 : 0
  const neutralPct = total_count > 0 ? (neutral_count / total_count) * 100 : 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Sentiment bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {proPct > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${proPct}%` }}
          />
        )}
        {neutralPct > 0 && (
          <div
            className="bg-gray-400 transition-all duration-500"
            style={{ width: `${neutralPct}%` }}
          />
        )}
        {conPct > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${conPct}%` }}
          />
        )}
      </div>

      {/* Counts */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-green-700">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="font-medium">{pro_count} a favor</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="h-3.5 w-3.5" />
          <span className="font-medium">{neutral_count} neutral</span>
        </div>
        <div className="flex items-center gap-1 text-red-700">
          <ThumbsDown className="h-3.5 w-3.5" />
          <span className="font-medium">{con_count} en contra</span>
        </div>
        {question_count > 0 && (
          <div className="flex items-center gap-1 text-blue-700">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="font-medium">{question_count} preguntas</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {total_count} comentario{total_count !== 1 ? 's' : ''} en total
      </p>
    </div>
  )
}
