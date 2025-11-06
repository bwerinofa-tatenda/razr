import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  Clock, 
  Edit2, 
  Trash2, 
  Copy,
  FileText,
  TrendingUp,
  Target,
  Brain,
  Activity,
  BookOpen,
  Lightbulb,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'trading' | 'psychology' | 'analysis' | 'planning' | 'review' | 'custom';
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
}

interface TemplateManagerProps {
  templates: NoteTemplate[];
  onTemplateCreate: (template: Omit<NoteTemplate, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => void;
  onTemplateUpdate: (id: string, template: Partial<NoteTemplate>) => void;
  onTemplateDelete: (id: string) => void;
  onTemplateUse: (templateId: string) => void;
  onClose: () => void;
}

const CATEGORIES = {
  trading: { 
    name: 'Trading', 
    icon: TrendingUp, 
    color: 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400',
    description: 'Trading setup and execution templates'
  },
  psychology: { 
    name: 'Psychology', 
    icon: Brain, 
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400',
    description: 'Mental and emotional management templates'
  },
  analysis: { 
    name: 'Analysis', 
    icon: Activity, 
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400',
    description: 'Market and trade analysis templates'
  },
  planning: { 
    name: 'Planning', 
    icon: Target, 
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400',
    description: 'Pre and post-trade planning templates'
  },
  review: { 
    name: 'Review', 
    icon: CheckCircle, 
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400',
    description: 'Performance review and reflection templates'
  },
  custom: { 
    name: 'Custom', 
    icon: FileText, 
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-400',
    description: 'User-created custom templates'
  }
};

const PREDEFINED_TEMPLATES: Omit<NoteTemplate, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>[] = [
  // PRE-MARKET TEMPLATES
  {
    name: 'Pre-Market Watchlist',
    description: 'Pre-market preparation with symbols, game plans, and key levels',
    category: 'planning',
    tags: ['pre-market', 'watchlist', 'symbols', 'levels'],
    isFavorite: true,
    content: '# Pre-Market Watchlist - {{date}}\n\n## Key Market News\n### Economic Calendar\n- **Time:** Event - Impact Level\n- ___: ___ - High/Medium/Low\n- ___: ___ - High/Medium/Low\n- ___: ___ - High/Medium/Low\n\n### Overnight News\n- **Major Headlines:**\n  - \n  - \n  - \n\n## Watchlist Analysis\n### Symbol 1: {{symbol1}}\n- **Current Price:** {{price1}}\n- **Overnight Movement:** {{move1}}\n- **Key Level:** {{level1}}\n- **Game Plan:** \n  - Long: If {{condition1}}\n  - Short: If {{condition1}}\n  - Avoid: If {{condition1}}\n\n### Symbol 2: {{symbol2}}\n- **Current Price:** {{price2}}\n- **Overnight Movement:** {{move2}}\n- **Key Level:** {{level2}}\n- **Game Plan:** \n  - Long: If {{condition2}}\n  - Short: If {{condition2}}\n  - Avoid: If {{condition2}}\n\n### Symbol 3: {{symbol3}}\n- **Current Price:** {{price3}}\n- **Overnight Movement:** {{move3}}\n- **Key Level:** {{level3}}\n- **Game Plan:** \n  - Long: If {{condition3}}\n  - Short: If {{condition3}}\n  - Avoid: If {{condition3}}\n\n## Key Levels to Watch\n### Support Levels\n- \n- \n- \n\n### Resistance Levels\n- \n- \n- \n\n## Market Sentiment\n- **Overall Bias:** Bullish / Bearish / Neutral\n- **Volatility Expectation:** High / Medium / Low\n- **Session Focus:** {{session}}\n\n## Pre-Market Checklist\n- [ ] Reviewed overnight price action\n- [ ] Checked economic calendar\n- [ ] Identified key levels\n- [ ] Set alerts for breakouts\n- [ ] Reviewed risk management rules\n\n**Mental Prep:** Stay focused on the plan. Don\'t chase the market.'
  },
  {
    name: 'Morning Game Plan',
    description: 'Comprehensive morning preparation with market outlook and strategy',
    category: 'planning',
    tags: ['morning', 'game-plan', 'outlook', 'strategy'],
    isFavorite: true,
    content: '# Morning Game Plan - {{date}}\n\n## Market Overview\n### Overnight Action\n- **Asian Session:** {{asian_session}}\n- **European Session:** {{european_session}}\n- **US Futures:** {{us_futures}}\n- **Overall Sentiment:** {{sentiment}}\n\n### Key Themes\n- **Primary Theme:** \n- **Secondary Theme:** \n- **Risk Factors:** \n\n## Technical Setup\n### Overall Market\n- **Trend:** Bullish / Bearish / Sideways\n- **Key S&P 500 Level:** {{spx_level}}\n- **NASDAQ Level:** {{nasdaq_level}}\n- **Volatility:** {{vix_level}}\n\n### Sector Analysis\n- **Leading Sectors:** \n- **Lagging Sectors:** \n- **Rotation Patterns:** \n\n## Trading Strategy for Today\n### Primary Approach\n- **Strategy:** \n- **Market Conditions:** \n- **Risk Level:** Conservative / Moderate / Aggressive\n\n### Session Strategy\n- **London Open:** \n- **US Open:** \n- **Mid-Session:** \n- **Earnings/FOMC:** \n\n## Risk Management\n- **Daily Loss Limit:** ${{daily_limit}}\n- **Max Position Size:** {{max_size}}%\n- **Correlation Risk:** \n- **Stop Loss Protocol:** \n\n## Key Levels and Triggers\n### Breakout Levels\n- **Upside:** {{upside_level}}\n- **Downside:** {{downside_level}}\n\n### Rejection Levels\n- **Resistance:** {{resistance}}\n- **Support:** {{support}}\n\n## Economic Events\n- **Time:** Event - Impact\n- {{event1_time}}: {{event1}} - {{event1_impact}}\n- {{event2_time}}: {{event2}} - {{event2_impact}}\n- {{event3_time}}: {{event3}} - {{event3_impact}}\n\n## Goals for Today\n### Primary Goals\n1. \n2. \n3. \n\n### Performance Targets\n- **Target P&L:** ${{target_pnl}}\n- **Win Rate Goal:** {{target_win_rate}}%\n- **Max Drawdown:** {{max_dd}}%\n\n## Mental Preparation\n### Focus Areas\n- **Primary Focus:** \n- **Avoid:** \n- **Rule Reminder:** \n\n### Affirmation\n"{{affirmation}}"\n\n**Success Formula:** Patience + Discipline + Risk Management = Consistent Profits'
  },
  {
    name: 'Economic Calendar Review',
    description: 'Review of FOMC, earnings, and news events with market impact analysis',
    category: 'analysis',
    tags: ['economic', 'FOMC', 'earnings', 'news', 'impact'],
    isFavorite: false,
    content: '# Economic Calendar Review - {{date}}\n\n## High Impact Events\n### FOMC Meetings\n- **Next Meeting:** {{fomc_date}}\n- **Expected Action:** Rate Cut / Hold / Rate Hike\n- **Market Expectation:** {{market_expectation}}\n- **Historical Impact:** \n\n### Earnings Reports\n#### Before Market Open\n- **Company:** {{company1}} - {{earnings1}} vs {{expected1}}\n- **Company:** {{company2}} - {{earnings2}} vs {{expected2}}\n\n#### After Market Close\n- **Company:** {{company3}} - {{earnings3}} vs {{expected3}}\n- **Company:** {{company4}} - {{earnings4}} vs {{expected4}}\n\n## Economic Reports\n### Today\'s Data\n- **Time:** Report - Consensus - Previous\n- {{time1}}: {{report1}} - {{consensus1}} - {{previous1}}\n- {{time2}}: {{report2}} - {{consensus2}} - {{previous2}}\n- {{time3}}: {{report3}} - {{consensus3}} - {{previous3}}\n\n### Key Numbers to Watch\n- **Non-Farm Payrolls:** {{nfp}} vs {{nfp_consensus}}\n- **Unemployment Rate:** {{unemployment}}%\n- **Inflation (CPI):** {{cpi}}% vs {{cpi_consensus}}%\n- **GDP Growth:** {{gdp}}% vs {{gdp_consensus}}%\n\n## Market Impact Analysis\n### Pre-Event Expectations\n- **Probable Reaction:** \n- **Key Level to Watch:** \n- **Volatility Expectation:** High / Medium / Low\n\n### Risk Management\n- **Reduce Size Before:** \n- **Avoid New Positions:** \n- **Watch for Whipsaws:** \n\n## Trading Plan\n### Event Trading Rules\n1. **Pre-Event:** \n2. **During Event:** \n3. **Post-Event:** \n\n### Expected Scenarios\n#### Bullish Scenario\n- **Trigger:** \n- **Action:** \n- **Target:** \n\n#### Bearish Scenario\n- **Trigger:** \n- **Action:** \n- **Target:** \n\n## News Monitoring\n### Key Sources\n- [ ] Bloomberg\n- [ ] Reuters\n- [ ] Financial Times\n- [ ] Wall Street Journal\n\n### Social Media\n- [ ] @ReutersBreaking\n- [ ] @FTBreakingNews\n- [ ] @benzinga\n\n## Post-Event Analysis\n### Actual vs Expected\n- **Result:** \n- **Market Reaction:** \n- **What I Learned:** \n\n**Remember:** News trading requires quick execution and strict risk management.'
  },

  // POST-SESSION TEMPLATES
  {
    name: 'Post-Session Review',
    description: 'Complete post-session analysis of mistakes, successes, and lessons',
    category: 'review',
    tags: ['post-session', 'review', 'mistakes', 'lessons'],
    isFavorite: true,
    content: '# Post-Session Review - {{date}}\n\n## Session Overview\n- **Session:** {{session}}\n- **Market Direction:** {{direction}}\n- **Volatility Level:** {{volatility}}\n- **Overall Performance:** {{performance}}\n\n## Trading Statistics\n- **Total Trades:** {{total_trades}}\n- **Winners:** {{winners}} ({{win_rate}}%)\n- **Losers:** {{losers}}\n- **Breakeven:** {{breakeven}}\n- **Net P&L:** ${{net_pnl}}\n- **Best Trade:** ${{best_trade}}\n- **Worst Trade:** ${{worst_trade}}\n\n## Individual Trade Analysis\n### Trade 1: {{symbol1}}\n- **Setup:** {{setup1}}\n- **Entry:** {{entry1}} | **Exit:** {{exit1}}\n- **R:R:** {{rr1}}\n- **What Went Right:** \n- **What Went Wrong:** \n- **Lesson:** \n\n### Trade 2: {{symbol2}}\n- **Setup:** {{setup2}}\n- **Entry:** {{entry2}} | **Exit:** {{exit2}}\n- **R:R:** {{rr2}}\n- **What Went Right:** \n- **What Went Wrong:** \n- **Lesson:** \n\n### Trade 3: {{symbol3}}\n- **Setup:** {{setup3}}\n- **Entry:** {{entry3}} | **Exit:** {{exit3}}\n- **R:R:** {{rr3}}\n- **What Went Right:** \n- **What Went Wrong:** \n- **Lesson:** \n\n## Performance Analysis\n### What Went Well\n- [ ] \n- [ ] \n- [ ] \n\n### What Went Wrong\n- [ ] \n- [ ] \n- [ ] \n\n### Rule Violations\n1. **Violation:** \n   - **Rule:** \n   - **Impact:** \n   - **Prevention:** \n\n2. **Violation:** \n   - **Rule:** \n   - **Impact:** \n   - **Prevention:** \n\n## Emotional Analysis\n### Emotions Experienced\n- **Confidence (1-10):** {{confidence}}\n- **Stress Level (1-10):** {{stress}}\n- **FOMO Incidents:** {{fomo}}\n- **Revenge Trading:** {{revenge}}\n\n### Mindset Assessment\n- **Peak Performance Moments:** \n- **Weakness Exposed:** \n- **Mental Strength:** \n\n## Market Structure\n### Key Observations\n- **Volume Patterns:** \n- **Time-Based Movement:** \n- **Sector Rotation:** \n- **News Impact:** \n\n### Technical Analysis\n- **Key Levels Tested:** \n- **Chart Patterns:** \n- **Momentum Changes:** \n\n## Risk Management Review\n### Position Sizing\n- **Properly Sized:** {{proper_sized}}\n- **Oversized:** {{oversized}}\n- **Ignored Size Rules:** {{ignored_rules}}\n\n### Stop Loss Discipline\n- **Stops Honored:** {{stops_honored}}\n- **Stops Moved:** {{stops_moved}}\n- **No Stop Trades:** {{no_stop}}\n\n## Tomorrow\'s Preparation\n### Key Levels to Watch\n- **Support:** {{support}}\n- **Resistance:** {{resistance}}\n- **Breakout Levels:** {{breakout}}\n\n### Economic Calendar\n- **Events:** \n- **Impact:** \n\n### Trading Focus\n- **Primary Strategy:** \n- **Secondary Strategy:** \n- **Avoid:** \n\n## Weekly Goals Progress\n### Current Week Objectives\n- [ ] Goal 1: \n- [ ] Goal 2: \n- [ ] Goal 3: \n\n### Progress Assessment\n- **On Track:** \n- **Behind:** \n- **Adjustments Needed:** \n\n**Key Lesson Today:** {{key_lesson}}\n\n**Tomorrow\'s Mantra:** "{{tomorrow_mantra}}"'
  },
  {
    name: 'Daily Performance Summary',
    description: 'Daily P&L, statistics, and comprehensive performance tracking',
    category: 'analysis',
    tags: ['daily', 'performance', 'statistics', 'P&L'],
    isFavorite: true,
    content: '# Daily Performance Summary - {{date}}\n\n## Financial Performance\n### P&L Summary\n- **Gross P&L:** ${{gross_pnl}}\n- **Net P&L:** ${{net_pnl}}\n- **Commission:** ${{commission}}\n- **Fees:** ${{fees}}\n- **R Multiple:** {{r_multiple}}\n\n### Trade Metrics\n- **Total Trades:** {{total_trades}}\n- **Winners:** {{winners}} ({{win_rate}}%)\n- **Losers:** {{losers}}\n- **Breakeven:** {{breakeven}}\n- **Average Winner:** ${{avg_winner}}\n- **Average Loser:** ${{avg_loser}}\n- **Profit Factor:** {{profit_factor}}\n\n## Performance vs Goals\n### Daily Targets\n- **P&L Target:** ${{pnl_target}} | **Achieved:** {{achieved}}%\n- **Trade Target:** {{trade_target}} trades | **Executed:** {{executed}}\n- **Win Rate Target:** {{win_rate_target}}% | **Achieved:** {{actual_win_rate}}%\n\n### Risk Metrics\n- **Max Drawdown:** ${{max_dd}} ({{dd_percent}}%)\n- **Risk Per Trade:** {{risk_per_trade}}%\n- **Portfolio Heat:** {{portfolio_heat}}%\n- **Sharpe Ratio:** {{sharpe}}\n\n## Trade Breakdown\n### Best Trades\n1. **{{symbol1}}** - ${{pnl1}} ({{rr1}}R)\n   - **Setup:** {{setup1}}\n   - **Execution:** {{execution1}}\n\n2. **{{symbol2}}** - ${{pnl2}} ({{rr2}}R)\n   - **Setup:** {{setup2}}\n   - **Execution:** {{execution2}}\n\n3. **{{symbol3}}** - ${{pnl3}} ({{rr3}}R)\n   - **Setup:** {{setup3}}\n   - **Execution:** {{execution3}}\n\n### Worst Trades\n1. **{{bad_symbol1}}** - ${{bad_pnl1}} ({{bad_rr1}}R)\n   - **Mistake:** {{mistake1}}\n   - **Lesson:** {{lesson1}}\n\n2. **{{bad_symbol2}}** - ${{bad_pnl2}} ({{bad_rr2}}R)\n   - **Mistake:** {{mistake2}}\n   - **Lesson:** {{lesson2}}\n\n## Strategy Performance\n### By Strategy Type\n- **Scalping:** {{scalp_trades}} trades, ${{scalp_pnl}}\n- **Momentum:** {{momentum_trades}} trades, ${{momentum_pnl}}\n- **Reversal:** {{reversal_trades}} trades, ${{reversal_pnl}}\n- **Breakout:** {{breakout_trades}} trades, ${{breakout_pnl}}\n\n### By Time Frame\n- **Scalp (<5min):** {{scalp_tf_trades}} trades, ${{scalp_tf_pnl}}\n- **Short (5-15min):** {{short_tf_trades}} trades, ${{short_tf_pnl}}\n- **Medium (15-60min):** {{medium_tf_trades}} trades, ${{medium_tf_pnl}}\n- **Long (>60min):** {{long_tf_trades}} trades, ${{long_tf_pnl}}\n\n## Market Conditions Impact\n### Volatility Analysis\n- **Average Range:** {{avg_range}}\n- **Intraday High:** {{intraday_high}}\n- **Intraday Low:** {{intraday_low}}\n- **Volume:** {{volume}}\n\n### News Impact\n- **Economic Events:** {{economic_events}}\n- **Earnings:** {{earnings}}\n- **Geopolitical:** {{geopolitical}}\n- **Systemic:** {{systemic}}\n\n## Psychological Performance\n### Emotional Metrics\n- **Confidence (1-10):** {{confidence}}\n- **Stress Level (1-10):** {{stress}}\n- **Discipline (1-10):** {{discipline}}\n- **Focus (1-10):** {{focus}}\n\n### Behavioral Analysis\n- **Rule Violations:** {{rule_violations}}\n- **FOMO Incidents:** {{fomo_incidents}}\n- **Revenge Trades:** {{revenge_trades}}\n- **Overtrading:** {{overtrading}}\n\n## Comparative Analysis\n### Week-to-Date\n- **Current Week P&L:** ${{week_pnl}}\n- **Previous Week P&L:** ${{prev_week_pnl}}\n- **Performance Difference:** {{performance_diff}}\n\n### Month-to-Date\n- **Current Month P&L:** ${{month_pnl}}\n- **Target Month P&L:** ${{month_target}}\n- **Progress:** {{month_progress}}%\n\n## Areas for Improvement\n### Technical\n- [ ] \n- [ ] \n- [ ] \n\n### Mental\n- [ ] \n- [ ] \n- [ ] \n\n### Risk Management\n- [ ] \n- [ ] \n- [ ] \n\n## Tomorrow\'s Focus\n### Primary Goals\n1. \n2. \n3. \n\n### Areas to Avoid\n- [ ] \n- [ ] \n- [ ] \n\n**Performance Rating:** {{rating}}/10\n\n**Key Insight:** {{key_insight}}'
  },

  // PLANNING TEMPLATES
  {
    name: 'Daily Trading Plan',
    description: 'Comprehensive daily preparation template',
    category: 'planning',
    tags: ['daily', 'pre-market', 'planning'],
    isFavorite: true,
    content: '# Daily Trading Plan - {{date}}\n\n## Pre-Market Analysis (30 min before open)\n### Economic Calendar\n- [ ] Check today\'s economic events\n- [ ] Identify high-impact news times\n- [ ] Note any overnight developments\n\n### Technical Analysis\n- [ ] Review overnight price action\n- [ ] Identify key support/resistance levels\n- [ ] Mark important moving averages\n- [ ] Note any chart patterns forming\n\n### Market Sentiment\n- [ ] Check futures/crypto movements\n- [ ] Review weekend news impact\n- [ ] Assess overall market bias\n\n## Trading Strategy for Today\n### Primary Strategy\n- **Strategy:** \n- **Market Conditions:** \n- **Risk Level:** \n\n### Key Levels to Watch\n- **Support Levels:** \n- **Resistance Levels:** \n\n### Session Focus\n- [ ] Asian Session (if applicable)\n- [ ] London Session\n- [ ] New York Session\n\n## Risk Management\n- **Daily Loss Limit:** $___ or ___% of account\n- **Position Size:** ___ lots max per trade\n- **Maximum Trades:** ___ trades for the day\n\n## Goals for Today\n- [ ] \n- [ ] \n- [ ] \n\n**Mental Preparation:** Remember, today is just one day in my trading journey. I will trade with discipline and patience.'
  },
  {
    name: 'Trade Analysis',
    description: 'Detailed post-trade analysis template',
    category: 'analysis',
    tags: ['post-trade', 'analysis', 'reflection'],
    isFavorite: true,
    content: '# Trade Analysis - {{symbol}} - {{date}}\n\n## Trade Details\n- **Symbol:** {{symbol}}\n- **Entry:** {{entry_price}}\n- **Exit:** {{exit_price}}\n- **Position Size:** {{size}} lots\n- **P&L:** $\\{{pnl}}\n- **Duration:** {{duration}}\n- **Session:** {{session}}\n\n## Setup Quality (1-10)\n- **Market Analysis:** {{analysis_score}}/10\n- **Entry Timing:** {{execution_score}}/10\n- **Trade Management:** {{management_score}}/10\n- **Exit Execution:** {{exit_score}}/10\n\n## What Went Well\n- \n- \n- \n\n## What Could Be Improved\n- \n- \n- \n\n## Lessons Learned\n1. \n2. \n3. \n\n## Rule Compliance\n- [ ] Followed entry rules\n- [ ] Proper position sizing\n- [ ] Stop loss respected\n- [ ] No emotional trading\n- [ ] Trade journal updated\n\n## Score: ___/50\n\n## Next Trade Improvements\n- \n- '
  },
  {
    name: 'Weekly Review',
    description: 'Comprehensive weekly performance review',
    category: 'review',
    tags: ['weekly', 'review', 'performance'],
    isFavorite: false,
    content: `# Weekly Trading Review - Week of {{date}}

## Performance Summary
### Week Overview
- **Total Trades:** 
- **Winners:** 
- **Losers:** 
- **Win Rate:** ___%
- **Net P&L:** $___
- **Average R:R:** 

### Best Trades
1. **Trade:** 
   - **Reason for Success:** 
2. **Trade:** 
   - **Reason for Success:** 

### Worst Trades
1. **Trade:** 
   - **What Went Wrong:** 
2. **Trade:** 
   - **What Went Wrong:** 

## Rule Compliance
- [ ] Followed daily loss limits
- [ ] Maintained position sizing discipline
- [ ] No emotional trading incidents
- [ ] All trades documented
- [ ] Proper risk management

## Strategy Performance
### What Worked
- 
- 
- 

### What Didn't Work
- 
- 
- 

## Psychological Insights
### Emotions Experienced
- **Confidence Level (1-10):** 
- **Stress Level (1-10):** 
- **FOMO Incidents:** 
- **Revenge Trading:** 

### Mental Improvements Needed
- 
- 
- 

## Week's Goals Review
- [ ] Goal 1: 
- [ ] Goal 2: 
- [ ] Goal 3: 

## Next Week's Focus
### Primary Objectives
1. 
2. 
3. 

### Areas for Improvement
- 
- 
- 

### New Strategies to Test
- 
- `
  },
  {
    name: 'Monthly Trading Goals',
    description: 'Monthly goal setting and progress tracking',
    category: 'planning',
    tags: ['monthly', 'goals', 'planning'],
    isFavorite: false,
    content: '# Monthly Trading Goals - {{month}} {{year}}\n\n## Primary Objectives\n### Financial Goals\n- **Target P&L:** $___\n- **Target Win Rate:** ___%\n- **Target R:R Average:** ___\n- **Risk per Trade:** ___%\n\n### Performance Goals\n- [ ] \n- [ ] \n- [ ] \n- [ ] \n\n### Learning Goals\n- [ ] \n- [ ] \n- [ ] \n- [ ] \n\n## Monthly Strategy Focus\n### Primary Strategy This Month\n- **Strategy:** \n- **Expected Performance:** \n- **Risk Level:** \n\n### Key Metrics to Track\n- [ ] Daily consistency\n- [ ] Emotional discipline\n- [ ] Rule compliance\n- [ ] Profit factor\n- [ ] Maximum drawdown\n\n## Weekly Milestones\n### Week 1\n- **Focus:** \n- **Target:** \n- **Key Actions:** \n\n### Week 2\n- **Focus:** \n- **Target:** \n- **Key Actions:** \n\n### Week 3\n- **Focus:** \n- **Target:** \n- **Key Actions:** \n\n### Week 4\n- **Focus:** \n- **Target:** \n- **Key Actions:** \n\n## Risk Management Rules for This Month\n- **Daily Loss Limit:** $___\n- **Maximum Weekly Loss:** $___\n- **Position Size Adjustment:** \n- **No-Trade Conditions:** \n\n## Success Metrics\n- [ ] Hit profit target\n- [ ] Maintain win rate goal\n- [ ] Zero rule violations\n- [ ] Complete all learning goals\n- [ ] Emotional discipline maintained\n\n## Backup Plan\nIf things don\'t go as planned:\n1. \n2. \n3. \n\n**Motivation:** I am committed to consistent, disciplined trading. Every trade is a step toward mastery.'
  },
  {
    name: 'Psychology Check-in',
    description: 'Mental state and emotional tracking template',
    category: 'psychology',
    tags: ['psychology', 'mental', 'emotions'],
    isFavorite: true,
    content: '# Psychology Check-in - {{date}}\n\n## Current Mental State (1-10 scale)\n### Confidence Level\n- **Overall Confidence:** {{confidence}}/10\n- **Strategy Confidence:** {{strategy_confidence}}/10\n- **Market Confidence:** {{market_confidence}}/10\n\n### Emotional State\n- **Stress Level:** {{stress}}/10\n- **Anxiety Level:** {{anxiety}}/10\n- **Excitement Level:** {{excitement}}/10\n- **Frustration Level:** {{frustration}}/10\n\n## Recent Emotions\n### What I\'ve Been Feeling\n- \n- \n- \n\n### Triggers Identified\n- \n- \n- \n\n## Mindset Assessment\n### Positive Mindset Indicators\n- [ ] Feeling optimistic about trades\n- [ ] Following rules consistently\n- [ ] Learning from mistakes\n- [ ] Staying patient\n\n### Warning Signs\n- [ ] Revenge trading thoughts\n- [ ] FOMO anxiety\n- [ ] Overconfidence\n- [ ] Pessimism about market\n- [ ] Impulsive behavior\n\n## Coping Strategies Used\n### What Helped\n- \n- \n- \n\n### What Didn\'t Help\n- \n- \n- \n\n## Today\'s Trading Mindset\n### Before Market Open\n- **Primary Focus:** \n- **Mantra/Affirmation:** \n- **Intention:** \n\n### During Trading\n- **Rule Reminder:** \n- **Emotional Goal:** \n- **Success Definition:** \n\n### End of Day\n- **Gratitude:** \n- **Learning:** \n- **Tomorrow\'s Intention:** \n\n## Action Items\n### This Week\n- [ ] \n- [ ] \n- [ ] \n\n### Mental Training Goals\n- [ ] \n- [ ] \n- [ ] \n\n## Professional Support\n### When to Seek Help\n- [ ]连续5天亏损\n- [ ]情绪严重失控\n- [ ]影响日常生活\n- [ ]无法遵循交易规则\n\n**Remember:** Trading psychology is just as important as technical skills. Master your mind to master the markets.'
  },

  // ANALYSIS TEMPLATES
  {
    name: 'Market Analysis',
    description: 'Comprehensive technical and fundamental market analysis',
    category: 'analysis',
    tags: ['market', 'technical', 'fundamental', 'analysis'],
    isFavorite: true,
    content: `# Market Analysis - {{date}}

## Overall Market Assessment
### Trend Analysis
- **S&P 500 Trend:** {{spx_trend}}
- **NASDAQ Trend:** {{nasdaq_trend}}
- **Dow Jones Trend:** {{dow_trend}}
- **Russell 2000:** {{russell_trend}}

### Key Market Levels
- **S&P 500:** Current {{spx_price}} | Support {{spx_support}} | Resistance {{spx_resistance}}
- **NASDAQ:** Current {{nasdaq_price}} | Support {{nasdaq_support}} | Resistance {{nasdaq_resistance}}
- **VIX Level:** {{vix_level}} (Fear/Greed)

## Technical Analysis
### Daily Charts
#### S&P 500
- **Pattern:** {{spx_pattern}}
- **Support:** {{spx_support_level}}
- **Resistance:** {{spx_resistance_level}}
- **Key Moving Averages:** 
  - 20-day: {{ma20_spX}}
  - 50-day: {{ma50_spX}}
  - 200-day: {{ma200_spX}}

#### NASDAQ
- **Pattern:** {{nasdaq_pattern}}
- **Support:** {{nasdaq_support_level}}
- **Resistance:** {{nasdaq_resistance_level}}
- **Key Moving Averages:** 
  - 20-day: {{ma20_nasdaq}}
  - 50-day: {{ma50_nasdaq}}
  - 200-day: {{ma200_nasdaq}}

### Intraday Analysis
- **Opening Range:** {{opening_range}}
- **Midday Consolidation:** {{midday_consolidation}}
- **Closing Action:** {{closing_action}}
- **Volume Pattern:** {{volume_pattern}}

## Fundamental Analysis
### Economic Indicators
- **Interest Rates:** {{interest_rates}}
- **Inflation (CPI):** {{cpi}}%
- **Unemployment:** {{unemployment}}%
- **GDP Growth:** {{gdp_growth}}%
- **Consumer Confidence:** {{consumer_confidence}}

### Corporate Earnings
- **Q{{quarter}} Earnings Season:**
  - **Beat Rate:** {{beat_rate}}%
  - **Revenue Growth:** {{revenue_growth}}%
  - **Guidance:** {{guidance}}
  - **Forward P/E:** {{forward_pe}}

### Market Drivers
- **Primary Driver:** {{primary_driver}}
- **Secondary Driver:** {{secondary_driver}}
- **Risk Factor:** {{risk_factor}}
- **Opportunity:** {{opportunity}}

## Sector Analysis
### Leading Sectors
1. **{{sector1}}** - Performance: {{performance1}}%
   - **Key Stocks:** {{key_stocks1}}
   - **Catalyst:** {{catalyst1}}

2. **{{sector2}}** - Performance: {{performance2}}%
   - **Key Stocks:** {{key_stocks2}}
   - **Catalyst:** {{catalyst2}}

3. **{{sector3}}** - Performance: {{performance3}}%
   - **Key Stocks:** {{key_stocks3}}
   - **Catalyst:** {{catalyst3}}

### Lagging Sectors
1. **{{lagging_sector1}}** - Performance: {{lag_performance1}}%
2. **{{lagging_sector2}}** - Performance: {{lag_performance2}}%

## Sentiment Analysis
### Market Sentiment
- **Fear & Greed Index:** {{fear_greed}} (0-100)
- **Put/Call Ratio:** {{put_call_ratio}}
- **Insider Selling:** {{insider_selling}}
- **Short Interest:** {{short_interest}}

### News Flow
- **Positive News:** {{positive_news}}
- **Negative News:** {{negative_news}}
- **Neutral News:** {{neutral_news}}

## Risk Assessment
### Systematic Risks
- [ ] Recession fears
- [ ] Geopolitical tensions
- [ ] Interest rate changes
- [ ] Currency fluctuations
- [ ] Regulatory changes

### Market Structure Risks
- [ ] High-frequency trading impact
- [ ] Options expiration effects
- [ ] Fed policy changes
- [ ] Market maker behavior

## Trading Implications
### Short-term Outlook (1-5 days)
- **Bias:** {{short_term_bias}}
- **Key Levels:** {{key_levels_short}}
- **Volatility Expectation:** {{volatility_short}}

### Medium-term Outlook (1-4 weeks)
- **Bias:** {{medium_term_bias}}
- **Key Levels:** {{key_levels_medium}}
- **Volatility Expectation:** {{volatility_medium}}

### Long-term Outlook (1-3 months)
- **Bias:** {{long_term_bias}}
- **Key Levels:** {{key_levels_long}}
- **Volatility Expectation:** {{volatility_long}}

## Action Items
### For Next Session
- [ ] Monitor {{monitor_level}}
- [ ] Watch for {{watch_catalyst}}
- [ ] Be ready for {{ready_for}}

### This Week
- [ ] Track {{track_metric}}
- [ ] Prepare for {{prepare_event}}
- [ ] Review strategy: {{review_strategy}}

**Analysis Summary:** {{analysis_summary}}

**Confidence Level:** {{confidence}}/10`
  },
  {
    name: 'Trade Setup Analysis',
    description: 'Detailed analysis of specific trade setups with entry/exit rules',
    category: 'analysis',
    tags: ['setup', 'entry', 'exit', 'rules'],
    isFavorite: true,
    content: '# Trade Setup Analysis - {{symbol}} - {{date}}\n\n## Setup Overview\n- **Symbol:** {{symbol}}\n- **Current Price:** ${{current_price}}\n- **Timeframe:** {{timeframe}}\n- **Setup Type:** {{setup_type}}\n- **Market Condition:** {{market_condition}}\n\n## Technical Setup\n### Chart Pattern\n- **Pattern Name:** {{pattern_name}}\n- **Pattern Status:** {{pattern_status}}\n- **Pattern Quality:** {{pattern_quality}}/10\n- **Measured Move:** {{measured_move}}\n\n### Key Levels\n- **Entry Level:** {{entry_level}}\n- **Stop Loss:** {{stop_loss}}\n- **Target 1:** {{target1}}\n- **Target 2:** {{target2}}\n- **Target 3:** {{target3}}\n\n### Moving Averages\n- **20-day MA:** {{ma20}} @ ${{price20}}\n- **50-day MA:** {{ma50}} @ ${{price50}}\n- **200-day MA:** {{ma200}} @ ${{price200}}\n- **Relationship:** {{ma_relationship}}\n\n### Volume Analysis\n- **Current Volume:** {{current_volume}} ({{volume_percentile}}th percentile)\n- **Average Volume:** {{avg_volume}}\n- **Volume Pattern:** {{volume_pattern}}\n- **Institutional Activity:** {{institutional_activity}}\n\n## Entry Rules\n### Primary Entry\n1. **Condition:** {{entry_condition1}}\n2. **Trigger:** {{entry_trigger1}}\n3. **Confirmation:** {{entry_confirmation1}}\n\n### Alternative Entry\n1. **Condition:** {{entry_condition2}}\n2. **Trigger:** {{entry_trigger2}}\n3. **Confirmation:** {{entry_confirmation2}}\n\n### Entry Timing\n- **Best Entry Time:** {{entry_time}}\n- **Avoid Times:** {{avoid_times}}\n- **Market Session:** {{market_session}}\n\n## Risk Management\n### Position Sizing\n- **Account Risk:** {{account_risk}}%\n- **Position Size:** {{position_size}} shares\n- **Dollar Risk:** ${{dollar_risk}}\n- **R Multiple Risk:** {{r_risk}}R\n\n### Stop Loss Rules\n- **Initial Stop:** {{initial_stop}} at ${{stop_price}}\n- **Stop Justification:** {{stop_justification}}\n- **Hard Stop vs Trailing:** {{stop_type}}\n- **Adjustment Rules:** {{adjustment_rules}}\n\n### Profit Taking\n- **Partial Profit:** {{partial_profit}}% at ${{partial_price}}\n- **Full Profit:** {{full_profit}}% at ${{full_price}}\n- **Trailing Stop:** {{trailing_stop}}%\n- **Time Stop:** {{time_stop}} hours\n\n## Scenario Analysis\n### Bullish Scenario\n- **Probability:** {{bullish_probability}}%\n- **Target:** ${{bullish_target}}\n- **Timeline:** {{bullish_timeline}}\n- **Key Catalyst:** {{bullish_catalyst}}\n\n### Bearish Scenario\n- **Probability:** {{bearish_probability}}%\n- **Target:** ${{bearish_target}}\n- **Timeline:** {{bearish_timeline}}\n- **Key Risk:** {{bearish_risk}}\n\n### Sideways Scenario\n- **Probability:** {{sideways_probability}}%\n- **Range:** ${{sideways_range}}\n- **Strategy:** {{sideways_strategy}}\n\n## Trade Management\n### Scaling Rules\n- **Add On:** {{add_on_condition}} at ${{add_on_price}}\n- **Scale Out:** {{scale_out_condition}} at ${{scale_out_price}}\n- **Hedge Position:** {{hedge_condition}} at ${{hedge_price}}\n\n### Exit Strategies\n1. **Profit Target:** ${{profit_target}}\n2. **Time Exit:** {{time_exit}} hours\n3. **Technical Exit:** {{technical_exit}}\n4. **Trailing Stop:** {{trailing_exit}}\n\n## Market Context\n### Overall Market\n- **Market Trend:** {{market_trend}}\n- **Market Sentiment:** {{market_sentiment}}\n- **Sector Performance:** {{sector_performance}}\n- **Economic Calendar:** {{economic_calendar}}\n\n### Symbol-Specific\n- **Earnings:** {{earnings}}\n- **News:** {{news}}\n- **Analyst Ratings:** {{ratings}}\n- **Options Flow:** {{options_flow}}\n\n## Trade Execution Plan\n### Pre-Trade Checklist\n- [ ] Confirm setup quality\n- [ ] Check market conditions\n- [ ] Verify risk management\n- [ ] Review entry rules\n- [ ] Set alerts\n\n### During Trade\n- [ ] Monitor key levels\n- [ ] Watch volume\n- [ ] Check market context\n- [ ] Follow exit rules\n- [ ] Maintain discipline\n\n### Post-Trade\n- [ ] Document execution\n- [ ] Analyze results\n- [ ] Extract lessons\n- [ ] Update trading plan\n\n## Success Metrics\n### Entry Quality\n- **Setup Score:** {{setup_score}}/10\n- **Risk/Reward:** {{risk_reward}}\n- **Market Context:** {{market_context}}/10\n- **Overall Rating:** {{overall_rating}}/10\n\n**Setup Confidence:** {{confidence}}/10\n\n**Key Success Factor:** {{success_factor}}\n\n**Primary Risk:** {{primary_risk}}'
  },

  // STRATEGY TEMPLATES
  {
    name: 'Weekly Strategy',
    description: 'Weekly market conditions, key opportunities, and strategy focus',
    category: 'planning',
    tags: ['weekly', 'strategy', 'opportunities', 'planning'],
    isFavorite: false,
    content: '# Weekly Strategy - Week of {{week_start}} to {{week_end}}\n\n## Market Environment Assessment\n### Overall Market Trend\n- **Primary Trend:** Bullish / Bearish / Sideways\n- **Trend Strength:** {{trend_strength}}/10\n- **Market Sentiment:** Optimistic / Neutral / Pessimistic\n- **Volatility Environment:** High / Medium / Low\n\n### Key Market Themes\n1. **Primary Theme:** {{primary_theme}}\n2. **Secondary Theme:** {{secondary_theme}}\n3. **Risk Theme:** {{risk_theme}}\n4. **Opportunity Theme:** {{opportunity_theme}}\n\n## Economic Calendar Focus\n### High Impact Events This Week\n- **{{event1_date}}:** {{event1}} - Impact: {{event1_impact}}\n- **{{event2_date}}:** {{event2}} - Impact: {{event2_impact}}\n- **{{event3_date}}:** {{event3}} - Impact: {{event3_impact}}\n- **{{event4_date}}:** {{event4}} - Impact: {{event4_impact}}\n\n### Earnings Highlights\n#### Before Market Open\n- **{{earnings1_company}}** - {{earnings1_date}} - Expected: {{earnings1_expected}}\n- **{{earnings2_company}}** - {{earnings2_date}} - Expected: {{earnings2_expected}}\n\n#### After Market Close\n- **{{earnings3_company}}** - {{earnings3_date}} - Expected: {{earnings3_expected}}\n- **{{earnings4_company}}** - {{earnings4_date}} - Expected: {{earnings4_expected}}\n\n## Key Levels to Watch\n### Major Indices\n- **S&P 500:** Support {{spx_support}} | Resistance {{spx_resistance}}\n- **NASDAQ:** Support {{nasdaq_support}} | Resistance {{nasdaq_resistance}}\n- **Russell 2000:** Support {{russell_support}} | Resistance {{russell_resistance}}\n\n### VIX Analysis\n- **Current Level:** {{vix_level}}\n- **Support:** {{vix_support}}\n- **Resistance:** {{vix_resistance}}\n- **Mean Reversion Target:** {{vix_target}}\n\n## Sector Strategy\n### Leading Sectors (Focus Areas)\n1. **{{sector1}}** - Strategy: {{sector1_strategy}}\n   - **Key Stocks:** {{sector1_stocks}}\n   - **Catalyst:** {{sector1_catalyst}}\n\n2. **{{sector2}}** - Strategy: {{sector2_strategy}}\n   - **Key Stocks:** {{sector2_stocks}}\n   - **Catalyst:** {{sector2_catalyst}}\n\n3. **{{sector3}}** - Strategy: {{sector3_strategy}}\n   - **Key Stocks:** {{sector3_stocks}}\n   - **Catalyst:** {{sector3_catalyst}}\n\n### Lagging Sectors (Avoid/Caution)\n1. **{{lagging_sector1}}** - Avoid / Short / Wait\n2. **{{lagging_sector2}}** - Avoid / Short / Wait\n\n## Weekly Trading Plan\n### Monday Strategy\n- **Focus:** {{monday_focus}}\n- **Key Level:** {{monday_level}}\n- **Expected Move:** {{monday_move}}\n- **Risk Level:** {{monday_risk}}\n\n### Mid-Week (Tuesday-Thursday)\n- **Focus:** {{midweek_focus}}\n- **Strategy:** {{midweek_strategy}}\n- **Volatility Expectation:** {{midweek_volatility}}\n- **Event Risk:** {{midweek_event}}\n\n### Friday Strategy\n- **Focus:** {{friday_focus}}\n- **Position Management:** {{friday_positions}}\n- **Weekend Risk:** {{friday_risk}}\n- **Next Week Prep:** {{next_week_prep}}\n\n## Risk Management This Week\n### Daily Risk Limits\n- **Monday:** ${{monday_risk}} (Risk per trade: {{monday_rpt}}%)\n- **Tuesday:** ${{tuesday_risk}} (Risk per trade: {{tuesday_rpt}}%)\n- **Wednesday:** ${{wednesday_risk}} (Risk per trade: {{wednesday_rpt}}%)\n- **Thursday:** ${{thursday_risk}} (Risk per trade: {{thursday_rpt}}%)\n- **Friday:** ${{friday_risk}} (Risk per trade: {{friday_rpt}}%)\n\n### Event Risk Management\n- **Pre-Event:** Reduce size by {{pre_event_reduction}}%\n- **Post-Event:** Wait {{post_event_wait}} minutes before new positions\n- **High Volatility:** Maximum {{max_risk}}% account risk\n\n## Performance Targets\n### Weekly Goals\n- **P&L Target:** ${{weekly_pnl_target}}\n- **Win Rate Target:** {{weekly_win_rate}}%\n- **Maximum Drawdown:** ${{weekly_max_dd}}\n- **Sharpe Ratio Target:** {{weekly_sharpe}}\n\n### Daily Breakdown\n- **Monday:** ${{monday_target}}\n- **Tuesday:** ${{tuesday_target}}\n- **Wednesday:** ${{wednesday_target}}\n- **Thursday:** ${{thursday_target}}\n- **Friday:** ${{friday_target}}\n\n## Key Opportunities\n### High Probability Setups\n1. **{{opportunity1}}**\n   - **Setup:** {{opportunity1_setup}}\n   - **Entry:** {{opportunity1_entry}}\n   - **Target:** {{opportunity1_target}}\n   - **Probability:** {{opportunity1_probability}}%\n\n2. **{{opportunity2}}**\n   - **Setup:** {{opportunity2_setup}}\n   - **Entry:** {{opportunity2_entry}}\n   - **Target:** {{opportunity2_target}}\n   - **Probability:** {{opportunity2_probability}}%\n\n### News-Driven Opportunities\n- **{{news_opportunity1}}**\n- **{{news_opportunity2}}**\n- **{{news_opportunity3}}**\n\n## Areas to Avoid\n### High Risk Situations\n1. **{{avoid1}}**\n2. **{{avoid2}}**\n3. **{{avoid3}}**\n\n### Market Conditions to Avoid Trading\n- [ ] High volatility without clear direction\n- [ ] Major economic announcements\n- [ ] Low volume holiday sessions\n- [ ] First/last 15 minutes of session\n\n## Mental Preparation\n### Weekly Affirmations\n1. "{{affirmation1}}"\n2. "{{affirmation2}}"\n3. "{{affirmation3}}"\n\n### Focus Areas\n- **Strength to Leverage:** {{strength}}\n- **Weakness to Manage:** {{weakness}}\n- **Rule to Follow:** {{rule}}\n\n## Sunday Preparation Checklist\n- [ ] Review economic calendar\n- [ ] Identify key levels\n- [ ] Plan position sizes\n- [ ] Set alerts\n- [ ] Mental preparation\n- [ ] Review last week\'s performance\n- [ ] Adjust strategy if needed\n\n**Weekly Mantra:** "{{weekly_mantra}}"\n\n**Success Formula:** Preparation + Discipline + Patience = Consistent Performance'
  },
  {
    name: 'Quarterly Goals',
    description: 'Quarterly performance targets, milestones, and strategic planning',
    category: 'planning',
    tags: ['quarterly', 'goals', 'targets', 'milestones'],
    isFavorite: false,
    content: '# Quarterly Trading Goals - Q{{quarter}} {{year}}\n\n## Financial Objectives\n### Primary Financial Goals\n- **Total P&L Target:** ${{total_pnl_target}}\n- **Monthly P&L Targets:**\n  - Month 1: ${{month1_target}}\n  - Month 2: ${{month2_target}}\n  - Month 3: ${{month3_target}}\n\n### Performance Metrics\n- **Target Win Rate:** {{win_rate_target}}%\n- **Target Profit Factor:** {{profit_factor_target}}\n- **Target Sharpe Ratio:** {{sharpe_target}}\n- **Maximum Drawdown:** {{max_dd_target}}%\n- **Average R:R:** {{rr_target}}\n\n## Monthly Milestones\n### Month 1 ({{month1_name}})\n#### Goals\n- [ ] **P&L Target:** ${{month1_pnl}}\n- [ ] **Win Rate:** {{month1_win_rate}}%\n- [ ] **Max Drawdown:** ${{month1_dd}}\n- [ ] **New Strategies:** {{month1_strategies}}\n\n#### Key Focus Areas\n1. {{month1_focus1}}\n2. {{month1_focus2}}\n3. {{month1_focus3}}\n\n### Month 2 ({{month2_name}})\n#### Goals\n- [ ] **P&L Target:** ${{month2_pnl}}\n- [ ] **Win Rate:** {{month2_win_rate}}%\n- [ ] **Max Drawdown:** ${{month2_dd}}\n- [ ] **New Strategies:** {{month2_strategies}}\n\n#### Key Focus Areas\n1. {{month2_focus1}}\n2. {{month2_focus2}}\n3. {{month2_focus3}}\n\n### Month 3 ({{month3_name}})\n#### Goals\n- [ ] **P&L Target:** ${{month3_pnl}}\n- [ ] **Win Rate:** {{month3_win_rate}}%\n- [ ] **Max Drawdown:** ${{month3_dd}}\n- [ ] **New Strategies:** {{month3_strategies}}\n\n#### Key Focus Areas\n1. {{month3_focus1}}\n2. {{month3_focus2}}\n3. {{month3_focus3}}\n\n## Strategy Development\n### New Strategies to Develop\n1. **{{strategy1}}**\n   - **Target Month:** {{strategy1_month}}\n   - **Expected Performance:** {{strategy1_performance}}\n   - **Risk Level:** {{strategy1_risk}}\n\n2. **{{strategy2}}**\n   - **Target Month:** {{strategy2_month}}\n   - **Expected Performance:** {{strategy2_performance}}\n   - **Risk Level:** {{strategy2_risk}}\n\n3. **{{strategy3}}**\n   - **Target Month:** {{strategy3_month}}\n   - **Expected Performance:** {{strategy3_performance}}\n   - **Risk Level:** {{strategy3_risk}}\n\n### Strategies to Improve\n1. **{{improve_strategy1}}**\n   - **Current Performance:** {{current_perf1}}\n   - **Target Improvement:** {{target_improve1}}\n   - **Action Plan:** {{action_plan1}}\n\n2. **{{improve_strategy2}}**\n   - **Current Performance:** {{current_perf2}}\n   - **Target Improvement:** {{target_improve2}}\n   - **Action Plan:** {{action_plan2}}\n\n## Risk Management Objectives\n### Position Sizing\n- **Conservative Trades:** {{conservative_size}}% risk\n- **Moderate Trades:** {{moderate_size}}% risk\n- **Aggressive Trades:** {{aggressive_size}}% risk\n- **Maximum Position:** {{max_position}}% of account\n\n### Drawdown Management\n- **Daily Drawdown Limit:** {{daily_dd}}%\n- **Weekly Drawdown Limit:** {{weekly_dd}}%\n- **Monthly Drawdown Limit:** {{monthly_dd}}%\n- **Recovery Plan:** {{recovery_plan}}\n\n## Learning & Development\n### Educational Goals\n- [ ] Complete {{course1}}\n- [ ] Read books: {{books}}\n- [ ] Analyze {{analysis_hours}} hours of market data\n- [ ] Shadow successful traders: {{shadow_hours}} hours\n\n### Skill Development\n1. **{{skill1}}**\n   - **Current Level:** {{skill1_current}}\n   - **Target Level:** {{skill1_target}}\n   - **Training Plan:** {{skill1_plan}}\n\n2. **{{skill2}}**\n   - **Current Level:** {{skill2_current}}\n   - **Target Level:** {{skill2_target}}\n   - **Training Plan:** {{skill2_plan}}\n\n## Technology & Tools\n### Platform Improvements\n- [ ] Upgrade to {{platform_upgrade}}\n- [ ] Add {{new_indicator}} indicator\n- [ ] Implement {{automation_tool}} automation\n- [ ] Optimize {{speed_optimization}}\n\n### Data & Analysis\n- [ ] Access {{data_source1}}\n- [ ] Implement {{analysis_tool1}}\n- [ ] Create custom {{custom_metric}}\n- [ ] Set up {{alert_system}} alerts\n\n## Mental & Psychological Goals\n### Mental Training\n- [ ] Meditation: {{meditation_minutes}} minutes daily\n- [ ] Exercise: {{exercise_hours}} hours weekly\n- [ ] Sleep optimization: {{sleep_hours}} hours nightly\n- [ ] Stress management: {{stress_techniques}}\n\n### Psychology Improvement\n1. **{{psych_focus1}}**\n   - **Current Challenge:** {{challenge1}}\n   - **Improvement Strategy:** {{strategy1}}\n   - **Success Metrics:** {{metrics1}}\n\n2. **{{psych_focus2}}**\n   - **Current Challenge:** {{challenge2}}\n   - **Improvement Strategy:** {{strategy2}}\n   - **Success Metrics:** {{metrics2}}\n\n## Weekly Review Schedule\n### Sunday Planning Sessions\n- [ ] Review previous week\'s performance\n- [ ] Plan upcoming week\'s strategy\n- [ ] Set alerts and levels\n- [ ] Mental preparation\n\n### Wednesday Check-ins\n- [ ] Mid-week performance review\n- [ ] Strategy adjustment if needed\n- [ ] Risk management review\n- [ ] Goal progress assessment\n\n## Success Metrics\n### Quantitative Metrics\n- **P&L vs Target:** {{pnl_vs_target}}%\n- **Win Rate Achievement:** {{win_rate_ach}}%\n- **Drawdown Control:** {{dd_control}}%\n- **Strategy Performance:** {{strategy_perf}}%\n\n### Qualitative Metrics\n- **Discipline Score:** {{discipline_score}}/10\n- **Emotional Control:** {{emotional_score}}/10\n- **Process Adherence:** {{process_score}}/10\n- **Continuous Learning:** {{learning_score}}/10\n\n## Contingency Plans\n### If Behind Target\n- **1st Month:** {{contingency1_month1}}\n- **2nd Month:** {{contingency1_month2}}\n- **3rd Month:** {{contingency1_month3}}\n\n### If Ahead of Target\n- **Risk Management:** {{contingency2_risk}}\n- **Position Sizing:** {{contingency2_size}}\n- **Conservative Approach:** {{contingency2_conservative}}\n\n## Accountability\n### Self-Assessment Schedule\n- **Weekly:** Sunday evening review\n- **Bi-weekly:** Mid-quarter assessment\n- **Monthly:** Comprehensive month-end review\n- **Quarter-end:** Complete quarterly evaluation\n\n### Support System\n- **Trading Buddy:** {{trading_buddy}}\n- **Mentor:** {{mentor}}\n- **Accountability Partner:** {{partner}}\n- **Professional Support:** {{professional}}\n\n**Quarterly Commitment:** "{{quarterly_commitment}}"\n\n**Success Vision:** {{success_vision}}\n\n**Primary Focus:** {{primary_focus}}\n\n**Remember:** Consistency beats perfection. Small daily improvements lead to quarterly success.'
  },
  {
    name: 'Mistake Reflection',
    description: 'Comprehensive analysis of trading mistakes and improvement strategies',
    category: 'review',
    tags: ['mistake', 'reflection', 'improvement', 'lessons'],
    isFavorite: true,
    content: '# Mistake Reflection - {{date}}\n\n## Mistake Overview\n- **Date of Mistake:** {{mistake_date}}\n- **Time of Day:** {{mistake_time}}\n- **Market Condition:** {{market_condition}}\n- **Mistake Type:** {{mistake_type}}\n- **Severity:** Minor / Moderate / Major / Critical\n\n## Trade Details\n### What Happened\n- **Symbol:** {{symbol}}\n- **Setup:** {{setup}}\n- **Intended Action:** {{intended_action}}\n- **Actual Action:** {{actual_action}}\n- **Result:** $\\{{pnl}} ({{rr}}R)\n- **Time in Trade:** {{trade_duration}}\n\n### The Mistake\n1. **Primary Error:** {{primary_error}}\n2. **Secondary Error:** {{secondary_error}}\n3. **Root Cause:** {{root_cause}}\n\n## Mistake Analysis\n### What Went Wrong\n#### Technical Errors\n- [ ] **Entry Timing:** {{entry_timing}}\n- [ ] **Exit Timing:** {{exit_timing}}\n- [ ] **Position Sizing:** {{position_sizing}}\n- [ ] **Risk Management:** {{risk_management}}\n- [ ] **Stop Loss:** {{stop_loss}}\n\n#### Mental Errors\n- [ ] **Emotional Trading:** {{emotional_trading}}\n- [ ] **FOMO:** {{fomo}}\n- [ ] **Revenge Trading:** {{revenge_trading}}\n- [ ] **Overconfidence:** {{overconfidence}}\n- [ ] **Fear:** {{fear}}\n- [ ] **Greed:** {{greed}}\n\n#### Process Errors\n- [ ] **Rule Violation:** {{rule_violation}}\n- [ ] **Plan Deviation:** {{plan_deviation}}\n- [ ] **Lack of Preparation:** {{preparation}}\n- [ ] **Poor Analysis:** {{analysis}}\n- [ ] **No Contingency:** {{contingency}}\n\n### Contributing Factors\n1. **{{factor1}}**\n   - **Impact:** {{factor1_impact}}\n   - **Prevention:** {{factor1_prevention}}\n\n2. **{{factor2}}**\n   - **Impact:** {{factor2_impact}}\n   - **Prevention:** {{factor2_prevention}}\n\n3. **{{factor3}}**\n   - **Impact:** {{factor3_impact}}\n   - **Prevention:** {{factor3_prevention}}\n\n## Emotional Impact\n### During the Mistake\n- **Primary Emotion:** {{emotion_during}}\n- **Stress Level (1-10):** {{stress_level}}\n- **Confidence Impact:** {{confidence_impact}}\n- **Physical Reaction:** {{physical_reaction}}\n\n### After the Mistake\n- **Immediate Reaction:** {{immediate_reaction}}\n- **Learning Moment:** {{learning_moment}}\n- **Regret Level (1-10):** {{regret_level}}\n- **Determination to Improve:** {{determination}}\n\n## Pattern Recognition\n### Similar Past Mistakes\n1. **{{past_mistake1}}**\n   - **Similarity:** {{similarity1}}\n   - **Pattern:** {{pattern1}}\n\n2. **{{past_mistake2}}**\n   - **Similarity:** {{similarity2}}\n   - **Pattern:** {{pattern2}}\n\n3. **{{past_mistake3}}**\n   - **Similarity:** {{similarity3}}\n   - **Pattern:** {{pattern3}}\n\n### Underlying Pattern\n- **Core Pattern:** {{core_pattern}}\n- **Trigger:** {{trigger}}\n- **Warning Signs:** {{warning_signs}}\n\n## Impact Assessment\n### Financial Impact\n- **Direct Loss:** $\\{{direct_loss}}\n- **Opportunity Cost:** $\\{{opportunity_cost}}\n- **Psychological Cost:** {{psych_cost}}\n- **Time Cost:** {{time_cost}}\n\n### Performance Impact\n- **Daily P&L Impact:** {{daily_pnl_impact}}\n- **Weekly Goal Impact:** {{weekly_goal_impact}}\n- **Monthly Target Impact:** {{monthly_target_impact}}\n- **Confidence Impact:** {{confidence_performance}}\n\n## Learning Extraction\n### Key Lessons Learned\n1. **{{lesson1}}**\n   - **Why Important:** {{lesson1_importance}}\n   - **Application:** {{lesson1_application}}\n\n2. **{{lesson2}}**\n   - **Why Important:** {{lesson2_importance}}\n   - **Application:** {{lesson2_application}}\n\n3. **{{lesson3}}**\n   - **Why Important:** {{lesson3_importance}}\n   - **Application:** {{lesson3_application}}\n\n### Deeper Insights\n- **About Myself:** {{insight_myself}}\n- **About the Market:** {{insight_market}}\n- **About Trading:** {{insight_trading}}\n- **About Discipline:** {{insight_discipline}}\n\n## Action Plan\n### Immediate Actions (24-48 hours)\n- [ ] {{immediate_action1}}\n- [ ] {{immediate_action2}}\n- [ ] {{immediate_action3}}\n- [ ] {{immediate_action4}}\n\n### Short-term Actions (1-2 weeks)\n- [ ] {{short_action1}}\n- [ ] {{short_action2}}\n- [ ] {{short_action3}}\n- [ ] {{short_action4}}\n\n### Long-term Actions (1-3 months)\n- [ ] {{long_action1}}\n- [ ] {{long_action2}}\n- [ ] {{long_action3}}\n- [ ] {{long_action4}}\n\n## Prevention Strategy\n### Triggers to Avoid\n1. **{{trigger1}}**\n   - **Warning Signs:** {{warning1}}\n   - **Prevention:** {{prevention1}}\n   - **Alternative Action:** {{alternative1}}\n\n2. **{{trigger2}}**\n   - **Warning Signs:** {{warning2}}\n   - **Prevention:** {{prevention2}}\n   - **Alternative Action:** {{alternative2}}\n\n### Protective Measures\n- [ ] **Rule Update:** {{rule_update}}\n- [ ] **Process Change:** {{process_change}}\n- [ ] **Tool Improvement:** {{tool_improvement}}\n- [ ] **Mental Training:** {{mental_training}}\n\n### New Rules\n1. **{{new_rule1}}**\n   - **Enforcement:** {{rule1_enforcement}}\n   - **Consequence:** {{rule1_consequence}}\n\n2. **{{new_rule2}}**\n   - **Enforcement:** {{rule2_enforcement}}\n   - **Consequence:** {{rule2_consequence}}\n\n## Growth Mindset\n### What This Mistake Teaches Me\n- **{{growth1}}**\n- **{{growth2}}**\n- **{{growth3}}**\n\n### How I\'m Getting Stronger\n- **{{strength1}}**\n- **{{strength2}}**\n- **{{strength3}}**\n\n### Future Success Building\n- **Skills to Develop:** {{skills_develop}}\n- **Habits to Build:** {{habits_build}}\n- **Mindset to Cultivate:** {{mindset_cultivate}}\n\n## Gratitude and Acceptance\n### What I\'m Grateful For\n- **{{gratitude1}}**\n- **{{gratitude2}}**\n- **{{gratitude3}}**\n\n### Acceptance Statement\n"I accept this mistake as part of my learning journey. I choose to grow from it rather than be defined by it."\n\n## Support and Accountability\n### Who Can Help\n- **Mentor:** {{mentor}}\n- **Trading Partner:** {{partner}}\n- **Professional Help:** {{professional_help}}\n\n### Check-in Schedule\n- **Daily:** {{daily_checkin}}\n- **Weekly:** {{weekly_checkin}}\n- **Monthly:** {{monthly_checkin}}\n\n## Success Metrics\n### Improvement Indicators\n- **Rule Adherence:** {{rule_adherence}}%\n- **Process Following:** {{process_following}}%\n- **Emotional Control:** {{emotional_control}}/10\n- **Learning Application:** {{learning_application}}%\n\n**Key Takeaway:** {{key_takeaway}}\n\n**Commitment:** {{commitment}}\n\n**Visualization:** {{visualization}}\n\n**Remember:** Every expert was once a beginner. Every mistake is a stepping stone to mastery.'
  }
];

export default function TemplateManager({
  templates,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateUse,
  onClose
}: TemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteTemplate['category'] | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NoteTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'favorites' | 'recent' | 'prebuilt'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as NoteTemplate['category'],
    content: '',
    tags: [] as string[],
    isFavorite: false
  });

  // Combine predefined and user templates
  const allTemplates = [
    ...PREDEFINED_TEMPLATES.map((template, index) => ({
      ...template,
      id: `predefined-${index}`,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastUsed: '2024-01-01T00:00:00.000Z',
      usageCount: Math.floor(Math.random() * 50) + 5
    })),
    ...templates
  ];

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    // Additional filters
    const matchesFilter = 
      templateFilter === 'all' ||
      (templateFilter === 'favorites' && template.isFavorite) ||
      (templateFilter === 'recent' && template.usageCount > 10) ||
      (templateFilter === 'prebuilt' && template.id.startsWith('predefined-'));
    
    return matchesSearch && matchesCategory && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'usage':
      default:
        return b.usageCount - a.usageCount;
    }
  });

  // Template variable replacement
  const replaceTemplateVariables = (content: string, variables: Record<string, string> = {}) => {
    const defaultVariables = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      quarter: Math.ceil((new Date().getMonth() + 1) / 3).toString(),
      week_start: new Date(Date.now() - (new Date().getDay() * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      week_end: new Date(Date.now() + ((6 - new Date().getDay()) * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      ...variables
    };
    
    let result = content;
    Object.entries(defaultVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    
    return result;
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) return;
    
    onTemplateCreate(newTemplate);
    setNewTemplate({
      name: '',
      description: '',
      category: 'custom',
      content: '',
      tags: [],
      isFavorite: false
    });
    setShowCreateForm(false);
  };

  const handleEditTemplate = () => {
    if (!editingTemplate || !newTemplate.name.trim()) return;
    
    onTemplateUpdate(editingTemplate.id, newTemplate);
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      description: '',
      category: 'custom',
      content: '',
      tags: [],
      isFavorite: false
    });
  };

  const handleUseTemplate = (template: NoteTemplate) => {
    const processedContent = replaceTemplateVariables(template.content);
    onTemplateUse(template.id);
    onClose();
  };

  const handlePreviewTemplate = (template: NoteTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleQuickUseTemplate = (template: NoteTemplate) => {
    const processedContent = replaceTemplateVariables(template.content);
    // Create a quick note with the template
    onTemplateUse(template.id);
    onClose();
  };

  const handleToggleFavorite = (template: NoteTemplate) => {
    if (template.id.startsWith('predefined-')) return; // Can't favorite predefined templates
    onTemplateUpdate(template.id, { isFavorite: !template.isFavorite });
  };

  const startEdit = (template: NoteTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      tags: template.tags,
      isFavorite: template.isFavorite
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Template Library</h2>
            <p className="text-gray-600 dark:text-gray-400">Choose a template to start your note</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        {showCreateForm || editingTemplate ? (
          /* Create/Edit Form */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as NoteTemplate['category'] })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter template content with {{placeholders}} for dynamic values"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.tags.join(', ')}
                    onChange={(e) => setNewTemplate({ 
                      ...newTemplate, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="trading, analysis, daily"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-favorite"
                    checked={newTemplate.isFavorite}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isFavorite: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is-favorite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Mark as favorite
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={editingTemplate ? handleEditTemplate : handleCreateTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      setNewTemplate({
                        name: '',
                        description: '',
                        category: 'custom',
                        content: '',
                        tags: [],
                        isFavorite: false
                      });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Template Library */
          <div className="flex-1 flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setTemplateFilter('all')}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                      templateFilter === 'all' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    All Templates
                  </button>
                  <button
                    onClick={() => setTemplateFilter('favorites')}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                      templateFilter === 'favorites' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Favorites
                  </button>
                  <button
                    onClick={() => setTemplateFilter('prebuilt')}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                      templateFilter === 'prebuilt' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Pre-built
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'recent')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="usage">Most Used</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="recent">Recently Created</option>
                </select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  All Templates
                  <span className="ml-auto text-xs text-gray-500">
                    {allTemplates.length}
                  </span>
                </button>

                {Object.entries(CATEGORIES).map(([key, category]) => {
                  const Icon = category.icon;
                  const count = allTemplates.filter(t => t.category === key).length;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as NoteTemplate['category'])}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === key 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                      <span className="ml-auto text-xs text-gray-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No templates found. Try adjusting your search or create a new template.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const category = CATEGORIES[template.category];
                    const Icon = category.icon;
                    const isPredefined = template.id.startsWith('predefined-');
                    
                    return (
                      <div
                        key={template.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 relative group"
                      >
                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePreviewTemplate(template)}
                              className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              title="Preview Template"
                            >
                              <Eye className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                            {!isPredefined && (
                              <button
                                onClick={() => handleToggleFavorite(template)}
                                className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                title={template.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Star className={`w-3 h-3 ${
                                  template.isFavorite 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-400'
                                }`} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-lg ${category.color} mr-2`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate pr-8">
                                {template.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {category.name}
                              </p>
                            </div>
                          </div>
                          
                          {template.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="flex items-center space-x-2 mb-3">
                          {template.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {template.tags.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{template.tags.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {isPredefined ? 'Pre-built' : `Used ${template.usageCount}x`}
                          </span>
                          <span className="text-xs">
                            {Math.round(template.content.length / 100)} sections
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Use Template
                          </button>
                          
                          {!isPredefined && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => startEdit(template)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => onTemplateDelete(template.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {previewTemplate.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {previewTemplate.description}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleUseTemplate(previewTemplate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Template Variables:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                  {['date', 'time', 'month', 'year', 'quarter', 'week_start', 'week_end'].map(variable => (
                    <div key={variable} className="flex items-center space-x-2 text-sm">
                      <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                        {'{'}{'{'}{variable}{'}'}{'}'}
                      </code>
                      <span className="text-gray-500 dark:text-gray-400">
                        {variable.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Template Preview:</h4>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {replaceTemplateVariables(previewTemplate.content).substring(0, 2000)}
                    {previewTemplate.content.length > 2000 && (
                      <span className="text-gray-500">
                        ...
                        
[Content continues - {previewTemplate.content.length - 2000} more characters]
                      </span>
                    )}
                  </pre>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Category: {CATEGORIES[previewTemplate.category].name}</span>
                <span>•</span>
                <span>{previewTemplate.tags.length} tags</span>
                <span>•</span>
                <span>{previewTemplate.usageCount} uses</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleUseTemplate(previewTemplate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}