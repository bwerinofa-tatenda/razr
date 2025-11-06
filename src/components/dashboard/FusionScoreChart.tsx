import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

interface FusionScoreChartProps {
  fusionScore?: {
    analysis: number;
    execution: number;
    tradeManagement: number;
    riskManagement: number;
    mindset: number;
    overall: number;
  } | null;
}

export default function FusionScoreChart({ fusionScore }: FusionScoreChartProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const data = fusionScore ? [
    { subject: 'Analysis', A: fusionScore.analysis, fullMark: 100 },
    { subject: 'Execution', A: fusionScore.execution, fullMark: 100 },
    { subject: 'Trade Management', A: fusionScore.tradeManagement, fullMark: 100 },
    { subject: 'Risk Management', A: fusionScore.riskManagement, fullMark: 100 },
    { subject: 'Mindset', A: fusionScore.mindset, fullMark: 100 }
  ] : [
    { subject: 'Analysis', A: 50, fullMark: 100 },
    { subject: 'Execution', A: 50, fullMark: 100 },
    { subject: 'Trade Management', A: 50, fullMark: 100 },
    { subject: 'Risk Management', A: 50, fullMark: 100 },
    { subject: 'Mindset', A: 50, fullMark: 100 }
  ];

  const score = fusionScore?.overall || 50.0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative">
        <h3 className="text-base font-normal text-gray-900 dark:text-white">Fusion Score</h3>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="h-4 w-4 cursor-help text-gray-400" />
          {showTooltip && (
            <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
              Fusion Score - Overall trading performance metric combining analysis, execution, trade management, risk management, and mindset (scale: 0-100)
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" strokeOpacity={0.3} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 10 }}
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
        <p className="text-base text-gray-600 dark:text-gray-400">
          Your Fusion Score:{' '}
          <span className="font-bold text-green-600">{score.toFixed(1)}</span>
        </p>
      </div>
    </div>
  );
}
