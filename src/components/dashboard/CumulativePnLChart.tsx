import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface CumulativePnLChartProps {
  data?: Array<{ date: string; value: number }>;
}

export default function CumulativePnLChart({ data: chartData }: CumulativePnLChartProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Enhanced dummy data with more realistic P&L progression
  const data = chartData || [
    { date: '10/18/25', value: 250 },
    { date: '10/19/25', value: 180 },
    { date: '10/20/25', value: 405 },
    { date: '10/21/25', value: 397 },
    { date: '10/22/25', value: 572 },
    { date: '10/23/25', value: 847 },
    { date: '10/24/25', value: 787 },
    { date: '10/25/25', value: 1137 }
  ];

  // Calculate dynamic domain for Y-axis
  const values = data.map(d => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const padding = Math.max(Math.abs(maxValue - minValue) * 0.2, 1000);
  const yMin = Math.floor((minValue - padding) / 1000) * 1000;
  const yMax = Math.ceil((maxValue + padding) / 1000) * 1000;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative">
        <h3 className="text-base font-normal text-gray-900 dark:text-white">
          Daily Net Cumulative P&L
        </h3>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="h-4 w-4 cursor-help text-gray-400" />
          {showTooltip && (
            <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
              Cumulative P&L - Running total of all profits and losses over time, showing overall trading performance
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                }
                return `$${value}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                'P&L'
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#colorPnL)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
