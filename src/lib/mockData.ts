// Mock Data Generator - Creates realistic trading data
import type { MockAccount, MockTrade, MockStrategy, MockNote, MockChatMessage } from './mockStorage';
import { generateId } from './mockStorage';

const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Generate realistic scoring for the 5 quality assessment fields
function generateQualityScores(isWin: boolean): { analysis: number; execution: number; trade_management: number; risk_management: number; mindset: number } {
  if (isWin) {
    // Winning trades typically have higher scores
    return {
      analysis: Math.floor(Math.random() * 2) + 4, // 4-5
      execution: Math.floor(Math.random() * 2) + 4, // 4-5
      trade_management: Math.floor(Math.random() * 2) + 4, // 4-5
      risk_management: Math.floor(Math.random() * 2) + 3, // 3-4
      mindset: Math.floor(Math.random() * 2) + 3 // 3-4
    };
  } else {
    // Losing trades have more varied scores
    return {
      analysis: Math.floor(Math.random() * 3) + 2, // 2-4
      execution: Math.floor(Math.random() * 3) + 1, // 1-3
      trade_management: Math.floor(Math.random() * 3) + 1, // 1-3
      risk_management: Math.floor(Math.random() * 3) + 2, // 2-4
      mindset: Math.floor(Math.random() * 3) + 1 // 1-3
    };
  }
}

// Generate realistic mock accounts
export function generateMockAccounts(): MockAccount[] {
  return [
    {
      id: 'acc-001',
      user_id: MOCK_USER_ID,
      name: 'Main Trading Account',
      account_number: '12345678',
      encrypted_investor_password: 'mock_encrypted_password_main',
      is_connected: true,
      last_sync: '2025-11-03T02:30:00Z',
      sync_status: 'success',
      created_at: '2025-10-15T10:00:00Z',
      updated_at: '2025-11-03T02:30:00Z'
    },
    {
      id: 'acc-002',
      user_id: MOCK_USER_ID,
      name: 'Swing Trading Account',
      account_number: '87654321',
      encrypted_investor_password: 'mock_encrypted_password_swing',
      is_connected: true,
      last_sync: '2025-11-03T01:45:00Z',
      sync_status: 'syncing',
      created_at: '2025-10-20T14:30:00Z',
      updated_at: '2025-11-03T01:45:00Z'
    },
    {
      id: 'acc-003',
      user_id: MOCK_USER_ID,
      name: 'Scalping Account',
      account_number: '11223344',
      encrypted_investor_password: 'mock_encrypted_password_scalp',
      is_connected: false,
      last_sync: '2025-11-02T18:20:00Z',
      sync_status: 'disconnected',
      created_at: '2025-11-01T09:15:00Z',
      updated_at: '2025-11-02T18:20:00Z'
    }
  ];
}

