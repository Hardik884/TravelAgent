import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="budget-chart-container"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="budget-icon">
          <span className="text-2xl">💰</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Budget Breakdown</h3>
          <p className="text-sm text-gray-400">Smart allocation for your trip</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-72 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="budget-total-center">
              <p className="text-sm text-gray-400 mb-1">Total Budget</p>
              <p className="text-3xl font-bold text-white">₹{data.total.toLocaleString()}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
                paddingAngle={2}
              >
                {data.breakdown.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    stroke="rgba(15,23,42,0.8)"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(15,23,42,0.95)', 
                  border: '1px solid rgba(20,184,166,0.3)',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                labelStyle={{ color: '#5eead4', fontWeight: 'bold', marginBottom: '4px' }}
                itemStyle={{ color: '#e6eef4' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        
        <div className="space-y-3">
          {data.breakdown.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="budget-item group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="budget-color-indicator"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <span className="text-white font-semibold group-hover:text-teal-200 transition-colors">
                    {item.name}
                  </span>
                  <div className="budget-progress-bar mt-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                      className="budget-progress-fill"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">₹{item.value.toLocaleString()}</p>
                <p className="budget-percentage">{item.percentage}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
