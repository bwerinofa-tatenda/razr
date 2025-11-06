import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTrades } from '../utils/api';
import { calculateMetrics, formatCurrency, formatPercentage, getGreeting } from '../utils/calculations';
import { 
  calculateFusionScore, 
  getDashboardCumulativePnL
} from '../utils/dashboardCalculations';
import CleanMetricCard from '../components/dashboard/CleanMetricCard';
import FusionScoreChart from '../components/dashboard/FusionScoreChart';
import CumulativePnLChart from '../components/dashboard/CumulativePnLChart';
import CleanCalendar from '../components/dashboard/CleanCalendar';
import AccountSelector from '../components/common/AccountSelector';

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [trades, setTrades] = useState<any[]>([]); // Filtered trades for metrics/graphs
  const [allTrades, setAllTrades] = useState<any[]>([]); // Unfiltered trades for calendar
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [fusionScore, setFusionScore] = useState<any>(null);
  const [cumulativePnLData, setCumulativePnLData] = useState<any[]>([]);

  // Reference colors
  const COLORS = {
    primary: '#36C99E', // Teal/mint green
    negative: '#FF7070' // Soft red/salmon
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, selectedAccount, dateRange]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Try to get real data first, fall back to mock data
      let originalTradesData: any[] = [];
      
      try {
        const realTrades = await getTrades(user.id);
        originalTradesData = realTrades;
      } catch (apiError) {

        // Fallback to mock data from public directory
        const response = await fetch('/data/mockTrades.json');
        originalTradesData = await response.json();
      }
      
      // Store original trades for calendar (unfiltered)
      setAllTrades(originalTradesData);
      
      // Create filtered copy for metrics and graphs
      let filteredTradesData = [...originalTradesData];
      
      // Filter by account if selected
      if (selectedAccount && selectedAccount !== 'all') {
        filteredTradesData = filteredTradesData.filter(trade => trade.account_number === selectedAccount);
      }
      
      // Filter by date range if selected
      if (dateRange !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate: Date;
        
        if (dateRange === 'day') {
          startDate = startOfToday;
        } else if (dateRange === 'week') {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
          startDate = new Date(startOfToday);
          startDate.setDate(startDate.getDate() - daysToMonday);
        } else if (dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          startDate = new Date(0); // Beginning of time for 'all'
        }
        
        filteredTradesData = filteredTradesData.filter(trade => {
          const tradeDate = new Date(trade.time);
          return tradeDate >= startDate;
        });
      }
      
      setTrades(filteredTradesData);
      
      // Calculate all metrics using filtered data
      const calculatedMetrics = calculateMetrics(filteredTradesData);
      setMetrics(calculatedMetrics);
      
      // Calculate Fusion Score using filtered data
      const fusionScoreData = calculateFusionScore(filteredTradesData);
      setFusionScore(fusionScoreData);
      
      // Get cumulative P&L data using filtered data
      const cumulativeData = getDashboardCumulativePnL(filteredTradesData);
      setCumulativePnLData(cumulativeData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set fallback data in case of any error
      setMetrics({
        netPnL: 1137,
        profitFactor: 2.8,
        winRate: 62.5,
        totalTrades: 8,
        winningTrades: 5,
        losingTrades: 3
      });
      setFusionScore({
        analysis: 75,
        execution: 70,
        tradeManagement: 68,
        riskManagement: 72,
        mindset: 74,
        overall: 72
      });
      setCumulativePnLData([
        { date: '10/18/25', value: 250 },
        { date: '10/19/25', value: 180 },
        { date: '10/20/25', value: 405 },
        { date: '10/21/25', value: 397 },
        { date: '10/22/25', value: 572 },
        { date: '10/23/25', value: 847 },
        { date: '10/24/25', value: 787 },
        { date: '10/25/25', value: 1137 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{getGreeting(user?.user_metadata?.name)}!</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setDateRange('day')}
            className={`px-4 py-2 text-sm font-normal rounded-md transition-colors ${
              dateRange === 'day'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm font-normal rounded-md transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm font-normal rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 text-sm font-normal rounded-md transition-colors ${
              dateRange === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Account Selector */}
      <AccountSelector value={selectedAccount} onChange={setSelectedAccount} />
      </div>

      {/* Top Section - Three Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net P&L Card */}
        <CleanMetricCard
          type="netpnl"
          title="Net P&L"
          value={formatCurrency(metrics?.netPnL || 0)}
          count={metrics?.totalTrades || 0}
          tooltip="Net Profit & Loss - Total profit minus total losses"
        />

        {/* Profit Factor Card */}
        <CleanMetricCard
          type="profitfactor"
          title="Profit Factor"
          value={(metrics?.profitFactor || 0).toFixed(2)}
          progress={Math.min(100, ((metrics?.profitFactor || 0) / 3) * 100)}
          tooltip="Profit Factor - Ratio of gross profit to gross loss"
        />

        {/* Trade Win % Card */}
        <CleanMetricCard
          type="winrate"
          title="Trade Win %"
          value={formatPercentage(metrics?.winRate || 0)}
          counts={{ success: metrics?.winningTrades || 0, failure: metrics?.losingTrades || 0 }}
          pieData={[
            { value: metrics?.winRate || 0, color: COLORS.primary },
            { value: 100 - (metrics?.winRate || 0), color: COLORS.negative }
          ]}
          tooltip="Trade Win Percentage - Percentage of winning trades"
        />
      </div>

      {/* Middle Section - Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FusionScoreChart fusionScore={fusionScore} />
        <CumulativePnLChart data={cumulativePnLData} />
      </div>

      {/* Bottom Section - Trading Calendar */}
      <CleanCalendar trades={allTrades} />
    </div>
  );
}
