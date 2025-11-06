// Dashboard-specific calculations for all metrics

import { calculateMetrics } from './calculations';

// Calculate Fusion Score dimensions based on trade data
export const calculateFusionScore = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    return {
      analysis: 50,
      execution: 50,
      tradeManagement: 50,
      riskManagement: 50,
      mindset: 50,
      overall: 50
    };
  }

  // Filter trades that have scoring data
  const tradesWithScores = trades.filter(trade => 
    trade.analysis || trade.execution || trade.trade_management || trade.risk_management || trade.mindset
  );

  if (tradesWithScores.length === 0) {
    return {
      analysis: 50,
      execution: 50,
      tradeManagement: 50,
      riskManagement: 50,
      mindset: 50,
      overall: 50
    };
  }

  // Calculate average for each of the 5 scoring metrics
  const analysisScores = tradesWithScores.filter(t => t.analysis).map(t => t.analysis);
  const executionScores = tradesWithScores.filter(t => t.execution).map(t => t.execution);
  const tradeManagementScores = tradesWithScores.filter(t => t.trade_management).map(t => t.trade_management);
  const riskManagementScores = tradesWithScores.filter(t => t.risk_management).map(t => t.risk_management);
  const mindsetScores = tradesWithScores.filter(t => t.mindset).map(t => t.mindset);

  // Calculate averages (convert from 1-5 scale to 0-100 scale)
  const analysis = analysisScores.length > 0 
    ? (analysisScores.reduce((sum, score) => sum + score, 0) / analysisScores.length) * 20 
    : 50;
  
  const execution = executionScores.length > 0 
    ? (executionScores.reduce((sum, score) => sum + score, 0) / executionScores.length) * 20 
    : 50;
  
  const tradeManagement = tradeManagementScores.length > 0 
    ? (tradeManagementScores.reduce((sum, score) => sum + score, 0) / tradeManagementScores.length) * 20 
    : 50;
  
  const riskManagement = riskManagementScores.length > 0 
    ? (riskManagementScores.reduce((sum, score) => sum + score, 0) / riskManagementScores.length) * 20 
    : 50;
  
  const mindset = mindsetScores.length > 0 
    ? (mindsetScores.reduce((sum, score) => sum + score, 0) / mindsetScores.length) * 20 
    : 50;

  // Overall score is the average of the 5 averages
  const overall = (analysis + execution + tradeManagement + riskManagement + mindset) / 5;

  return {
    analysis: Math.round(analysis),
    execution: Math.round(execution),
    tradeManagement: Math.round(tradeManagement),
    riskManagement: Math.round(riskManagement),
    mindset: Math.round(mindset),
    overall: Math.round(overall)
  };
};

// Generate calendar data from trades (weekdays only)
export const generateCalendarData = (trades: any[], year: number, month: number) => {
  const daysData: { [key: number]: { date: number; pnl: number; trades: number } } = {};
  
  // Filter trades for the given month
  const monthTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.time);
    return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
  });
  
  // Group by day and calculate totals
  monthTrades.forEach(trade => {
    const day = new Date(trade.time).getDate();
    const dayOfWeek = new Date(trade.time).getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return;
    
    if (!daysData[day]) {
      daysData[day] = { date: day, pnl: 0, trades: 0 };
    }
    
    daysData[day].pnl += trade.pnl || 0;
    daysData[day].trades += 1;
  });
  
  return daysData;
};

// Calculate week totals from calendar data
export const calculateWeekTotals = (
  daysData: { [key: number]: { date: number; pnl: number; trades: number } },
  year: number,
  month: number
) => {
  const weeks: Array<{
    weekNum: number;
    pnl: number;
    trades: number;
    startDate: string;
    endDate: string;
  }> = [];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Adjust firstDay to Monday-based (0=Monday, 4=Friday)
  const firstWeekday = firstDay === 0 ? 6 : firstDay - 1;
  
  let weekNum = 0;
  let weekPnL = 0;
  let weekTrades = 0;
  let weekStartDay: number | null = null;
  let weekEndDay: number | null = null;
  let weekdayCount = firstWeekday;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month, day).getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    if (weekStartDay === null) weekStartDay = day;
    weekEndDay = day;
    
    const dayData = daysData[day];
    if (dayData) {
      weekPnL += dayData.pnl;
      weekTrades += dayData.trades;
    }
    
    weekdayCount++;
    
    // End of week (Friday) or end of month
    if (weekdayCount >= 5 || day === daysInMonth) {
      if (weekStartDay !== null && weekEndDay !== null && weekTrades > 0) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(weekStartDay).padStart(2, '0')}`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(weekEndDay).padStart(2, '0')}`;
        
        weeks.push({
          weekNum: weekNum++,
          pnl: weekPnL,
          trades: weekTrades,
          startDate,
          endDate
        });
      }
      
      weekPnL = 0;
      weekTrades = 0;
      weekStartDay = null;
      weekEndDay = null;
      weekdayCount = 0;
    }
  }
  
  return weeks;
};

// Get cumulative P&L data optimized for dashboard chart
export const getDashboardCumulativePnL = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    // Return mock data structure with realistic P&L progression
    return [
      { date: '10/18/25', value: 250 },
      { date: '10/19/25', value: 180 },
      { date: '10/20/25', value: 405 },
      { date: '10/21/25', value: 397 },
      { date: '10/22/25', value: 572 },
      { date: '10/23/25', value: 847 },
      { date: '10/24/25', value: 787 },
      { date: '10/25/25', value: 1137 }
    ];
  }

  const sorted = [...trades].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let cumulative = 0;
  const data = sorted.map(trade => {
    cumulative += trade.pnl || 0;
    const date = new Date(trade.time);
    return {
      date: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`,
      value: Math.round(cumulative)
    };
  });

  // If too many data points, sample them
  if (data.length > 20) {
    const step = Math.floor(data.length / 20);
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  }

  return data;
};

// Calculate pie chart data for metric cards
export const calculateMetricPieData = (trades: any[]) => {
  const metrics = calculateMetrics(trades);
  
  // Net P&L pie (profit vs loss ratio)
  const totalProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const total = totalProfit + totalLoss;
  
  const netPnLPie = total === 0 ? [
    { value: 50, color: '#10b981' },
    { value: 50, color: '#e5e7eb' }
  ] : [
    { value: (totalProfit / total) * 100, color: '#10b981' },
    { value: (totalLoss / total) * 100, color: '#e5e7eb' }
  ];
  
  // Profit Factor pie
  const profitFactorPercent = Math.min(100, (metrics.profitFactor / 3) * 100);
  const profitFactorPie = [
    { value: profitFactorPercent, color: '#10b981' },
    { value: 100 - profitFactorPercent, color: '#e5e7eb' }
  ];
  
  // Win Rate pie
  const winRatePie = [
    { value: metrics.winRate, color: '#10b981' },
    { value: 100 - metrics.winRate, color: '#ef4444' }
  ];
  
  return {
    netPnLPie,
    profitFactorPie,
    winRatePie
  };
};
