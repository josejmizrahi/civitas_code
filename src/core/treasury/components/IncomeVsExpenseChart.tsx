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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`} />
        <Legend />
        <Bar dataKey="income" name="Ingresos" fill="#16a34a" />
        <Bar dataKey="expenses" name="Egresos" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}