// Generate realistic trading data across multiple accounts
export function generateMockTrades(): MockTrade[] {
  const trades: MockTrade[] = [];
  
  // Currency pairs and other assets
  const assets = [
    { name: 'EURUSD', type: 'FX' as const },
    { name: 'GBPUSD', type: 'FX' as const },
    { name: 'USDJPY', type: 'FX' as const },
    { name: 'XAUUSD', type: 'Metals' as const },
    { name: 'XAGUSD', type: 'Metals' as const },
    { name: 'NQ', type: 'Futures' as const },
    { name: 'ES', type: 'Futures' as const },
    { name: 'Crude Oil', type: 'Commodities' as const },
    { name: 'Natural Gas', type: 'Commodities' as const }
  ];

  const entryTags = ['Breakout', 'Reversal', 'Pullback', 'Continuation', 'Range Trading', 'News Event'];
  const sessions = ['Asia', 'London 1', 'London 2', 'London 3', 'New York 1', 'New York 2', 'New York 3'] as const;
  const emotions = ['Confident', 'Anxious', 'Calm', 'Excited', 'Frustrated', 'Focused'];
  
  // Account 12345678 (Main) - 85 trades
  for (let i = 0; i < 85; i++) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const isWin = Math.random() < 0.68; // 68% win rate
    const tradeType = Math.random() < 0.5 ? 'Long' : 'Short';
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    
    const entryPrice = Math.random() * 100 + 50;
    const priceChange = isWin 
      ? (Math.random() * 0.02 + 0.005) * entryPrice
      : -(Math.random() * 0.015 + 0.003) * entryPrice;
    const exitPrice = tradeType === 'Long'
      ? entryPrice + priceChange
      : entryPrice - priceChange;
    
    const pnl = isWin 
      ? Math.floor(Math.random() * 800 + 200)
      : -Math.floor(Math.random() * 400 + 50);
    
    const sqn = isWin ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1;
    const qualityScores = generateQualityScores(isWin);
    
    trades.push({
      id: `trade-main-${i + 1}`,
      user_id: MOCK_USER_ID,
      account_number: '12345678',
      position_id: `POS-MAIN-${generateId()}`,
      asset: asset.name,
      asset_type: asset.type,
      trade_type: tradeType,
      size: Math.random() * 2 + 0.5,
      entry_price: entryPrice,
      exit_price: exitPrice,
      session: sessions[Math.floor(Math.random() * sessions.length)],
      duration: `${Math.floor(Math.random() * 180) + 15} minutes`,
      outcome: isWin ? 'win' : 'loss',
      entry_tag: entryTags[Math.floor(Math.random() * entryTags.length)],
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      what_liked: isWin ? 'Good entry timing and risk management' : 'Quick stop loss execution',
      what_didnt_like: isWin ? 'Could have held longer' : 'Entered too early without confirmation',
      comment: isWin ? 'Clean trade setup with good confirmation' : 'Market moved against position quickly',
      pnl,
      time: date.toISOString(),
      system_quality_number: sqn,
      // New scoring fields
      analysis: qualityScores.analysis,
      execution: qualityScores.execution,
      trade_management: qualityScores.trade_management,
      risk_management: qualityScores.risk_management,
      mindset: qualityScores.mindset,
      created_at: date.toISOString()
    });
  }

  // Account 87654321 (Swing) - 70 trades (longer timeframes, larger P&L)
  for (let i = 0; i < 70; i++) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const isWin = Math.random() < 0.65; // 65% win rate
    const tradeType = Math.random() < 0.5 ? 'Long' : 'Short';
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const entryPrice = Math.random() * 100 + 50;
    const priceChange = isWin 
      ? (Math.random() * 0.04 + 0.01) * entryPrice
      : -(Math.random() * 0.02 + 0.005) * entryPrice;
    const exitPrice = tradeType === 'Long'
      ? entryPrice + priceChange
      : entryPrice - priceChange;
    
    const pnl = isWin 
      ? Math.floor(Math.random() * 1500 + 400)
      : -Math.floor(Math.random() * 600 + 100);
    
    const sqn = isWin ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1;
    const qualityScores = generateQualityScores(isWin);
    
    trades.push({
      id: `trade-swing-${i + 1}`,
      user_id: MOCK_USER_ID,
      account_number: '87654321',
      position_id: `POS-SWING-${generateId()}`,
      asset: asset.name,
      asset_type: asset.type,
      trade_type: tradeType,
      size: Math.random() * 3 + 1,
      entry_price: entryPrice,
      exit_price: exitPrice,
      session: sessions[Math.floor(Math.random() * sessions.length)],
      duration: `${Math.floor(Math.random() * 48) + 4} hours`,
      outcome: isWin ? 'win' : 'loss',
      entry_tag: entryTags[Math.floor(Math.random() * entryTags.length)],
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      what_liked: isWin ? 'Patient entry and strong trend confirmation' : 'Disciplined stop loss management',
      what_didnt_like: isWin ? 'Could have added to position' : 'Trend reversal caught me off guard',
      comment: isWin ? 'Multi-day swing trade with good risk/reward' : 'Market conditions changed unexpectedly',
      pnl,
      time: date.toISOString(),
      system_quality_number: sqn,
      // New scoring fields
      analysis: qualityScores.analysis,
      execution: qualityScores.execution,
      trade_management: qualityScores.trade_management,
      risk_management: qualityScores.risk_management,
      mindset: qualityScores.mindset,
      created_at: date.toISOString()
    });
  }

  // Account 11223344 (Scalping) - 45 trades (quick entries/exits, small P&L)
  for (let i = 0; i < 45; i++) {
    const asset = assets.slice(0, 4)[Math.floor(Math.random() * 4)]; // Mainly FX for scalping
    const isWin = Math.random() < 0.72; // 72% win rate (scalping typically higher)
    const tradeType = Math.random() < 0.5 ? 'Long' : 'Short';
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    
    const entryPrice = Math.random() * 100 + 50;
    const priceChange = isWin 
      ? (Math.random() * 0.005 + 0.001) * entryPrice
      : -(Math.random() * 0.004 + 0.001) * entryPrice;
    const exitPrice = tradeType === 'Long'
      ? entryPrice + priceChange
      : entryPrice - priceChange;
    
    const pnl = isWin 
      ? Math.floor(Math.random() * 150 + 30)
      : -Math.floor(Math.random() * 120 + 20);
    
    const sqn = isWin ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1;
    const qualityScores = generateQualityScores(isWin);
    
    trades.push({
      id: `trade-scalp-${i + 1}`,
      user_id: MOCK_USER_ID,
      account_number: '11223344',
      position_id: `POS-SCALP-${generateId()}`,
      asset: asset.name,
      asset_type: asset.type,
      trade_type: tradeType,
      size: Math.random() * 1.5 + 0.3,
      entry_price: entryPrice,
      exit_price: exitPrice,
      session: sessions[Math.floor(Math.random() * sessions.length)],
      duration: `${Math.floor(Math.random() * 15) + 2} minutes`,
      outcome: isWin ? 'win' : 'loss',
      entry_tag: entryTags[Math.floor(Math.random() * entryTags.length)],
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      what_liked: isWin ? 'Quick execution on price action signal' : 'Fast exit minimized loss',
      what_didnt_like: isWin ? 'Could have caught more pips' : 'Entry was slightly premature',
      comment: isWin ? 'Fast scalp with clean price action' : 'Market noise stopped me out',
      pnl,
      time: date.toISOString(),
      system_quality_number: sqn,
      // New scoring fields
      analysis: qualityScores.analysis,
      execution: qualityScores.execution,
      trade_management: qualityScores.trade_management,
      risk_management: qualityScores.risk_management,
      mindset: qualityScores.mindset,
      created_at: date.toISOString()
    });
  }

  // Sort by time descending
  return trades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

