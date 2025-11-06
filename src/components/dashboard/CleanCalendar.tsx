import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CleanCalendarProps {
  trades: any[];
}

export default function CleanCalendar({ trades }: CleanCalendarProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Colors from reference
  const COLORS = {
    primary: '#36C99E', // Teal/mint green
    negative: '#FF7070', // Soft red/salmon
    darkGray: '#1A1A1A',
    mediumGray: '#666666',
    lightGray: '#999999'
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Total'];

  // Generate calendar data
  const generateCalendarData = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    // Adjust firstDay to Monday = 0
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Group trades by date
    const tradesByDate: { [key: string]: any[] } = {};
    trades.forEach(trade => {
      const tradeDate = new Date(trade.time);
      if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
        const dateKey = tradeDate.getDate().toString();
        if (!tradesByDate[dateKey]) {
          tradesByDate[dateKey] = [];
        }
        tradesByDate[dateKey].push(trade);
      }
    });

    // Build calendar weeks
    const weeks: any[][] = [];
    let currentWeek: any[] = [];
    
    // Add empty cells for days before first day
    for (let i = 0; i < adjustedFirstDay; i++) {
      currentWeek.push(null);
    }
    
    // Add all days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTrades = tradesByDate[day.toString()] || [];
      const pnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      currentWeek.push({
        date: day,
        pnl,
        trades: dayTrades.length
      });
      
      // If Sunday or last day, complete the week
      if (currentWeek.length === 7 || day === daysInMonth) {
        // Fill remaining days if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    return weeks;
  };

  const weeks = generateCalendarData();

  // Calculate week totals
  const calculateWeekTotals = () => {
    return weeks.map((week, index) => {
      const weekPnL = week.reduce((sum, day) => sum + (day?.pnl || 0), 0);
      const weekTrades = week.reduce((sum, day) => sum + (day?.trades || 0), 0);
      
      // Find start and end dates for the week
      const validDays = week.filter(d => d !== null);
      const startDay = validDays[0]?.date;
      const endDay = validDays[validDays.length - 1]?.date;
      
      return {
        label: `Week ${index + 1}`,
        pnl: weekPnL,
        trades: weekTrades,
        startDate: startDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}` : null,
        endDate: endDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}` : null
      };
    });
  };

  const weekTotals = calculateWeekTotals();

  // Calculate monthly total
  const monthlyTotal = trades
    .filter(trade => {
      const tradeDate = new Date(trade.time);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    })
    .reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/trades?date=${dateStr}`);
  };

  const handleWeekClick = (startDate: string | null, endDate: string | null) => {
    if (startDate && endDate) {
      navigate(`/trades?startDate=${startDate}&endDate=${endDate}`);
    }
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return '$0';
    const absValue = Math.abs(pnl);
    const sign = pnl < 0 ? '-' : '+';
    if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(1)}k`;
    }
    return `${sign}$${absValue.toFixed(0)}`;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return COLORS.primary;
    if (pnl < 0) return COLORS.negative;
    return COLORS.darkGray;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700" style={{ boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' }}>
      {/* Header with month/year and monthly P&L */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div 
          onClick={() => {
            const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
            const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
            navigate(`/trades?startDate=${monthStart}&endDate=${monthEnd}`);
          }}
          className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: monthlyTotal >= 0 ? COLORS.primary : COLORS.negative }}
          title="Click to view trades for this month"
        >
          Monthly P&L: {formatPnL(monthlyTotal)}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-700/50">
          {dayHeaders.map((day, index) => (
            <div
              key={day}
              className="px-3 py-3 text-sm font-medium border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-gray-600 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Rows */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-8 border-t border-gray-200 dark:border-gray-700">
            {/* Day Cells */}
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                onClick={() => day && day.trades > 0 && handleDayClick(day.date)}
                className={`relative min-h-[100px] p-3 border-r border-gray-200 dark:border-gray-700 ${
                  day && day.trades > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : ''
                }`}
              >
                {day && (
                  <>
                    {/* Date number */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {String(day.date).padStart(2, '0')}
                      </span>
                      {day.trades > 0 && (
                        <FileText 
                          className="h-4 w-4 transition-colors text-gray-400 dark:text-gray-500" 
                        />
                      )}
                    </div>
                    
                    {/* P&L and trade count */}
                    {day.trades > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold" style={{ color: getPnLColor(day.pnl) }}>
                          {formatPnL(day.pnl)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {day.trades} trade{day.trades !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Week Total Cell */}
            <div
              onClick={() => weekTotals[weekIndex].trades > 0 && handleWeekClick(weekTotals[weekIndex].startDate, weekTotals[weekIndex].endDate)}
              className={`relative min-h-[100px] p-3 bg-gray-50 dark:bg-gray-700/50 ${
                weekTotals[weekIndex].trades > 0 ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
              }`}
            >
              <div className="flex flex-col h-full">
                <span className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-300">
                  {weekTotals[weekIndex].label}
                </span>
                {weekTotals[weekIndex].trades > 0 && (
                  <div className="space-y-1 mt-auto">
                    <p className="text-sm font-semibold" style={{ color: getPnLColor(weekTotals[weekIndex].pnl) }}>
                      {formatPnL(weekTotals[weekIndex].pnl)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {weekTotals[weekIndex].trades} trade{weekTotals[weekIndex].trades !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No trades message */}
      {trades.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No trades to display. Start trading to see your calendar!
          </p>
        </div>
      )}
    </div>
  );
}
