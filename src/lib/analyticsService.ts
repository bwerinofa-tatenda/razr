import type { MockNote, MockTrade } from './mockStorage';

// Analytics Data Types
export interface NoteAnalytics {
  totalNotes: number;
  notesCreated: NoteCountByPeriod;
  notesEdited: NoteCountByPeriod;
  notesDeleted: number;
  averageNoteLength: number;
  averageEditTime: number;
  mostActiveHours: number[];
  mostActiveDays: string[];
  mostUsedFolders: FolderUsage[];
  mostUsedTags: TagUsage[];
  templateUsage: TemplateUsage[];
  collaborationMetrics: CollaborationMetrics;
}

export interface NoteCountByPeriod {
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ week: string; count: number }>;
  monthly: Array<{ month: string; count: number }>;
}

export interface FolderUsage {
  folderId: string;
  folderName: string;
  noteCount: number;
  percentage: number;
}

export interface TagUsage {
  tagName: string;
  usageCount: number;
  percentage: number;
  color?: string;
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  effectiveness: number; // Success rate
}

export interface CollaborationMetrics {
  sharedNotes: number;
  commentsAdded: number;
  collaborativeSessions: number;
  averageResponseTime: number;
}

export interface TradingPatternAnalysis {
  goalProgress: GoalProgress[];
  strategyPerformance: StrategyPerformance[];
  mistakePatterns: MistakePattern[];
  emotionalTrends: EmotionalTrend[];
  learningProgress: LearningProgress[];
  performanceCorrelations: PerformanceCorrelation[];
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetValue: number;
  currentValue: number;
  progress: number; // percentage
  deadline: string;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
  trend: 'improving' | 'declining' | 'stable';
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  value: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  successRate: number;
  totalTrades: number;
  winningTrades: number;
  avgReturn: number;
  maxDrawdown: number;
  performance: PerformanceByPeriod;
}

export interface PerformanceByPeriod {
  daily: Array<{ date: string; pnl: number }>;
  weekly: Array<{ week: string; pnl: number }>;
  monthly: Array<{ month: string; pnl: number }>;
}

export interface MistakePattern {
  mistakeType: string;
  frequency: number;
  lastOccurrence: string;
  improvementTrend: 'improving' | 'worsening' | 'stable';
  impactScore: number;
  recommendations: string[];
}

export interface EmotionalTrend {
  emotion: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  correlation: number; // With performance
  frequency: number;
  timestamps: Array<{ timestamp: string; intensity: number }>;
}

export interface LearningProgress {
  skillArea: string;
  currentLevel: number; // 1-10
  improvementRate: number;
  practiceTime: number; // hours
  milestones: string[];
  nextLevelRequirements: string[];
}

export interface PerformanceCorrelation {
  factor1: string;
  factor2: string;
  correlationCoefficient: number;
  significance: number; // Statistical significance
  description: string;
}

export interface ContentUsageStats {
  mostAccessedNotes: NoteAccess[];
  searchPatterns: SearchPattern[];
  exportActivity: ExportActivity[];
  tagUsage: TagUsage[];
  workflowPatterns: WorkflowPattern[];
}

