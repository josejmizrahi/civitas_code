import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { BarChart3 } from 'lucide-react'
import type { Vote, VoteSummary, VotingOption } from '../types'
import type { VotingModel } from '@/shared/types'

interface Props {
  votes: Vote[]
  voteSummary: VoteSummary | undefined
  votingModel: VotingModel
  votingOptions?: VotingOption[]
}

const SIMPLE_COLORS: Record<string, string> = {
  yes: '#22c55e',
  no: '#ef4444',
  abstain: '#9ca3af',
}

const CONSENSUS_COLORS: Record<string, string> = {
  agree: '#22c55e',
  disagree: '#f59e0b',
  abstain: '#9ca3af',
  block: '#ef4444',
}

const OPTION_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6',
]

const CONSENSUS_LABELS: Record<string, string> = {
  agree: 'De acuerdo',
  disagree: 'En desacuerdo',
  abstain: 'Abstención',
  block: 'Bloqueo',
}

export function VotingVisualization({ votes, voteSummary, votingModel, votingOptions }: Props) {
  if (!voteSummary || voteSummary.total === 0) return null

  const model = votingModel || 'simple'

  if (model === 'multiple_choice' && votingOptions) {
    return <MultipleChoiceChart votes={votes} votingOptions={votingOptions} />
  }

  // Simple or consensus → Pie chart
  const data = model === 'consensus'
    ? buildConsensusData(votes)
    : buildSimpleData(voteSummary)

  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Resultados de Votación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${value} peso${value !== 1 ? 's' : ''}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Stats sidebar */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Participación:</span>{' '}
              <span className="font-bold">{(voteSummary.participation_pct * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Quórum:</span>{' '}
              <span className={voteSummary.quorum_met ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                {voteSummary.quorum_met ? 'Alcanzado' : 'No alcanzado'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Mayoría:</span>{' '}
              <span className={voteSummary.majority_met ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                {voteSummary.majority_met ? 'Alcanzada' : 'No alcanzada'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total votos:</span>{' '}
              <span className="font-bold">{voteSummary.total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function buildSimpleData(summary: VoteSummary) {
  const data = []
  if (summary.yes > 0) data.push({ name: 'A favor', value: summary.yes, color: SIMPLE_COLORS.yes })
  if (summary.no > 0) data.push({ name: 'En contra', value: summary.no, color: SIMPLE_COLORS.no })
  if (summary.abstain > 0) data.push({ name: 'Abstención', value: summary.abstain, color: SIMPLE_COLORS.abstain })
  return data
}

function buildConsensusData(votes: Vote[]) {
  const counts: Record<string, number> = { agree: 0, disagree: 0, abstain: 0, block: 0 }
  for (const v of votes) {
    const w = v.weight || 1
    if (v.value in counts) counts[v.value] += w
  }

  const data = []
  if (counts.agree > 0) data.push({ name: CONSENSUS_LABELS.agree, value: counts.agree, color: CONSENSUS_COLORS.agree })
  if (counts.disagree > 0) data.push({ name: CONSENSUS_LABELS.disagree, value: counts.disagree, color: CONSENSUS_COLORS.disagree })
  if (counts.abstain > 0) data.push({ name: CONSENSUS_LABELS.abstain, value: counts.abstain, color: CONSENSUS_COLORS.abstain })
  if (counts.block > 0) data.push({ name: CONSENSUS_LABELS.block, value: counts.block, color: CONSENSUS_COLORS.block })
  return data
}

function MultipleChoiceChart({ votes, votingOptions }: { votes: Vote[]; votingOptions: VotingOption[] }) {
  // Count votes per option
  const optionCounts: Record<string, number> = {}
  for (const v of votes) {
    optionCounts[v.value] = (optionCounts[v.value] ?? 0) + (v.weight || 1)
  }

  const data = votingOptions.map((opt, idx) => {
    const optionValue = `option_${idx + 1}`
    return {
      name: opt.label,
      votos: optionCounts[optionValue] ?? 0,
      fill: OPTION_COLORS[idx % OPTION_COLORS.length],
    }
  })

  // Sort by votes descending
  data.sort((a, b) => b.votos - a.votos)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Resultados de Votación Múltiple
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => [`${value} voto${value !== 1 ? 's' : ''}`, 'Votos']} />
            <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
