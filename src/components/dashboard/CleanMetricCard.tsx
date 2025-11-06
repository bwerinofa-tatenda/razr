import React, { useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface CleanMetricCardProps {
  type: 'netpnl' | 'profitfactor' | 'winrate';
  title: string;
  value: string;
  count?: string | number;
  counts?: { success: number; failure: number };
  progress?: number;
  tooltip?: string;
  pieData?: { value: number; color: string }[];
}

export default function CleanMetricCard({ 
  type,
  title, 
  value, 
  count,
  counts,
  progress,
  tooltip,
  pieData
}: CleanMetricCardProps) {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  // Colors from reference
  const COLORS = {
    primary: '#36C99E', // Teal/mint green
    negative: '#FF7070', // Soft red/salmon
    purple: '#A990D9', // Purple
    darkGray: '#1A1A1A', // Primary text
    mediumGray: '#666666', // Secondary text
    lightGray: '#E5E5E5' // Background for gauges
  };

  const renderNetPnLCard = () => (
    <>
      {/* Header with count pill */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 relative">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="h-4 w-4 cursor-help text-gray-600 dark:text-gray-400" />
            {showTooltip && tooltip && (
              <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                {tooltip}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
        {count && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {count}
          </span>
        )}
      </div>

      {/* Main value and action icon */}
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>
          {value}
        </p>
        <div 
          onClick={() => navigate('/trades')}
          className="w-10 h-10 rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: COLORS.purple }}
        >
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
      </div>
    </>
  );

  const renderProfitFactorCard = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 relative">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="h-4 w-4 cursor-help text-gray-600 dark:text-gray-400" />
          {showTooltip && tooltip && (
            <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
              {tooltip}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main value and semi-circular gauge */}
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        
        {/* Semi-circular gauge */}
        <div className="flex-shrink-0">
          <svg width="80" height="45" viewBox="0 0 80 45">
            {/* Background arc (red) */}
            <path
              d="M 10 40 A 30 30 0 0 1 70 40"
              fill="none"
              stroke={COLORS.negative}
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Progress arc (green) */}
            <path
              d="M 10 40 A 30 30 0 0 1 70 40"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(progress || 0) / 100 * 94.25} 94.25`}
            />
          </svg>
        </div>
      </div>
    </>
  );

  const renderWinRateCard = () => (
    <>
      {/* Header with win/loss counts */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 relative">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="h-4 w-4 cursor-help text-gray-600 dark:text-gray-400" />
            {showTooltip && tooltip && (
              <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                {tooltip}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
        {counts && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: COLORS.primary }}>{counts.success}</span>
            <span className="text-sm font-medium" style={{ color: COLORS.negative }}>{counts.failure}</span>
          </div>
        )}
      </div>

      {/* Main value and donut chart */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        
        {/* Donut chart */}
        {pieData && (
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '64px', height: '64px' }}>
            <ResponsiveContainer width={64} height={64}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx={32}
                  cy={32}
                  innerRadius={18}
                  outerRadius={26}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-700"
      style={{ 
        boxShadow: '0px 2px 5px rgba(0,0,0,0.05)',
        borderRadius: '8px'
      }}
    >
      {type === 'netpnl' && renderNetPnLCard()}
      {type === 'profitfactor' && renderProfitFactorCard()}
      {type === 'winrate' && renderWinRateCard()}
    </div>
  );
}