// Generate mock strategies
export function generateMockStrategies(): MockStrategy[] {
  return [
    {
      id: 'strat-001',
      user_id: MOCK_USER_ID,
      name: 'London Breakout',
      category: 'Breakout',
      description: 'Trade breakouts during London session open with volume confirmation',
      created_at: '2025-10-01T08:00:00Z'
    },
    {
      id: 'strat-002',
      user_id: MOCK_USER_ID,
      name: 'Pullback to EMA',
      category: 'Trend Following',
      description: 'Enter on pullbacks to 20 EMA in strong trends',
      created_at: '2025-10-05T10:30:00Z'
    },
    {
      id: 'strat-003',
      user_id: MOCK_USER_ID,
      name: 'Range Scalping',
      category: 'Scalping',
      description: 'Quick scalps at support/resistance in ranging markets',
      created_at: '2025-10-10T14:00:00Z'
    },
    {
      id: 'strat-004',
      user_id: MOCK_USER_ID,
      name: 'News Fade',
      category: 'News Trading',
      description: 'Fade initial spikes after major economic announcements',
      created_at: '2025-10-15T09:00:00Z'
    },
    {
      id: 'strat-005',
      user_id: MOCK_USER_ID,
      name: 'Supply/Demand Zones',
      category: 'Price Action',
      description: 'Trade from institutional supply and demand levels',
      created_at: '2025-10-20T11:00:00Z'
    },
    {
      id: 'strat-006',
      user_id: MOCK_USER_ID,
      name: 'Asian Range Breakout',
      category: 'Breakout',
      description: 'Trade breakouts from Asian session ranges during London open',
      created_at: '2025-10-25T07:30:00Z'
    }
  ];
}