export interface NoteAccess {
  noteId: string;
  noteTitle: string;
  accessCount: number;
  lastAccessed: string;
  averageSessionTime: number;
  accessTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface SearchPattern {
  query: string;
  frequency: number;
  lastSearch: string;
  resultCount: number;
  category: string;
}

export interface ExportActivity {
  format: string;
  count: number;
  totalSize: number; // in bytes
  lastExport: string;
}

export interface WorkflowPattern {
  patternName: string;
  frequency: number;
  averageDuration: number;
  successRate: number;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  stepName: string;
  averageDuration: number;
  successRate: number;
  commonIssues: string[];
}

export interface SmartRecommendation {
  id: string;
  type: 'template' | 'content' | 'goal' | 'learning' | 'improvement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  reasoning: string;
  actionItems: string[];
  data: any; // Additional data for the recommendation
  relatedNotes?: string[];
  relatedGoals?: string[];
}

export interface Report {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  title: string;
  description: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  content: ReportContent;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
}

export interface ReportContent {
  executiveSummary: string;
  keyInsights: string[];
  metrics: Record<string, any>;
  charts: ReportChart[];
  recommendations: string[];
  actionItems: string[];
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'scatter';
  title: string;
  data: any;
  config: any;
}

export interface DateRange {
  start: Date;
  end: Date;
}

class AnalyticsService {
  // Note Analytics
  getNoteAnalytics(notes: MockNote[], dateRange?: DateRange): NoteAnalytics {
    try {
      const filteredNotes = this.filterNotesByDateRange(notes, dateRange);
      
      return {
        totalNotes: filteredNotes.length,
        notesCreated: this.calculateNoteCountByPeriod(filteredNotes, 'created_at'),
        notesEdited: this.calculateNoteCountByPeriod(filteredNotes, 'updated_at'),
        notesDeleted: this.calculateDeletedNotes(filteredNotes),
        averageNoteLength: this.calculateAverageNoteLength(filteredNotes),
        averageEditTime: this.calculateAverageEditTime(filteredNotes),
        mostActiveHours: this.getMostActiveHours(filteredNotes),
        mostActiveDays: this.getMostActiveDays(filteredNotes),
        mostUsedFolders: this.calculateFolderUsage(filteredNotes),
        mostUsedTags: this.calculateTagUsage(filteredNotes),
        templateUsage: this.calculateTemplateUsage(filteredNotes),
        collaborationMetrics: this.calculateCollaborationMetrics(filteredNotes)
      };
    } catch (error) {
      console.error('Error fetching note analytics:', error);
      throw error;
    }
  }

  // Trading Pattern Analysis
  getTradingPatternAnalysis(trades: MockTrade[], dateRange?: DateRange): TradingPatternAnalysis {
    try {
      const filteredTrades = this.filterTradesByDateRange(trades, dateRange);
      
      return {
        goalProgress: this.calculateGoalProgress(filteredTrades),
        strategyPerformance: this.calculateStrategyPerformance(filteredTrades),
        mistakePatterns: this.analyzeMistakePatterns(filteredTrades),
        emotionalTrends: this.analyzeEmotionalTrends(filteredTrades),
        learningProgress: this.calculateLearningProgress(filteredTrades),
        performanceCorrelations: this.calculatePerformanceCorrelations(filteredTrades)
      };
    } catch (error) {
      console.error('Error fetching trading pattern analysis:', error);
      throw error;
    }
  }

  // Content Usage Statistics
  getContentUsageStats(notes: MockNote[], dateRange?: DateRange): ContentUsageStats {
    try {
      const filteredNotes = this.filterNotesByDateRange(notes, dateRange);
      
      return {
        mostAccessedNotes: this.calculateMostAccessedNotes(filteredNotes),
        searchPatterns: this.analyzeSearchPatterns(),
        exportActivity: this.calculateExportActivity(),
        tagUsage: this.calculateTagUsage(filteredNotes),
        workflowPatterns: this.analyzeWorkflowPatterns(filteredNotes)
      };
    } catch (error) {
      console.error('Error fetching content usage stats:', error);
      throw error;
    }
  }

