import React from 'react';
import { Info } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

export default function ZellaScoreChart() {
  const data = [
    { subject: 'Win %', A: 57, fullMark: 100 },
    { subject: 'Avg win/loss', A: 65, fullMark: 100 },
    { subject: 'Profit factor', A: 44, fullMark: 100 }
  ];

  const zellaScore = 52.0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-normal text-gray-900 dark:text-white">Zella Score</h3>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
          BETA
        </span>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar
              name="Score"
              dataKey="A"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Display */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your Zella Score:{' '}
          <span className="font-bold text-green-600">{zellaScore}</span>
        </p>
      </div>
    </div>
  );
}
