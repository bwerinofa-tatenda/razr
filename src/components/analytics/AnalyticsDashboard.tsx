import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  PieChart, 
  LineChart,
  Target,
  Brain,
  FileText,
  Search,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Hash,
  Tag,
  Archive,
  Zap,
  Award,
  Activity,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  NoteAnalyticsChart,
  GoalProgressChart,
  TemplateUsageChart,
  TagUsageChart,
  PerformanceCorrelationChart,
  EmotionalTrendChart
} from './Charts';
import { SmartRecommendations } from './SmartRecommendations';
import { ReportGenerator } from './ReportGenerator';
import { analyticsService, type NoteAnalytics, type TradingPatternAnalysis, type ContentUsageStats, type SmartRecommendation, type Report, type DateRange } from '../../lib/analyticsService';
import type { MockNote, MockTrade } from '../../lib/mockStorage';

interface AnalyticsDashboardProps {
  notes: MockNote[];
  trades: MockTrade[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ notes, trades, isOpen, onClose, className }) => {
  const { user } = useAuth();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Analytics data state
  const [noteAnalytics, setNoteAnalytics] = useState<NoteAnalytics | null>(null);
  const [tradingPatterns, setTradingPatterns] = useState<TradingPatternAnalysis | null>(null);
  const [contentStats, setContentStats] = useState<ContentUsageStats | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Use real notes and trades data from props
        const noteAnalyticsData = analyticsService.getNoteAnalytics(notes, dateRange);
        const tradingPatternsData = analyticsService.getTradingPatternAnalysis(trades, dateRange);
        const contentStatsData = analyticsService.getContentUsageStats(notes, dateRange);
        const recommendationsData = analyticsService.getSmartRecommendations(notes, trades);
        
        setNoteAnalytics(noteAnalyticsData);
        setTradingPatterns(tradingPatternsData);
        setContentStats(contentStatsData);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user, dateRange, refreshTrigger, notes, trades]);

  // Refresh data
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Generate new report
  const handleGenerateReport = (type: 'weekly' | 'monthly' | 'quarterly' | 'custom') => {
    if (!dateRange) return;
    
    setIsGeneratingReport(true);
    try {
      const newReport = analyticsService.generateReport(type, dateRange, notes, trades);
      setReports(prev => [newReport, ...prev]);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Date range presets
  const datePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 }
  ];

  const handleDatePreset = (days: number) => {
    setDateRange({
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date()
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full h-[90vh] mx-4 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Insights</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of your trading journal patterns and performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select onValueChange={(value) => handleDatePreset(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map(preset => (
                  <SelectItem key={preset.days} value={preset.days.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close Analytics"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`space-y-6 ${className}`}>
            {/* Main Analytics Tabs */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Overview</h3>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Notes"
                    value={noteAnalytics?.totalNotes || 0}
                    icon={FileText}
                    trend={{ value: 12, direction: 'up' }}
                    color="blue"
                  />
                  <MetricCard
                    title="Notes This Week"
                    value={noteAnalytics?.notesCreated?.weekly?.reduce((sum, w) => sum + w.count, 0) || 0}
                    icon={TrendingUp}
                    trend={{ value: 8, direction: 'up' }}
                    color="green"
                  />
                  <MetricCard
                    title="Tags Used"
                    value={contentStats?.tagUsage?.length || 0}
                    icon={Zap}
                    trend={{ value: 3, direction: 'up' }}
                    color="purple"
                  />
                  <MetricCard
                    title="Active Tags"
                    value={noteAnalytics?.mostUsedTags?.length || 0}
                    icon={Target}
                    trend={{ value: 15, direction: 'up' }}
                    color="orange"
                  />
                </div>
              </TabsContent>
              
              {/* Other Tabs Content */}
              <TabsContent value="notes" className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400">Notes analytics coming soon...</p>
              </TabsContent>
              
              <TabsContent value="patterns" className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400">Trading patterns analysis coming soon...</p>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400">Content analytics coming soon...</p>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-6">
                <SmartRecommendations recommendations={recommendations} />
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-6">
                <ReportGenerator 
                  onGenerateReport={handleGenerateReport}
                  reports={reports}
                  isGenerating={isGeneratingReport}
                  dateRange={dateRange}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; direction: 'up' | 'down' };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                {trend.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;