// Generate mock notes
export function generateMockNotes(): MockNote[] {
  const notes = [
    // Strategy Notes
    {
      id: 'note-001',
      user_id: MOCK_USER_ID,
      text: 'London breakout strategy works best with volume at least 1.5x average. Wait for 15-minute candle close above resistance before entry.',
      title: 'London Breakout Volume Confirmation',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-10-01T12:00:00Z'
    },
    {
      id: 'note-002',
      text: 'Pullback trades require strong trend confirmation. Look for higher lows in uptrends, lower highs in downtrends. Best risk/reward when 20 EMA aligns with previous support/resistance.',
      title: 'EMA Pullback Strategy',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-10-05T15:00:00Z'
    },
    {
      id: 'note-003',
      text: 'Scalping requires tight stops and quick decisions. Use 1:1.5 minimum risk/reward. Exit at first sign of momentum loss. Track success rate - should be above 65% to be profitable with fees.',
      title: 'Scalping Risk Management',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-10-10T16:00:00Z'
    },
    {
      id: 'note-004',
      text: 'Supply/demand zones work better on higher timeframes (4H, Daily). Fresh zones (only tested once or twice) have higher probability. Old zones lose effectiveness.',
      title: 'Supply/Demand Zone Timing',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-10-20T14:00:00Z'
    },
    {
      id: 'note-005',
      text: 'Asian range breakout: Mark Asian session high/low. Wait for London volume. Enter on breakout with 1.5 ATR target, stop below/above Asian range.',
      title: 'Asian Range Breakout',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-10-30T09:00:00Z'
    },
    {
      id: 'note-006',
      text: 'Mean reversion strategy works best in ranging markets. Look for price deviation of 2+ standard deviations from mean. Enter on first sign of reversal with tight stops.',
      title: 'Mean Reversion Tactics',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-01T14:00:00Z'
    },

    // Risk Management Notes
    {
      id: 'note-007',
      text: 'Risk management rule: Never risk more than 1% per trade, 3% total daily risk. Position sizing formula: (Account Balance * Risk %) / (Entry - Stop Loss)',
      title: 'Position Sizing Formula',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-10-22T10:00:00Z'
    },
    {
      id: 'note-008',
      text: 'Maximum daily loss limit: Stop trading after reaching -3% of account value. This preserves mental capital and prevents emotional trading.',
      title: 'Daily Loss Limits',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-10-25T09:00:00Z'
    },
    {
      id: 'note-009',
      text: 'Correlation awareness: Avoid multiple trades in highly correlated pairs (EURUSD/GBPUSD, USDJPY/AUDJPY). Maximum 3% total exposure per currency.',
      title: 'Currency Correlation Rules',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-10-27T11:30:00Z'
    },

    // Psychology Notes
    {
      id: 'note-010',
      text: 'Psychology note: After 3 consecutive losses, take a 30-minute break. Come back with fresh perspective. Revenge trading is my biggest weakness - awareness is key.',
      title: 'Post-Loss Psychology Protocol',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-12T18:00:00Z'
    },
    {
      id: 'note-011',
      text: 'Pre-trade breathing technique: Take 3 deep breaths before any trade. This activates the parasympathetic nervous system and reduces emotional decision making.',
      title: 'Pre-Trade Breathing Technique',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-15T08:00:00Z'
    },
    {
      id: 'note-012',
      text: 'Mental journaling after bad trades: Write down 3 lessons learned and 1 thing to improve tomorrow. This transforms losses into learning experiences.',
      title: 'Post-Trade Mental Processing',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-18T17:00:00Z'
    },
    {
      id: 'note-013',
      text: 'Confidence building exercise: Review past winning trades weekly. Focus on what you did right rather than what went wrong. Build neural pathways for success.',
      title: 'Confidence Building Routine',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-23T16:00:00Z'
    },

    // Prop Firms Notes
    {
      id: 'note-014',
      text: 'Prop firm evaluation criteria: Minimum 20 trades over 2 weeks, 80%+ rule adherence, drawdown not exceeding 5%, minimum 10% profit target.',
      title: 'Prop Firm Requirements',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-10-08T10:00:00Z'
    },
    {
      id: 'note-015',
      text: 'Prop firm daily loss limit: Never hit more than -50% of daily allocation. Better to skip trades than blow the account. Risk per trade: 1-2% max.',
      title: 'Prop Firm Risk Parameters',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-10-12T12:00:00Z'
    },
    {
      id: 'note-016',
      text: 'Prohibited strategies: No martingale, no grid trading, no news trading, no holding over weekend, no hedging. Focus on single-direction trades.',
      title: 'Prop Firm Strategy Restrictions',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-10-16T14:00:00Z'
    },

    // Trade Operations Notes
    {
      id: 'note-017',
      text: 'Execution checklist: 1) Check spread before entry, 2) Verify stop loss level, 3) Set take profit, 4) Confirm position size, 5) Execute market order.',
      title: 'Trade Execution Process',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-10-05T11:00:00Z'
    },
    {
      id: 'note-018',
      text: 'Platform settings: Use VPS with <10ms latency, limit open positions to max 5, enable slippage protection at 2 pips maximum.',
      title: 'Platform Configuration',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-10-13T15:00:00Z'
    },
    {
      id: 'note-019',
      text: 'Trade journaling format: Date, pair, setup type, entry reason, exit reason, lessons learned, emotional state before/during/after trade.',
      title: 'Trade Journal Template',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-10-20T10:00:00Z'
    },

    // Notes Tab - General Trading Notes
    {
      id: 'note-020',
      text: 'Market structure analysis: Always identify the trend direction on higher timeframes before taking lower timeframe trades. Align with the higher timeframe trend.',
      title: 'Higher Timeframe Analysis',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-10-28T08:00:00Z'
    },
    {
      id: 'note-021',
      text: "Today's observation: EURUSD breaking above resistance with strong volume. Wait for retest and rejection before entering long. Quality setup forming.",
      title: 'EURUSD Breakout Analysis',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-02T13:00:00Z'
    },
    {
      id: 'note-022',
      text: 'Gold showing strong uptrend on daily timeframe. Any pullback to 20 EMA is buy opportunity. Respect the trend direction.',
      title: 'XAUUSD Trend Analysis',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-01T16:30:00Z'
    },
    {
      id: 'note-023',
      text: 'Major news events to watch this week: NFP Friday, FOMC minutes Wednesday, ECB rate decision Thursday. Reduce position sizes around these events.',
      title: 'Economic Calendar Highlights',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-03T09:00:00Z'
    },
    {
      id: 'note-024',
      text: 'GBPJPY forming a flag pattern. Bearish continuation expected. Wait for breakdown below flag support to enter short with tight stop.',
      title: 'GBPJPY Flag Pattern',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-02T11:45:00Z'
    },

    // Reflection Notes
    {
      id: 'note-025',
      text: "Reflection: Made emotional decision on USDJPY trade today. Knew setup wasn't optimal but entered anyway due to FOMO. Need to stick to plan more strictly.",
      title: 'Emotional Trading Mistake',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-01T19:00:00Z'
    },
    {
      id: 'note-026',
      text: 'Wins today: Excellent patience on EURUSD pullback entry. Waited for perfect setup and got great risk/reward. Discipline is paying off.',
      title: 'Successful Discipline',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-02T20:30:00Z'
    },
    {
      id: 'note-027',
      text: "Learning moment: Scalping isn't my strength. Better to focus on higher timeframe setups where I can think clearly and avoid emotional stress.",
      title: 'Strategy Analysis',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-10-31T17:45:00Z'
    },
    {
      id: 'note-028',
      text: 'This week progress: Improved from 60% to 72% win rate. Key factor: Better entry timing and tighter risk management. Keep building on this momentum.',
      title: 'Weekly Performance Review',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-10-29T18:00:00Z'
    },

    // Uncategorized Notes
    {
      id: 'note-029',
      text: 'Useful indicator settings: EMA 20 (trend), EMA 50 (support/resistance), RSI 14 (oversold/overbought), MACD default settings for momentum confirmation.',
      title: 'Indicator Settings Reference',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-10-25T14:00:00Z'
    },
    {
      id: 'note-030',
      text: 'Market correlation insight: When S&P 500 falls, safe haven currencies (JPY, CHF) tend to strengthen. Use this for currency direction bias.',
      title: 'Correlation Observation',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-10-30T12:00:00Z'
    },
    {
      id: 'note-031',
      text: 'Best trading sessions for different strategies: Scalping (London/NY overlap), Breakouts (London open), Swing trades (Asian open), Range trading (low volatility periods).',
      title: 'Session Strategy Matching',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-11-01T10:30:00Z'
    },
    {
      id: 'note-032',
      text: 'Reminder: Always check spread before placing orders. Especially during news times when spreads widen significantly. Can make profitable trade unprofitable.',
      title: 'Spread Awareness',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-10-27T09:00:00Z'
    },
    {
      id: 'note-033',
      text: "Platform bug discovered: MT4 sometimes doesn't execute stop loss properly during high volatility. Use buy/sell stop orders as backup for risk management.",
      title: 'Platform Technical Issue',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-10-26T15:45:00Z'
    },

    // Additional Framework Notes
    {
      id: 'note-034',
      text: 'Fibonacci retracements: Focus on 38.2%, 50%, and 61.8% levels. These are most reliable for pullback entries. Combine with candlestick patterns for higher probability setups.',
      title: 'Fibonacci Strategy Guide',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-01T08:30:00Z'
    },
    {
      id: 'note-035',
      text: 'Support and resistance becomes stronger after multiple tests. First test = weak, second = medium, third or more = very strong. Plan entries accordingly.',
      title: 'Support/Resistance Strength',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-02T11:15:00Z'
    },
    {
      id: 'note-036',
      text: 'Trend reversal signals: Higher highs break with volume, momentum divergences in RSI, failed breakouts at key levels. Wait for confirmation before entering.',
      title: 'Trend Reversal Setup',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-02T14:45:00Z'
    },
    {
      id: 'note-037',
      text: 'Session overlap trading: London/NY overlap offers best liquidity and smallest spreads. Focus on EUR/USD, GBP/USD, and USD/JPY during this period.',
      title: 'Session Overlap Strategy',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-03T09:20:00Z'
    },

    // Additional Risk Management Notes
    {
      id: 'note-038',
      text: 'Account protection: After 2 consecutive losses, reduce position size by 50%. After 3 losses, stop trading for the day. This preserves capital during difficult periods.',
      title: 'Loss Streak Protocol',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-10-29T16:30:00Z'
    },
    {
      id: 'note-039',
      text: 'Maximum correlation exposure: Never have more than 2% risk in USD trades simultaneously. Too much exposure to one currency can quickly deplete account.',
      title: 'Currency Exposure Limits',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-10-31T10:45:00Z'
    },
    {
      id: 'note-040',
      text: 'News trading risk: Reduce position sizes by 50% 1 hour before major news releases. Spread widening and slippage can turn winning trades into losers.',
      title: 'News Event Risk Management',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-11-01T12:00:00Z'
    },

    // Additional Psychology Notes
    {
      id: 'note-041',
      text: 'Confidence maintenance: After a winning streak, don\'t get overconfident. Stick to plan even when things are going well. Overconfidence leads to poor decisions.',
      title: 'Winning Streak Psychology',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-28T19:30:00Z'
    },
    {
      id: 'note-042',
      text: 'Meditation before trading: 10 minutes of mindfulness meditation clears mental clutter and improves decision-making. Use app with 10-minute session timer.',
      title: 'Pre-Trading Meditation',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-10-30T07:00:00Z'
    },
    {
      id: 'note-043',
      text: 'Stress management: High stress days lead to poor trading decisions. If stressed about personal life, skip trading. Capital preservation is more important than one trade.',
      title: 'Personal Stress Assessment',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-11-02T08:15:00Z'
    },

    // Additional Prop Firms Notes
    {
      id: 'note-044',
      text: 'Prop firm best practices: Document every trade with screenshot, reasoning, and emotional state. Most firms require proof of systematic approach.',
      title: 'Prop Firm Documentation',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-10-27T14:20:00Z'
    },
    {
      id: 'note-045',
      text: 'Prop firm evaluation strategy: Take only high-probability setups during evaluation period. Quality over quantity. Even one good trade can meet profit targets.',
      title: 'Evaluation Period Strategy',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-10-29T11:30:00Z'
    },

    // Additional Trade Ops Notes
    {
      id: 'note-046',
      text: 'Trade plan template: Strategy name, market condition required, entry criteria, exit criteria, position size calculation, risk/reward ratio.',
      title: 'Complete Trade Plan',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-11-01T16:45:00Z'
    },
    {
      id: 'note-047',
      text: 'Platform optimization: Use 5-point decimal precision for major pairs. Set up custom price alerts. Save chart templates for different strategies.',
      title: 'MT4 Customization',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-11-02T13:10:00Z'
    },

    // Additional Trades Notes
    {
      id: 'note-048',
      text: 'EUR/USD analysis: Currently in consolidation between 1.0800-1.0900. Waiting for breakout above 1.0905 to enter long with target at 1.0950.',
      title: 'Current EUR/USD Setup',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-03T10:00:00Z'
    },
    {
      id: 'note-049',
      text: 'Weekly market themes: This week focus on central bank meetings (ECB, Fed). Expect increased volatility in EUR and USD pairs around announcements.',
      title: 'Weekly Market Themes',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-03T08:30:00Z'
    },

    // Additional Reflections Notes
    {
      id: 'note-050',
      text: "Last week reflection: Excellent improvement in entry timing. My main issue was jumping into trades without proper analysis. Now I wait for multiple confirmation signals.",
      title: 'Entry Timing Improvement',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-02T21:00:00Z'
    },
    {
      id: 'note-051',
      text: 'Lesson learned: Sticking to 1% risk per trade regardless of confidence level has prevented big losses. Earlier I risked more on "sure thing" trades and lost more.',
      title: 'Risk Consistency Lesson',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-01T18:45:00Z'
    },

    // Additional Uncategorized Notes
    {
      id: 'note-052',
      text: 'Best trading books read this month: "Market Wizards" by Jack Schwager and "Trading in the Zone" by Mark Douglas. Both excellent for psychology and mindset.',
      title: 'Recommended Trading Books',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-11-01T20:30:00Z'
    },
    {
      id: 'note-053',
      text: 'Trading community insight: Join Telegram groups for real-time market sentiment but don\'t take their trades. Use for education and market awareness only.',
      title: 'Trading Community Usage',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-10-30T15:20:00Z'
    },

    // Additional Framework Notes (3 more)
    {
      id: 'note-054',
      text: 'Triple confirmation strategy: Entry only when price action, volume, and indicator signals all align. Reduces false signals by 60% based on backtesting.',
      title: 'Triple Confirmation Method',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-03T14:30:00Z'
    },
    {
      id: 'note-055',
      text: 'Candlestick patterns that work: Engulfing patterns at key levels, pin bars at support/resistance, inside bars for continuation. Ignore patterns in middle of nowhere.',
      title: 'Reliable Candlestick Patterns',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-03T15:45:00Z'
    },
    {
      id: 'note-056',
      text: 'Market phase identification: Accumulation (range-bound, low volume), Markup (trending up, increasing volume), Distribution (range-bound at highs), Markdown (trending down). Trade accordingly.',
      title: 'Market Cycle Phases',
      category: 'Framework',
      tab: 'strategy',
      created_at: '2025-11-04T09:00:00Z'
    },

    // Additional Risk Management Notes (2 more)
    {
      id: 'note-057',
      text: 'Risk/Reward minimum: Never take trades below 1:2 ratio. This allows 33% win rate to breakeven. Current average is 1:2.8 - maintain or improve.',
      title: 'Minimum Risk/Reward Ratio',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-11-03T16:20:00Z'
    },
    {
      id: 'note-058',
      text: 'Weekend risk management: Close all positions Friday before market close unless swing trade with wide stop. Weekend gaps can trigger stops unpredictably.',
      title: 'Weekend Position Management',
      category: 'Risk Management',
      tab: 'strategy',
      created_at: '2025-11-04T08:15:00Z'
    },

    // Additional Psychology Notes (2 more)
    {
      id: 'note-059',
      text: 'Performance anxiety solution: Focus on process, not results. Grade yourself on following the plan, not on P&L. Good decisions with bad outcomes are still good decisions.',
      title: 'Process Over Outcome Mindset',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-11-03T17:00:00Z'
    },
    {
      id: 'note-060',
      text: 'Dealing with winning streaks: Stay humble. Market can change any moment. Continue following rules that got you here. Overconfidence is silent killer of accounts.',
      title: 'Winning Streak Management',
      category: 'Psychology',
      tab: 'strategy',
      created_at: '2025-11-04T07:45:00Z'
    },

    // Additional Prop Firms Notes (2 more)
    {
      id: 'note-061',
      text: 'Prop firm challenge tips: Focus on consistency over profit targets. Most firms want steady growth. Better to hit target in 25 days than rush in 10 and break rules.',
      title: 'Challenge Completion Strategy',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-11-03T13:00:00Z'
    },
    {
      id: 'note-062',
      text: 'Scaling rules for funded accounts: After first payout, can scale up 25%. After third payout, scale up another 25%. Never increase more than 50% in single month.',
      title: 'Funded Account Scaling',
      category: 'Prop Firms',
      tab: 'rules',
      created_at: '2025-11-04T10:30:00Z'
    },

    // Additional Trade Ops Notes (2 more)
    {
      id: 'note-063',
      text: 'Trade review process: Every Sunday review all trades from the week. Screenshot each trade, rate execution 1-10, identify patterns. Track in spreadsheet.',
      title: 'Weekly Trade Review Protocol',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-11-03T18:30:00Z'
    },
    {
      id: 'note-064',
      text: 'Order types best practices: Use limit orders for entries in ranging markets, market orders for breakouts. Always use stop-loss, never mental stops.',
      title: 'Order Type Selection Guide',
      category: 'Trade Ops',
      tab: 'rules',
      created_at: '2025-11-04T11:00:00Z'
    },

    // Additional Trades Notes (3 more)
    {
      id: 'note-065',
      text: 'USD/JPY setup developing: Breaking above 151.50 resistance. If holds above this level with volume, targeting 152.80. Stop below 151.20.',
      title: 'USD/JPY Breakout Watch',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-03T11:30:00Z'
    },
    {
      id: 'note-066',
      text: 'Oil market analysis: Crude oil consolidating near $82. OPEC meeting next week could create volatility. Prepared for breakout in either direction.',
      title: 'Crude Oil Market Watch',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-03T14:00:00Z'
    },
    {
      id: 'note-067',
      text: 'S&P 500 futures showing strength. ES breaking key resistance at 4500. Tech sector leading. May correlate with risk-on sentiment in forex markets.',
      title: 'ES Futures Analysis',
      category: 'Trades',
      tab: 'notes',
      created_at: '2025-11-04T08:45:00Z'
    },

    // Additional Reflections Notes (2 more)
    {
      id: 'note-068',
      text: 'Monthly progress review: Improved significantly in trade selection. Still need work on exit timing - often leaving profits on table. Focus area for December.',
      title: 'November Monthly Review',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-03T20:00:00Z'
    },
    {
      id: 'note-069',
      text: 'Breakthrough moment: Finally comfortable with taking losses. Realized losses are just cost of doing business. Changed my whole perspective on trading.',
      title: 'Loss Acceptance Breakthrough',
      category: 'Reflections',
      tab: 'notes',
      created_at: '2025-11-04T06:30:00Z'
    },

    // Additional Uncategorized Notes (3 more)
    {
      id: 'note-070',
      text: 'Time management: Best trading hours are 8am-12pm when most focused. Avoid afternoon sessions - historically lower win rate. Quality over quantity.',
      title: 'Personal Trading Hours',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-11-03T12:15:00Z'
    },
    {
      id: 'note-071',
      text: 'Backup plan: Always have backup internet connection. Last week lost connection during important trade. Mobile hotspot now ready as backup.',
      title: 'Internet Backup Solution',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-11-03T16:45:00Z'
    },
    {
      id: 'note-072',
      text: 'Tax preparation note: Track all trades monthly for tax purposes. Keep records of all deposits, withdrawals, and trading statements. Makes year-end easier.',
      title: 'Trading Tax Records',
      category: 'Uncategorized',
      tab: 'notes',
      created_at: '2025-11-04T10:00:00Z'
    }
  ];
  
  // Add user_id to all notes that don't have it
  return notes.map(note => {
    const noteWithDefaults: any = { ...note };
    noteWithDefaults.user_id = noteWithDefaults.user_id || MOCK_USER_ID;
    noteWithDefaults.content_type = noteWithDefaults.content_type || 'plain-text';
    return noteWithDefaults;
  });
}

