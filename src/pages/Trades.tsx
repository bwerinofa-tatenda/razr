import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTrades, deleteTrade } from '../utils/api';
import { formatCurrency, calculateSystemQualityNumber } from '../utils/calculations';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, BarChart3 } from 'lucide-react';
import AccountSelector from '../components/common/AccountSelector';

// Types
interface Trade {
  id: string;
  asset: string;
  asset_type: string;
  trade_type: string;
  size: number;
  session: string;
  duration: string;
  outcome: string;
  entry_tag: string;
  emotion: string;
  pnl: number;
  time: string;
  account_number?: string;
  system_quality_number: number;
}

// Reports Section Component
function ReportsSection({ 
  filteredData,
  columnFilters 
}: {
  filteredData: Trade[];
  columnFilters: ColumnFiltersState;
}) {
  // Calculate comprehensive trading metrics
  const tradingMetrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        totalPnl: 0,
        avgTradePnl: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        winningDays: 0,
        losingDays: 0,
        avgDailyPnl: 0,
        systemQualityAverage: 0,
        winRate: 0,
        profitFactor: 0
      };
    }

    const winningTrades = filteredData.filter(t => t.outcome === 'win');
    const losingTrades = filteredData.filter(t => t.outcome === 'loss');
    const breakEvenTrades = filteredData.filter(t => t.outcome === 'break_even');
    
    const totalPnl = filteredData.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningPnl = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losingPnl = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    // Group trades by day to calculate winning/losing days
    const tradesByDay = filteredData.reduce((acc, trade) => {
      const day = new Date(trade.time).toDateString();
      if (!acc[day]) {
        acc[day] = { trades: [], dailyPnl: 0 };
      }
      acc[day].trades.push(trade);
      acc[day].dailyPnl += trade.pnl || 0;
      return acc;
    }, {} as Record<string, { trades: Trade[], dailyPnl: number }>);
    
    const winningDays = Object.values(tradesByDay).filter(day => day.dailyPnl > 0).length;
    const losingDays = Object.values(tradesByDay).filter(day => day.dailyPnl < 0).length;
    
    // Calculate unique trading days for average daily P&L
    const uniqueTradingDays = Object.keys(tradesByDay).length;
    const avgDailyPnl = uniqueTradingDays > 0 ? totalPnl / uniqueTradingDays : 0;
    
    // System quality average
    const systemQualitySum = filteredData.reduce((sum, t) => sum + (t.system_quality_number || 0), 0);
    const systemQualityAverage = filteredData.length > 0 ? systemQualitySum / filteredData.length : 0;
    
    // Longs and Shorts calculations
    const winningLongs = winningTrades.filter(t => t.trade_type === 'Long').length;
    const winningShorts = winningTrades.filter(t => t.trade_type === 'Short').length;
    const losingLongs = losingTrades.filter(t => t.trade_type === 'Long').length;
    const losingShorts = losingTrades.filter(t => t.trade_type === 'Short').length;
    
    // Day of week analysis for charts
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekData = dayNames.map(dayName => {
      const dayTrades = filteredData.filter(t => {
        const tradeDay = new Date(t.time).toLocaleDateString('en-US', { weekday: 'long' });
        return tradeDay === dayName;
      });
      
      const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningDaysInDay = dayTrades.filter(t => t.outcome === 'win').length;
      const losingDaysInDay = dayTrades.filter(t => t.outcome === 'loss').length;
      
      return {
        day: dayName.substring(0, 3), // Short form: Mon, Tue, etc.
        fullDay: dayName,
        totalTrades: dayTrades.length,
        winningDays: winningDaysInDay,
        losingDays: losingDaysInDay,
        netPnl: dayPnl,
        avgPnl: dayTrades.length > 0 ? dayPnl / dayTrades.length : 0
      };
    }).filter(d => d.totalTrades > 0); // Only show days with trades

    return {
      totalTrades: filteredData.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      totalPnl,
      avgTradePnl: filteredData.length > 0 ? totalPnl / filteredData.length : 0,
      avgWinningTrade: winningTrades.length > 0 ? winningPnl / winningTrades.length : 0,
      avgLosingTrade: losingTrades.length > 0 ? losingPnl / losingTrades.length : 0,
      winningDays,
      losingDays,
      avgDailyPnl,
      systemQualityAverage,
      winningLongs,
      winningShorts,
      losingLongs,
      losingShorts,
      winRate: filteredData.length > 0 ? (winningTrades.length / filteredData.length) * 100 : 0,
      profitFactor: losingPnl > 0 ? winningPnl / losingPnl : winningPnl > 0 ? Infinity : 0,
      dayOfWeekData
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">

      {/* Stats Panel - Single Card with Two Columns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column: Winning Days Metrics */}
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {tradingMetrics.winningDays}
              </div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">Winning Days</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {tradingMetrics.winningDays + tradingMetrics.losingDays > 0 
                  ? ((tradingMetrics.winningDays / (tradingMetrics.winningDays + tradingMetrics.losingDays)) * 100).toFixed(1)
                  : 0}% of trading days
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Gain:</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(filteredData.filter(t => t.outcome === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Gain:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {tradingMetrics.winningDays > 0 ? formatCurrency(filteredData.filter(t => t.outcome === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0) / tradingMetrics.winningDays) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Winning Trades:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{tradingMetrics.winningTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Winning Trade:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(tradingMetrics.avgWinningTrade)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {tradingMetrics.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Longs:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{tradingMetrics.winningLongs}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Shorts:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{tradingMetrics.winningShorts}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Quality Number:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {tradingMetrics.systemQualityAverage.toFixed(1)}/5
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Losing Days Metrics */}
          <div className="space-y-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-6">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                {tradingMetrics.losingDays}
              </div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">Losing Days</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {tradingMetrics.winningDays + tradingMetrics.losingDays > 0 
                  ? ((tradingMetrics.losingDays / (tradingMetrics.winningDays + tradingMetrics.losingDays)) * 100).toFixed(1)
                  : 0}% of trading days
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Loss:</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">
                  {formatCurrency(-Math.abs(filteredData.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0)))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Loss:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {tradingMetrics.losingDays > 0 ? formatCurrency(filteredData.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0) / tradingMetrics.losingDays) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Losing Trades:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{tradingMetrics.losingTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Losing Trade:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(-Math.abs(tradingMetrics.avgLosingTrade))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Loss Rate:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {(100 - tradingMetrics.winRate).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Longs:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{tradingMetrics.losingLongs}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Shorts:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{tradingMetrics.losingShorts}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Quality Number:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {tradingMetrics.systemQualityAverage.toFixed(1)}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trade Distribution by Day of Week</h3>
          {tradingMetrics.dayOfWeekData.length > 0 ? (
            <div className="space-y-3">
              {tradingMetrics.dayOfWeekData.map((day) => {
                const maxValue = Math.max(...tradingMetrics.dayOfWeekData.map(d => Math.max(d.winningDays, d.losingDays)));
                const winningWidth = maxValue > 0 ? (day.winningDays / maxValue) * 100 : 0;
                const losingWidth = maxValue > 0 ? (day.losingDays / maxValue) * 100 : 0;
                
                return (
                  <div key={day.day} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.fullDay}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total: {day.totalTrades} trades
                      </div>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-green-500 rounded-l-lg transition-all duration-300"
                        style={{ width: `${winningWidth}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full bg-yellow-500 transition-all duration-300"
                        style={{ left: `${winningWidth}%`, width: `${losingWidth}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {day.winningDays}W / {day.losingDays}L
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No trade data available for day-of-week analysis
            </div>
          )}
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance by Day of Week (Net P&L)</h3>
          {tradingMetrics.dayOfWeekData.length > 0 ? (
            <div className="space-y-3">
              {tradingMetrics.dayOfWeekData.map((day) => {
                const maxAbsValue = Math.max(...tradingMetrics.dayOfWeekData.map(d => Math.abs(d.netPnl)));
                const barWidth = maxAbsValue > 0 ? (Math.abs(day.netPnl) / maxAbsValue) * 100 : 0;
                const isPositive = day.netPnl >= 0;
                
                return (
                  <div key={day.day} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.fullDay}</span>
                      <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(day.netPnl)}
                      </span>
                    </div>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className={`absolute top-0 h-full rounded-lg transition-all duration-300 ${
                          isPositive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          [isPositive ? 'left' : 'right']: '50%',
                          width: `${barWidth}%`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {formatCurrency(day.netPnl)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No trade data available for performance analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Column Filter Component
function ColumnFilter({ 
  column, 
  values, 
  title 
}: { 
  column: any; 
  values: string[]; 
  title: string;
}) {
  const filterValue = column.getFilterValue() as string;
  
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <Filter className={`h-3 w-3 ${filterValue ? 'text-blue-500' : 'text-gray-400'}`} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 w-56 z-50"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Filter by {title}</span>
              {filterValue && (
                <button
                  onClick={() => column.setFilterValue(undefined)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {values.map(value => (
                <button
                  key={value}
                  onClick={() => column.setFilterValue(value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    filterValue === value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <Popover.Arrow className="fill-white dark:fill-gray-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Editable Button Component
function EditableButton({ 
  value, 
  options, 
  onValueChange, 
  className = '',
  type = 'text'
}: { 
  value: string; 
  options: string[]; 
  onValueChange: (newValue: string) => void; 
  className?: string;
  type?: 'badge' | 'text';
}) {
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
  
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={`text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors ${className}`}>
          {type === 'badge' ? (
            <span className={`px-2 py-1 rounded-full text-xs font-normal ${
              value === 'win'
                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                : value === 'loss'
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {displayValue}
            </span>
          ) : (
            <span className="text-sm">{displayValue}</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-48 z-50"
          sideOffset={5}
        >
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-2">
              Select {type === 'badge' ? 'Outcome' : 'Value'}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {options.map(option => (
                <button
                  key={option}
                  onClick={() => onValueChange(option)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    value === option
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <Popover.Arrow className="fill-white dark:fill-gray-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function Trades() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'reports'>('trades');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  // Handle URL parameters for date filtering
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (dateParam) {
      // Single date filter (for day selection)
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
        setEndDate(date);
      }
    } else if (startDateParam && endDateParam) {
      // Date range filter (for week/month selection)
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        setStartDate(startDate);
        setEndDate(endDate);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    loadTrades();
  }, [user, selectedAccount]);

  const loadTrades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let trades = await getTrades(user.id);
      
      // Filter by account if selected
      if (selectedAccount && selectedAccount !== 'all') {
        trades = trades.filter(trade => trade.account_number === selectedAccount);
      }
      
      // Calculate system_quality_number for each trade (display-only field)
      trades = trades.map(trade => ({
        ...trade,
        system_quality_number: calculateSystemQualityNumber(trade)
      }));
      
      setData(trades);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      await deleteTrade(id);
      setData(data.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade');
    }
  };

  const handleUpdateTrade = async (id: string, updates: any) => {
    try {
      await updateTrade(id, updates);
      // Reload data to reflect changes
      await loadTrades();
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Failed to update trade');
    }
  };

  // Quick date filter handlers
  const setQuickDateFilter = (type: string) => {
    const today = new Date();
    switch (type) {
      case 'today':
        setStartDate(startOfToday());
        setEndDate(endOfToday());
        break;
      case 'week':
        setStartDate(startOfWeek(today));
        setEndDate(endOfWeek(today));
        break;
      case 'month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case '3months':
        setStartDate(subMonths(today, 3));
        setEndDate(today);
        break;
      case '6months':
        setStartDate(subMonths(today, 6));
        setEndDate(today);
        break;
      case 'all':
        setStartDate(null);
        setEndDate(null);
        break;
    }
  };

  // Apply column filters to table data
  const columnFilteredData = useMemo(() => {
    if (columnFilters.length === 0) return data;
    
    return data.filter(trade => {
      return columnFilters.every(filter => {
        const { id, value } = filter;
        const tradeValue = trade[id as keyof Trade];
        return String(tradeValue) === value;
      });
    });
  }, [data, columnFilters]);

  // Filter data by date range and column filters
  const filteredData = useMemo(() => {
    let filtered = columnFilteredData;
    
    if (startDate && endDate) {
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.time);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
    }
    
    return filtered;
  }, [columnFilteredData, startDate, endDate]);

  // Get unique values for dropdown filters
  const uniqueAssetTypes = useMemo(() => Array.from(new Set(data.map(t => t.asset_type))).filter(Boolean), [data]);
  const uniqueSessions = useMemo(() => Array.from(new Set(data.map(t => t.session))).filter(Boolean), [data]);
  const uniqueEntryTags = useMemo(() => Array.from(new Set(data.map(t => t.entry_tag))).filter(Boolean), [data]);

  // Calculate total PnL from filtered data
  const totalPnl = useMemo(() => {
    return filteredData.reduce((total, trade) => total + (trade.pnl || 0), 0);
  }, [filteredData]);

  // Define columns
  const columns = useMemo(() => [
    columnHelper.accessor('asset', {
      header: 'Asset',
      size: 100,
      cell: info => <span className="font-medium text-sm truncate" title={info.getValue()}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('time', {
      header: 'Date',
      cell: info => {
        const timeValue = info.getValue();
        const date = new Date(timeValue);
        return <span className="text-sm">{format(date, 'yyyy-MM-dd')}</span>;
      },
      size: 100,
    }),
    columnHelper.accessor('time', {
      header: 'Time',
      cell: info => {
        const timeValue = info.getValue();
        const date = new Date(timeValue);
        return <span className="text-sm">{format(date, 'HH:mm')}</span>;
      },
      size: 80,
    }),
    columnHelper.accessor('asset_type', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Asset Type
            {column.getIsSorted() ? (
              column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : <ChevronDown className="h-4 w-4 opacity-30" />}
          </button>
          <ColumnFilter column={column} values={uniqueAssetTypes} title="Asset Type" />
        </div>
      ),
      cell: info => {
        const trade = info.row.original;
        const currentValue = info.getValue();
        const options = ['FX', 'Futures', 'Metals', 'Commodities'];
        
        return (
          <EditableButton
            value={currentValue}
            options={options}
            onValueChange={(newValue) => handleUpdateTrade(trade.id, { asset_type: newValue })}
            type="text"
          />
        );
      },
      size: 120,
      filterFn: 'equals',
    }),
    columnHelper.accessor('trade_type', {
      header: 'Trade',
      cell: info => (
        <span className={`px-2 py-1 rounded-full text-xs font-normal ${
          info.getValue() === 'Long' 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
            : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
        }`}>
          {info.getValue()}
        </span>
      ),
      size: 80,
    }),
    columnHelper.accessor('size', {
      header: 'Size',
      cell: info => <span className="text-sm">{info.getValue()}</span>,
      size: 80,
    }),
    columnHelper.accessor('session', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Session
            {column.getIsSorted() ? (
              column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : <ChevronDown className="h-4 w-4 opacity-30" />}
          </button>
          <ColumnFilter column={column} values={uniqueSessions} title="Session" />
        </div>
      ),
      cell: info => {
        const trade = info.row.original;
        const currentValue = info.getValue();
        const options = ['Asia', 'London 1', 'London 2', 'London 3', 'New York 1', 'New York 2', 'New York 3'];
        
        return (
          <EditableButton
            value={currentValue}
            options={options}
            onValueChange={(newValue) => handleUpdateTrade(trade.id, { session: newValue })}
            type="text"
          />
        );
      },
      size: 110,
      filterFn: 'equals',
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: info => <span className="text-sm">{info.getValue()}</span>,
      size: 100,
    }),
    columnHelper.accessor('outcome', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Outcome
            {column.getIsSorted() ? (
              column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : <ChevronDown className="h-4 w-4 opacity-30" />}
          </button>
          <ColumnFilter column={column} values={['win', 'loss', 'break_even']} title="Outcome" />
        </div>
      ),
      cell: info => {
        const trade = info.row.original;
        const outcome = info.getValue();
        const options = ['win', 'loss', 'break_even'];
        
        return (
          <EditableButton
            value={outcome}
            options={options}
            onValueChange={(newValue) => handleUpdateTrade(trade.id, { outcome: newValue })}
            type="badge"
          />
        );
      },
      size: 110,
      filterFn: 'equals',
    }),
    columnHelper.accessor('entry_tag', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Confirmation
            {column.getIsSorted() ? (
              column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : <ChevronDown className="h-4 w-4 opacity-30" />}
          </button>
          <ColumnFilter column={column} values={uniqueEntryTags} title="Entry Tag" />
        </div>
      ),
      cell: info => {
        const trade = info.row.original;
        const currentValue = info.getValue();
        const options = uniqueEntryTags;
        
        return (
          <EditableButton
            value={currentValue}
            options={options}
            onValueChange={(newValue) => handleUpdateTrade(trade.id, { entry_tag: newValue })}
            type="text"
          />
        );
      },
      size: 120,
      filterFn: 'equals',
    }),
    columnHelper.accessor('system_quality_number', {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            System Quality Number
            {column.getIsSorted() ? (
              column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : <ChevronDown className="h-4 w-4 opacity-30" />}
          </button>
          <div className="relative group">
            <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              How well does this trade line up with the CPC framework
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      ),
      cell: info => {
        const quality = info.getValue();
        return (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {quality}/5
          </span>
        );
      },
      size: 140,
    }),
    columnHelper.accessor('pnl', {
      header: 'Result',
      cell: info => {
        const pnl = info.getValue();
        return (
          <span className={`font-medium ${
            pnl > 0
              ? 'text-green-600 dark:text-green-400'
              : pnl < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {formatCurrency(pnl)}
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: props => (
        <div className="flex gap-2">
          <Link
            to={`/trades/${props.row.original.id}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={() => handleDelete(props.row.original.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ], [uniqueAssetTypes, uniqueSessions, uniqueEntryTags]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Create MUI theme based on current theme
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Removed MUI theme - using Tailwind CSS for styling

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
          {/* Header with Tabs */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'trades'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'reports'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </button>
              </div>
            </div>
            {activeTab === 'trades' && (
              <Link
                to="/trades/new"
                className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-normal shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trade
              </Link>
            )}
          </div>

          {/* Account Selector */}
          <AccountSelector value={selectedAccount} onChange={setSelectedAccount} />

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'trades' ? (
            <>
              {/* Date Range Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Quick Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Today', value: 'today' },
                    { label: 'This Week', value: 'week' },
                    { label: 'This Month', value: 'month' },
                    { label: '3 Months', value: '3months' },
                    { label: '6 Months', value: '6months' },
                    { label: 'All Time', value: 'all' },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setQuickDateFilter(value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        value === 'all' && !startDate
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Range:</span>
                <div className="flex flex-wrap gap-4 items-center">
                  <input
                    type="date"
                    value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    style={{ minWidth: 200 }}
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    style={{ minWidth: 200 }}
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Display */}
              {startDate && endDate && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing trades from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>

          {/* Trades Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          style={{ width: `${header.getSize()}px`, minWidth: `${header.getSize()}px`, maxWidth: `${header.getSize()}px` }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No trades found. <Link to="/trades/new" className="text-blue-500 hover:underline">Create your first trade</Link>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                            style={{ width: `${cell.column.getSize()}px`, minWidth: `${cell.column.getSize()}px`, maxWidth: `${cell.column.getSize()}px` }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                  
                  {/* Total Row */}
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                    <td colSpan={11} className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      Total:
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold">
                      <span className={`${
                        totalPnl > 0
                          ? 'text-green-600 dark:text-green-400'
                          : totalPnl < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {formatCurrency(totalPnl)}
                      </span>
                    </td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {table.getPageCount() > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} trades
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          ) : (
            <ReportsSection 
              filteredData={filteredData}
              columnFilters={columnFilters}
            />
          )}
    </div>
  );
}
