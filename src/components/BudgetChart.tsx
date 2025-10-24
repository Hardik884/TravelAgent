import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

interface BudgetData {
  total: number;
  breakdown: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

interface Props {
  data: BudgetData;
}

export default function BudgetChart({ data }: Props) {
  return (
    <div className="glass-scope rounded-xl p-6 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6">Budget Breakdown</h3>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {data.breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '8px' }}
                formatter={(value: number) => `₹${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          <div className="mb-4">
            <p className="muted text-sm">Total Budget</p>
            <p className="text-3xl font-bold text-white">₹{data.total.toLocaleString()}</p>
          </div>
          {data.breakdown.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-white/6 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-100">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">₹{item.value.toLocaleString()}</p>
                <p className="text-gray-300 text-xs">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