// Generate mock chat messages
export function generateMockChatMessages(): MockChatMessage[] {
  return [
    {
      role: 'user',
      content: 'How can I improve my trading discipline?',
      user_id: MOCK_USER_ID,
      created_at: '2025-11-02T14:30:00Z',
      metadata: { mode: 'coach' }
    },
    {
      role: 'assistant',
      content: "Based on your trading data from account 12345678, I notice you have a solid 68% win rate, which shows you're making good trading decisions. However, I see a few areas where discipline can be strengthened:\n\n1. **Position Sizing Consistency**: Your largest loss was around $400. Consider implementing strict position sizing rules - never risk more than 1% of your account per trade.\n\n2. **Emotional Patterns**: I notice you've logged 'Anxious' and 'Frustrated' emotions on several trades. These emotional states often lead to impulsive decisions. Try implementing a 30-minute cooldown period after any loss before taking the next trade.\n\n3. **Entry Timing**: Your notes mention entering 'too early without confirmation' on losing trades. Create a checklist of confirmation signals that must be present before entry.\n\nYour strength is quick stop-loss execution, which shows good risk awareness. Build on this by pre-defining your exit points before entering any trade.",
      user_id: MOCK_USER_ID,
      created_at: '2025-11-02T14:30:15Z',
      metadata: { 
        mode: 'coach',
        hasKnowledgeBase: true,
        usedNotes: [
          { id: 'note-004', text: 'Psychology note: After 3 consecutive losses...' },
          { id: 'note-006', text: 'Risk management rule: Never risk more than 1%...' }
        ]
      }
    },
    {
      role: 'user',
      content: 'What should I focus on in my pre-session routine?',
      user_id: MOCK_USER_ID,
      created_at: '2025-11-02T18:00:00Z',
      metadata: { mode: 'pre_session' }
    },
    {
      role: 'assistant',
      content: "Great question! A solid pre-session routine is crucial for consistent trading. Based on your notes, you already have a checklist - let's expand on it:\n\n**Your Current Checklist** (from your notes):\n- Review economic calendar ✓\n- Identify key levels ✓\n- Check overnight price action ✓\n- Set alerts ✓\n- Prepare trade plan with 3 scenarios ✓\n\n**Additional Focus Areas**:\n\n1. **Mental State Assessment**: Rate your mental clarity 1-10. If below 7, consider reducing position size or taking the session off.\n\n2. **Account Review**: Check your daily risk limit (3% total as per your rules). Calculate how many trades you can take at your standard risk.\n\n3. **Strategy Selection**: Based on current market conditions (trending vs ranging), choose which of your 6 strategies is most appropriate today.\n\n4. **Visualization**: Spend 5 minutes visualizing perfect trade execution - entry, management, and exit.\n\n5. **Risk Parameters**: Write down your max loss for the day. Commit to stopping if you hit it.\n\nYour strength is preparation. Keep building on this foundation!",
      user_id: MOCK_USER_ID,
      created_at: '2025-11-02T18:00:20Z',
      metadata: {
        mode: 'pre_session',
        hasKnowledgeBase: true,
        usedNotes: [
          { id: 'note-007', text: 'Pre-session checklist: Review economic calendar...' },
          { id: 'note-006', text: 'Risk management rule...' }
        ]
      }
    }
  ];
}
