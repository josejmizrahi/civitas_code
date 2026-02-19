import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartData {
  month: string
  income: number
  expenses: number
}

interface Props {
  data: ChartData[]
}

export function IncomeVsExpenseChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos suficientes para la gráfica.</p>
  }

  return (
    <div className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: -10, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} />
          <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Ingresos" fill="#16a34a" />
          <Bar dataKey="expenses" name="Egresos" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
