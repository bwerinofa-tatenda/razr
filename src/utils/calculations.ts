// Calculate trading metrics from trades data
export const calculateMetrics = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    return {
      netPnL: 0,
      profitFactor: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      largestGain: 0,
      largestLoss: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };
  }

  const wins = trades.filter(t => t.outcome?.toLowerCase() === 'win');
  const losses = trades.filter(t => t.outcome?.toLowerCase() === 'loss');

  const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

  const netPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const profitFactor = totalLosses === 0 ? totalWins : totalWins / totalLosses;
  const winRate = trades.length === 0 ? 0 : (wins.length / trades.length) * 100;

  const avgWin = wins.length === 0 ? 0 : totalWins / wins.length;
  const avgLoss = losses.length === 0 ? 0 : totalLosses / losses.length;

  const largestGain = wins.length === 0 ? 0 : Math.max(...wins.map(t => t.pnl || 0));
  const largestLoss = losses.length === 0 ? 0 : Math.min(...losses.map(t => t.pnl || 0));

  return {
    netPnL,
    profitFactor,
    winRate,
    avgWin,
    avgLoss,
    largestGain,
    largestLoss,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length
  };
};

// Format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage
export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Get greeting based on time of day and user name
export const getGreeting = (userName?: string) => {
  const hour = new Date().getHours();
  let timeGreeting = '';
  
  if (hour < 12) timeGreeting = 'Good Morning';
  else if (hour < 18) timeGreeting = 'Good Afternoon';
  else timeGreeting = 'Good Evening';
  
  // If user name is provided, include it in the greeting
  if (userName) {
    return `${timeGreeting}, ${userName}`;
  }
  
  return timeGreeting;
};

// Format date
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format time
export const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get cumulative P&L data for charts
export const getCumulativePnL = (trades: any[]) => {
  const sorted = [...trades].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let cumulative = 0;
  return sorted.map(trade => {
    cumulative += trade.pnl || 0;
    return {
      date: formatDate(trade.time),
      value: cumulative
    };
  });
};

// Get win/loss data for pie chart
export const getWinLossData = (trades: any[]) => {
  const wins = trades.filter(t => t.outcome?.toLowerCase() === 'win').length;
  const losses = trades.filter(t => t.outcome?.toLowerCase() === 'loss').length;
  
  return [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses }
  ];
};

// Get performance by day of week
export const getPerformanceByDay = (trades: any[]) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData: Record<string, number> = {};

  days.forEach(day => { dayData[day] = 0; });

  trades.forEach(trade => {
    const day = days[new Date(trade.time).getDay()];
    dayData[day] += trade.pnl || 0;
  });

  return days.map(day => ({
    day,
    pnl: dayData[day]
  }));
};

// Calculate System Quality Number based on trade quality metrics
export const calculateSystemQualityNumber = (trade: any): number => {
  // Get the 5 scoring fields
  const analysis = trade.analysis || 0;
  const execution = trade.execution || 0;
  const tradeManagement = trade.trade_management || 0;
  const riskManagement = trade.risk_management || 0;
  const mindset = trade.mindset || 0;
  
  // Calculate average of the 5 scoring fields
  const scores = [analysis, execution, tradeManagement, riskManagement, mindset];
  const validScores = scores.filter(score => score > 0); // Only count scores that are set
  
  if (validScores.length === 0) {
    return 0; // Return 0 if no scores are available
  }
  
  const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  
  // Return average rounded to 1 decimal place
  return Number(average.toFixed(1));
};