  // Smart Recommendations
  getSmartRecommendations(notes: MockNote[], trades: MockTrade[]): SmartRecommendation[] {
    try {
      const recommendations: SmartRecommendation[] = [];
      
      // Analyze patterns and generate recommendations
      recommendations.push(...this.analyzeNotePatternsForRecommendations(notes));
      recommendations.push(...this.analyzeGoalProgressForRecommendations(trades));
      recommendations.push(...this.analyzeLearningPatternsForRecommendations(notes, trades));
      
      // Sort by priority and confidence
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aScore = priorityOrder[a.priority] * a.confidence;
        const bScore = priorityOrder[b.priority] * b.confidence;
        return bScore - aScore;
      });
    } catch (error) {
      console.error('Error generating smart recommendations:', error);
      throw error;
    }
  }

  // Report Generation
  generateReport(type: 'weekly' | 'monthly' | 'quarterly' | 'custom', dateRange: DateRange, notes: MockNote[], trades: MockTrade[]): Report {
    try {
      const analytics = this.getNoteAnalytics(notes, dateRange);
      const patterns = this.getTradingPatternAnalysis(trades, dateRange);
      const contentStats = this.getContentUsageStats(notes, dateRange);
      const recommendations = this.getSmartRecommendations(notes, trades);

      const report: Report = {
        id: `report_${Date.now()}`,
        type,
        title: this.generateReportTitle(type, dateRange),
        description: this.generateReportDescription(type),
        generatedAt: new Date().toISOString(),
        period: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        },
        content: {
          executiveSummary: this.generateExecutiveSummary(analytics, patterns, contentStats),
          keyInsights: this.generateKeyInsights(analytics, patterns, contentStats, recommendations),
          metrics: {
            analytics,
            patterns,
            contentStats
          },
          charts: this.generateReportCharts(analytics, patterns, contentStats),
          recommendations: recommendations.slice(0, 5).map(r => r.title),
          actionItems: this.generateActionItems(recommendations)
        },
        status: 'completed'
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Search and Discovery
  async searchContent(query: string, filters?: {
    dateRange?: DateRange;
    tags?: string[];
    templates?: string[];
    contentType?: string[];
    minLength?: number;
    maxLength?: number;
  }): Promise<{ results: any[]; suggestions: string[]; totalCount: number }> {
    try {
      const notes = this.getMockNotes();
      const filteredNotes = this.filterNotesBySearchAndFilters(notes, query, filters);
      
      return {
        results: filteredNotes,
        suggestions: this.generateSearchSuggestions(query, notes),
        totalCount: filteredNotes.length
      };
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  // Private helper methods
  private getMockNotes(): MockNote[] {
    // Generate realistic mock data based on the existing pattern
    const categories = ['Trading Plan', 'Daily Journal', 'Strategy', 'Analysis', 'Review'];
    const tags = ['trading', 'strategy', 'analysis', 'psychology', 'risk-management', 'forex', 'stocks', 'crypto'];
    const templates = ['Basic Trading Plan', 'Trade Review', 'Market Analysis', 'Goal Setting', 'Mistake Analysis'];
    
    const notes: MockNote[] = [];
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
      const createdDaysAgo = Math.floor(Math.random() * 365);
      const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      const note: MockNote = {
        id: `note_${i + 1}`,
        title: `Trading Note ${i + 1}`,
        text: `This is the content of trading note ${i + 1}. It contains information about trading strategies, market analysis, and trading psychology. The note discusses various aspects of trading including risk management, emotional control, and market patterns.`,
        content_type: 'plain-text',
        category: categories[Math.floor(Math.random() * categories.length)],
        created_at: createdAt.toISOString(),
        updated_at: updatedAt.toISOString(),
        metadata: {
          tags: this.getRandomSubset(tags, Math.floor(Math.random() * 3) + 1),
          favorite: Math.random() > 0.8,
          pinned: Math.random() > 0.9,
          folderId: (Math.floor(Math.random() * 3) + 1).toString()
        }
      };
      
      notes.push(note);
    }
    
    return notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private getMockTrades(): MockTrade[] {
    // Generate realistic mock trade data
    const trades: MockTrade[] = [];
    const assets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AAPL', 'TSLA', 'BTC-USD', 'ETH-USD'];
    const emotions = ['confident', 'anxious', 'excited', 'fearful', 'greedy', 'patient', 'disciplined'];
    const sessions = ['Asia', 'London 1', 'London 2', 'London 3', 'New York 1', 'New York 2', 'New York 3'];
    
    const now = new Date();
    
    for (let i = 0; i < 200; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const time = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const trade: MockTrade = {
        id: `trade_${i + 1}`,
        asset: assets[Math.floor(Math.random() * assets.length)],
        asset_type: Math.random() > 0.5 ? 'FX' : (Math.random() > 0.5 ? 'Futures' : 'Metals') as 'FX' | 'Futures' | 'Metals' | 'Commodities',
        entry_tag: ['breakout', 'pullback', 'reversal'][Math.floor(Math.random() * 3)],
        trade_type: Math.random() > 0.5 ? 'long' : 'short',
        size: Math.floor(Math.random() * 10) + 1,
        session: sessions[Math.floor(Math.random() * sessions.length)] as any,
        duration: `${Math.floor(Math.random() * 480) + 15} minutes`, // 15-495 minutes
        outcome: Math.random() > 0.6 ? 'win' : (Math.random() > 0.5 ? 'loss' : 'break_even'),
        pnl: (Math.random() - 0.4) * 1000, // Bias towards wins
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        what_liked: 'Good entry timing',
        what_didnt_like: 'Should have waited for better signal',
        comment: 'Overall positive trade',
        time: time.toISOString(),
        system_quality_number: 3 + Math.random() * 2,
        analysis: 3 + Math.random() * 2,
        execution: 3 + Math.random() * 2,
        trade_management: 3 + Math.random() * 2,
        risk_management: 3 + Math.random() * 2,
        mindset: 3 + Math.random() * 2
      };
      
      trades.push(trade);
    }
    
    return trades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  private filterNotesByDateRange(notes: MockNote[], dateRange?: DateRange): MockNote[] {
    if (!dateRange) return notes;
    
    return notes.filter(note => {
      const createdAt = new Date(note.created_at);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
  }

  private filterTradesByDateRange(trades: MockTrade[], dateRange?: DateRange): MockTrade[] {
    if (!dateRange) return trades;
    
    return trades.filter(trade => {
      const tradeTime = new Date(trade.time);
      return tradeTime >= dateRange.start && tradeTime <= dateRange.end;
    });
  }

  private calculateNoteCountByPeriod(notes: MockNote[], field: 'created_at' | 'updated_at'): NoteCountByPeriod {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const daily: Array<{ date: string; count: number }> = [];
    const weekly: Array<{ week: string; count: number }> = [];
    const monthly: Array<{ month: string; count: number }> = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const count = notes.filter(note => {
        const noteDate = new Date(note[field]);
        return noteDate.toDateString() === date.toDateString();
      }).length;
      
      daily.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    // Generate last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const count = notes.filter(note => {
        const noteDate = new Date(note[field]);
        return noteDate >= weekStart && noteDate <= weekEnd;
      }).length;
      
      weekly.push({
        week: `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)}`,
        count
      });
    }
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = notes.filter(note => {
        const noteDate = new Date(note[field]);
        return noteDate >= monthStart && noteDate <= monthEnd;
      }).length;
      
      monthly.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        count
      });
    }
    
    return { daily, weekly, monthly };
  }

  private calculateDeletedNotes(notes: MockNote[]): number {
    return notes.filter(note => note.deleted_at).length;
  }

  private calculateAverageNoteLength(notes: MockNote[]): number {
    if (notes.length === 0) return 0;
    const totalLength = notes.reduce((sum, note) => sum + note.text.length, 0);
    return Math.round(totalLength / notes.length);
  }

  private calculateAverageEditTime(notes: MockNote[]): number {
    const notesWithUpdates = notes.filter(note => note.updated_at !== note.created_at);
    if (notesWithUpdates.length === 0) return 0;
    
    const totalTime = notesWithUpdates.reduce((sum, note) => {
      const created = new Date(note.created_at).getTime();
      const updated = new Date(note.updated_at).getTime();
      return sum + (updated - created);
    }, 0);
    
    return Math.round(totalTime / notesWithUpdates.length / (1000 * 60)); // minutes
  }

  private getMostActiveHours(notes: MockNote[]): number[] {
    const hourCounts: Record<number, number> = {};
    
    notes.forEach(note => {
      const hour = new Date(note.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private getMostActiveDays(notes: MockNote[]): string[] {
    const dayCounts: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    notes.forEach(note => {
      const dayIndex = new Date(note.created_at).getDay();
      const dayName = days[dayIndex];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    
    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  private calculateFolderUsage(notes: MockNote[]): FolderUsage[] {
    const folderCounts: Record<string, number> = {};
    const totalNotes = notes.length;
    
    notes.forEach(note => {
      const folderId = note.metadata?.folderId || 'unassigned';
      folderCounts[folderId] = (folderCounts[folderId] || 0) + 1;
    });
    
    return Object.entries(folderCounts)
      .map(([folderId, count]) => ({
        folderId,
        folderName: this.getFolderName(folderId),
        noteCount: count,
        percentage: Math.round((count / totalNotes) * 100)
      }))
      .sort((a, b) => b.noteCount - a.noteCount);
  }

  private calculateTagUsage(notes: MockNote[]): TagUsage[] {
    const tagCounts: Record<string, number> = {};
    const totalUsages = notes.reduce((sum, note) => {
      const tags = note.metadata?.tags || [];
      return sum + tags.length;
    }, 0);
    
    notes.forEach(note => {
      const tags = note.metadata?.tags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tagName, count]) => ({
        tagName,
        usageCount: count,
        percentage: Math.round((count / totalUsages) * 100),
        color: this.getTagColor(tagName)
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  private calculateTemplateUsage(notes: MockNote[]): TemplateUsage[] {
    // Mock template usage data
    const templates = [
      { id: 'template_1', name: 'Basic Trading Plan', usage: 15, effectiveness: 0.8 },
      { id: 'template_2', name: 'Trade Review', usage: 25, effectiveness: 0.9 },
      { id: 'template_3', name: 'Market Analysis', usage: 10, effectiveness: 0.7 },
      { id: 'template_4', name: 'Goal Setting', usage: 8, effectiveness: 0.85 },
      { id: 'template_5', name: 'Mistake Analysis', usage: 12, effectiveness: 0.75 }
    ];
    
    return templates.map(template => ({
      templateId: template.id,
      templateName: template.name,
      usageCount: template.usage,
      effectiveness: template.effectiveness
    }));
  }

  private calculateCollaborationMetrics(notes: MockNote[]): CollaborationMetrics {
    return {
      sharedNotes: Math.floor(notes.length * 0.1),
      commentsAdded: Math.floor(notes.length * 0.3),
      collaborativeSessions: Math.floor(notes.length * 0.05),
      averageResponseTime: 2.5 // hours
    };
  }

  private calculateGoalProgress(trades: MockTrade[]): GoalProgress[] {
    return [
      {
        goalId: 'goal_1',
        goalName: 'Monthly Win Rate',
        targetValue: 60,
        currentValue: 65,
        progress: 108,
        deadline: '2025-12-31',
        status: 'ahead',
        trend: 'improving',
        milestones: [
          { id: 'm1', name: '50% Win Rate', targetDate: '2025-01-31', status: 'completed', value: 50 },
          { id: 'm2', name: '55% Win Rate', targetDate: '2025-06-30', status: 'completed', value: 55 },
          { id: 'm3', name: '60% Win Rate', targetDate: '2025-12-31', status: 'pending', value: 60 }
        ]
      },
      {
        goalId: 'goal_2',
        goalName: 'Risk Management Score',
        targetValue: 4.5,
        currentValue: 4.2,
        progress: 93,
        deadline: '2025-11-30',
        status: 'on-track',
        trend: 'stable',
        milestones: []
      },
      {
        goalId: 'goal_3',
        goalName: 'Daily Trading Journal',
        targetValue: 22,
        currentValue: 18,
        progress: 82,
        deadline: '2025-11-30',
        status: 'behind',
        trend: 'improving',
        milestones: []
      }
    ];
  }

  private calculateStrategyPerformance(trades: MockTrade[]): StrategyPerformance[] {
    const strategies = [
      { id: 's1', name: 'Breakout Strategy', trades: 45, wins: 28, avgReturn: 2.3, maxDrawdown: 5.2 },
      { id: 's2', name: 'Mean Reversion', trades: 38, wins: 22, avgReturn: 1.8, maxDrawdown: 4.1 },
      { id: 's3', name: 'Trend Following', trades: 52, wins: 31, avgReturn: 2.1, maxDrawdown: 6.8 }
    ];
    
    return strategies.map(strategy => ({
      strategyId: strategy.id,
      strategyName: strategy.name,
      successRate: Math.round((strategy.wins / strategy.trades) * 100),
      totalTrades: strategy.trades,
      winningTrades: strategy.wins,
      avgReturn: strategy.avgReturn,
      maxDrawdown: strategy.maxDrawdown,
      performance: {
        daily: this.generatePerformanceData('daily') as Array<{ date: string; pnl: number }>,
        weekly: this.generatePerformanceData('weekly') as Array<{ week: string; pnl: number }>,
        monthly: this.generatePerformanceData('monthly') as Array<{ month: string; pnl: number }>
      }
    }));
  }

  private analyzeMistakePatterns(trades: MockTrade[]): MistakePattern[] {
    return [
      {
        mistakeType: 'Emotional Trading',
        frequency: 12,
        lastOccurrence: '2025-11-01',
        improvementTrend: 'improving',
        impactScore: 8.5,
        recommendations: [
          'Implement stricter entry criteria',
          'Use stop-loss orders consistently',
          'Take breaks after consecutive losses'
        ]
      },
      {
        mistakeType: 'Poor Risk Management',
        frequency: 8,
        lastOccurrence: '2025-10-28',
        improvementTrend: 'stable',
        impactScore: 9.2,
        recommendations: [
          'Define risk per trade before entry',
          'Never risk more than 2% per trade',
          'Use position sizing calculator'
        ]
      },
      {
        mistakeType: 'Overtrading',
        frequency: 15,
        lastOccurrence: '2025-11-03',
        improvementTrend: 'worsening',
        impactScore: 7.8,
        recommendations: [
          'Set daily trading limits',
          'Wait for high-probability setups',
          'Track trading frequency'
        ]
      }
    ];
  }

  private analyzeEmotionalTrends(trades: MockTrade[]): EmotionalTrend[] {
    const emotions = ['confidence', 'anxiety', 'greed', 'fear', 'patience'];
    
    return emotions.map(emotion => ({
      emotion,
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
      correlation: (Math.random() - 0.5) * 2, // -1 to 1
      frequency: Math.floor(Math.random() * 50) + 10,
      timestamps: this.generateEmotionalTimestamps(emotion)
    }));
  }

  private calculateLearningProgress(trades: MockTrade[]): LearningProgress[] {
    return [
      {
        skillArea: 'Technical Analysis',
        currentLevel: 7.5,
        improvementRate: 0.2,
        practiceTime: 45,
        milestones: [
          'Completed chart pattern course',
          'Mastered support/resistance',
          'Advanced Fibonacci levels'
        ],
        nextLevelRequirements: [
          'Complete advanced TA course',
          'Practice 100 more pattern trades',
          'Achieve 70% pattern success rate'
        ]
      },
      {
        skillArea: 'Risk Management',
        currentLevel: 6.8,
        improvementRate: 0.3,
        practiceTime: 32,
        milestones: [
          'Implemented 2% rule',
          'Using position calculator',
          'Setting stop losses'
        ],
        nextLevelRequirements: [
          'Master advanced risk models',
          'Complete risk assessment course',
          'Achieve 95% rule compliance'
        ]
      }
    ];
  }

  private calculatePerformanceCorrelations(trades: MockTrade[]): PerformanceCorrelation[] {
    return [
      {
        factor1: 'Emotional State',
        factor2: 'Trade Outcome',
        correlationCoefficient: 0.45,
        significance: 0.85,
        description: 'Higher emotional control correlates with better trade outcomes'
      },
      {
        factor1: 'Risk Management Score',
        factor2: 'Monthly P&L',
        correlationCoefficient: 0.72,
        significance: 0.92,
        description: 'Strong correlation between risk management and profitability'
      },
      {
        factor1: 'Trade Frequency',
        factor2: 'Win Rate',
        correlationCoefficient: -0.38,
        significance: 0.76,
        description: 'Higher trade frequency tends to reduce win rate'
      }
    ];
  }

  // Continue with more helper methods...
  private calculateMostAccessedNotes(notes: MockNote[]): NoteAccess[] {
    return notes.slice(0, 10).map(note => ({
      noteId: note.id,
      noteTitle: note.title,
      accessCount: Math.floor(Math.random() * 50) + 1,
      lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      averageSessionTime: Math.floor(Math.random() * 20) + 5,
      accessTrend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any
    }));
  }

  private analyzeSearchPatterns(): SearchPattern[] {
    const queries = ['trading strategy', 'risk management', 'forex signals', 'technical analysis', 'psychology'];
    return queries.map(query => ({
      query,
      frequency: Math.floor(Math.random() * 20) + 1,
      lastSearch: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      resultCount: Math.floor(Math.random() * 100) + 10,
      category: 'content'
    }));
  }

  private calculateExportActivity(): ExportActivity[] {
    return [
      { format: 'PDF', count: 25, totalSize: 15 * 1024 * 1024, lastExport: '2025-11-01' },
      { format: 'DOCX', count: 18, totalSize: 8 * 1024 * 1024, lastExport: '2025-10-28' },
      { format: 'Markdown', count: 32, totalSize: 2 * 1024 * 1024, lastExport: '2025-11-05' },
      { format: 'JSON', count: 12, totalSize: 1 * 1024 * 1024, lastExport: '2025-10-30' }
    ];
  }

  private analyzeWorkflowPatterns(notes: MockNote[]): WorkflowPattern[] {
    return [
      {
        patternName: 'Trade Review Process',
        frequency: 15,
        averageDuration: 25, // minutes
        successRate: 0.85,
        steps: [
          { stepName: 'Review trade entry', averageDuration: 5, successRate: 0.95, commonIssues: [] },
          { stepName: 'Analyze exit timing', averageDuration: 8, successRate: 0.88, commonIssues: ['Emotion-based exits'] },
          { stepName: 'Document lessons', averageDuration: 12, successRate: 0.82, commonIssues: ['Incomplete notes'] }
        ]
      }
    ];
  }

  private getRandomSubset<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getFolderName(folderId: string): string {
    const names = { '1': 'Trade Notes', '2': 'Daily Journal', '3': 'Strategy' };
    return names[folderId as keyof typeof names] || 'Unassigned';
  }

  private getTagColor(tagName: string): string {
    const colors = {
      'trading': '#3B82F6',
      'strategy': '#10B981',
      'analysis': '#F59E0B',
      'psychology': '#EF4444',
      'risk-management': '#8B5CF6',
      'forex': '#06B6D4',
      'stocks': '#F97316',
      'crypto': '#84CC16'
    };
    return colors[tagName as keyof typeof colors] || '#6B7280';
  }

  private generatePerformanceData(period: 'daily' | 'weekly' | 'monthly'): Array<{ [key: string]: string | number }> {
    const data: Array<{ [key: string]: string | number }> = [];
    const periods = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date();
      if (period === 'daily') date.setDate(date.getDate() - i);
      else if (period === 'weekly') date.setDate(date.getDate() - i * 7);
      else date.setMonth(date.getMonth() - i);
      
      if (period === 'daily') {
        data.push({
          date: date.toISOString().split('T')[0],
          pnl: (Math.random() - 0.4) * 1000
        });
      } else if (period === 'weekly') {
        data.push({
          week: date.toISOString().split('T')[0],
          pnl: (Math.random() - 0.4) * 1000
        });
      } else {
        data.push({
          month: date.toISOString().split('T')[0],
          pnl: (Math.random() - 0.4) * 1000
        });
      }
    }
    
    return data;
  }

  private generateEmotionalTimestamps(emotion: string): Array<{ timestamp: string; intensity: number }> {
    const timestamps = [];
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      timestamps.push({
        timestamp: timestamp.toISOString(),
        intensity: Math.random() * 10
      });
    }
    return timestamps;
  }

  // Report generation methods
  private generateReportTitle(type: string, dateRange: DateRange): string {
    const start = dateRange.start.toLocaleDateString();
    const end = dateRange.end.toLocaleDateString();
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Trading Journal Report (${start} - ${end})`;
  }

  private generateReportDescription(type: string): string {
    const descriptions = {
      weekly: 'Weekly summary of trading activities, performance metrics, and key insights',
      monthly: 'Monthly comprehensive analysis of trading patterns, goal progress, and learning outcomes',
      quarterly: 'Quarterly strategic review covering performance trends, strategy effectiveness, and development areas',
      custom: 'Custom report tailored to specific analysis requirements and date range'
    };
    return descriptions[type as keyof typeof descriptions] || 'Custom trading journal report';
  }

  private generateExecutiveSummary(analytics: NoteAnalytics, patterns: TradingPatternAnalysis, content: ContentUsageStats): string {
    return `This period showed strong progress in your trading journal activities with ${analytics.totalNotes} total notes created. 
    Your goal progress indicates ${patterns.goalProgress.filter(g => g.status === 'ahead' || g.status === 'on-track').length} goals on track. 
    Content analysis reveals increasing engagement with your most used tags: ${analytics.mostUsedTags.slice(0, 3).map(t => t.tagName).join(', ')}.`;
  }

  private generateKeyInsights(analytics: NoteAnalytics, patterns: TradingPatternAnalysis, content: ContentUsageStats, recommendations: SmartRecommendation[]): string[] {
    return [
      'Note creation rate increased 15% compared to previous period',
      `Most productive writing time: ${analytics.mostActiveHours[0]}:00 hours`,
      `${patterns.mistakePatterns.length} distinct mistake patterns identified`,
      `${recommendations.length} improvement opportunities discovered`,
      'Strong correlation between risk management and performance observed'
    ];
  }

  private generateReportCharts(analytics: NoteAnalytics, patterns: TradingPatternAnalysis, content: ContentUsageStats): ReportChart[] {
    return [
      {
        id: 'note_creation_trend',
        type: 'line',
        title: 'Note Creation Trend',
        data: analytics.notesCreated.daily,
        config: { xAxis: 'date', yAxis: 'count' }
      },
      {
        id: 'goal_progress',
        type: 'bar',
        title: 'Goal Progress Overview',
        data: patterns.goalProgress,
        config: { xAxis: 'goalName', yAxis: 'progress' }
      }
    ];
  }

  private generateActionItems(recommendations: SmartRecommendation[]): string[] {
    return recommendations.slice(0, 5).map(rec => 
      `Priority: ${rec.priority} - ${rec.title}: ${rec.description}`
    );
  }

  private analyzeNotePatternsForRecommendations(notes: MockNote[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    
    // Analyze note frequency
    const recentNotes = notes.filter(note => {
      const daysSince = (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    if (recentNotes.length < 3) {
      recommendations.push({
        id: 'rec_1',
        type: 'content',
        title: 'Increase Journaling Frequency',
        description: 'Your recent journaling activity is below optimal levels. Consider setting a daily reminder.',
        priority: 'high',
        confidence: 0.8,
        reasoning: 'Consistent journaling correlates with improved trading performance',
        actionItems: [
          'Set daily journaling reminder',
          'Create a simple morning/evening routine',
          'Start with 5-minute daily reflections'
        ],
        data: { currentFrequency: recentNotes.length, targetFrequency: 7 }
      });
    }
    
    // Analyze template usage
    const templates = this.calculateTemplateUsage(notes);
    const underusedTemplate = templates.find(t => t.usageCount < 5);
    if (underusedTemplate) {
      recommendations.push({
        id: 'rec_2',
        type: 'template',
        title: 'Optimize Template Usage',
        description: `Consider using "${underusedTemplate.templateName}" more frequently for better structure.`,
        priority: 'medium',
        confidence: 0.7,
        reasoning: 'Consistent template use improves note quality and organization',
        actionItems: [
          'Review template examples',
          'Set template reminders',
          'Track template effectiveness'
        ],
        data: { templateName: underusedTemplate.templateName, currentUsage: underusedTemplate.usageCount }
      });
    }
    
    return recommendations;
  }

  private analyzeGoalProgressForRecommendations(trades: MockTrade[]): SmartRecommendation[] {
    const goals = this.calculateGoalProgress(trades);
    const atRiskGoals = goals.filter(g => g.status === 'behind' || g.trend === 'declining');
    
    return atRiskGoals.map(goal => ({
      id: `rec_goal_${goal.goalId}`,
      type: 'goal',
      title: `Focus on ${goal.goalName}`,
      description: `This goal needs attention to stay on track. Current progress: ${goal.progress}%`,
      priority: 'high',
      confidence: 0.9,
      reasoning: 'Goal tracking and adjustment improves achievement rates',
      actionItems: [
        'Review goal feasibility',
        'Adjust timeline if needed',
        'Increase focus activities',
        'Break down into smaller milestones'
      ],
      data: { goalId: goal.goalId, currentProgress: goal.progress, status: goal.status }
    }));
  }

  private analyzeLearningPatternsForRecommendations(notes: MockNote[], trades: MockTrade[]): SmartRecommendation[] {
    const learning = this.calculateLearningProgress(trades);
    
    return learning.map(area => ({
      id: `rec_learning_${area.skillArea.replace(/\s+/g, '_')}`,
      type: 'learning',
      title: `Develop ${area.skillArea} Skills`,
      description: `Current level: ${area.currentLevel}/10. Room for improvement in this area.`,
      priority: area.improvementRate < 0.2 ? 'medium' : 'low',
      confidence: 0.75,
      reasoning: 'Continuous learning in key areas drives performance improvement',
      actionItems: area.nextLevelRequirements,
      data: { skillArea: area.skillArea, currentLevel: area.currentLevel, practiceTime: area.practiceTime }
    }));
  }

  private filterNotesBySearchAndFilters(notes: MockNote[], query: string, filters?: any): any[] {
    let filtered = notes;
    
    // Apply search query
    if (query) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(searchQuery) ||
        note.text.toLowerCase().includes(searchQuery) ||
        note.category?.toLowerCase().includes(searchQuery)
      );
    }
    
    // Apply filters
    if (filters?.dateRange) {
      filtered = this.filterNotesByDateRange(filtered, filters.dateRange);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(note => {
        const noteTags = note.metadata?.tags || [];
        return filters.tags.some((tag: string) => noteTags.includes(tag));
      });
    }
    
    return filtered;
  }

  private generateSearchSuggestions(query: string, notes: MockNote[]): string[] {
    // Generate smart search suggestions based on query and existing content
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Suggest related terms
    if (lowerQuery.includes('trading')) {
      suggestions.push('trading psychology', 'trading strategy', 'risk management');
    }
    
    if (lowerQuery.includes('strategy')) {
      suggestions.push('strategy backtest', 'strategy performance', 'strategy optimization');
    }
    
    return suggestions;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
