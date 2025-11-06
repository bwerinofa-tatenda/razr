import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Share2,
  Mail,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import type { Report, DateRange } from '../../lib/analyticsService';

interface ReportGeneratorProps {
  onGenerateReport: (type: 'weekly' | 'monthly' | 'quarterly' | 'custom') => void;
  reports: Report[];
  isGenerating: boolean;
  dateRange: DateRange;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  onGenerateReport, 
  reports, 
  isGenerating, 
  dateRange 
}) => {
  const [selectedType, setSelectedType] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [customDateRange, setCustomDateRange] = useState({
    start: dateRange.start.toISOString().split('T')[0],
    end: dateRange.end.toISOString().split('T')[0]
  });
  const [reportSettings, setReportSettings] = useState({
    includeCharts: true,
    includeRecommendations: true,
    includeInsights: true,
    includeExecutiveSummary: true,
    includeActionItems: true,
    format: 'pdf' as 'pdf' | 'html' | 'docx'
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'generating'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleGenerateReport = () => {
    onGenerateReport(selectedType);
  };

  const handleDownloadReport = (reportId: string) => {
    // In a real implementation, this would trigger the download
    console.log('Downloading report:', reportId);
  };

  const handleShareReport = (reportId: string) => {
    // In a real implementation, this would open sharing options
    console.log('Sharing report:', reportId);
  };

  const filteredReports = reports.filter(report => {
    const statusMatch = filterStatus === 'all' || report.status === filterStatus;
    const searchMatch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'generating': return Loader;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weekly': return Calendar;
      case 'monthly': return BarChart3;
      case 'quarterly': return TrendingUp;
      case 'custom': return Settings;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateReportSize = (report: Report) => {
    // Mock calculation - in reality this would be based on actual report data
    const baseSize = 500; // KB
    const chartBonus = report.content.charts.length * 200;
    return baseSize + chartBonus;
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create comprehensive reports with charts, insights, and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label>Report Type</Label>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Weekly Report</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Monthly Report</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="quarterly">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Quarterly Report</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Custom Report</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedType === 'custom' && (
              <div className="space-y-3">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-date" className="text-sm text-gray-600">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-sm text-gray-600">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Report Settings */}
            <div className="space-y-3">
              <Label>Report Content</Label>
              <div className="space-y-2">
                {[
                  { key: 'includeExecutiveSummary', label: 'Executive Summary', icon: Target },
                  { key: 'includeCharts', label: 'Charts and Visualizations', icon: BarChart3 },
                  { key: 'includeInsights', label: 'Key Insights', icon: Brain },
                  { key: 'includeRecommendations', label: 'Smart Recommendations', icon: TrendingUp },
                  { key: 'includeActionItems', label: 'Action Items', icon: CheckCircle }
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportSettings[key as keyof typeof reportSettings] as boolean}
                      onChange={(e) => setReportSettings(prev => ({ 
                        ...prev, 
                        [key]: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <div className="space-y-3">
              <Label>Output Format</Label>
              <Select 
                value={reportSettings.format} 
                onValueChange={(value: any) => setReportSettings(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="html">HTML Web Page</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating your report...</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-gray-500">
                  This may take a few moments while we analyze your data and generate charts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Report Templates
            </CardTitle>
            <CardDescription>
              Pre-configured report templates for different purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: 'Performance Review',
                description: 'Comprehensive analysis of trading performance and goal progress',
                icon: TrendingUp,
                color: 'bg-blue-50 text-blue-600 border-blue-200'
              },
              {
                name: 'Learning Progress',
                description: 'Track skill development and learning milestones',
                icon: Brain,
                color: 'bg-purple-50 text-purple-600 border-purple-200'
              },
              {
                name: 'Journal Analysis',
                description: 'Deep dive into journaling patterns and content usage',
                icon: FileText,
                color: 'bg-green-50 text-green-600 border-green-200'
              },
              {
                name: 'Strategy Effectiveness',
                description: 'Analyze strategy performance and optimization opportunities',
                icon: Target,
                color: 'bg-orange-50 text-orange-600 border-orange-200'
              }
            ].map((template, index) => (
              <div key={index} className={`p-4 rounded-lg border ${template.color}`}>
                <div className="flex items-center space-x-3">
                  <template.icon className="w-6 h-6" />
                  <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm opacity-80">{template.description}</p>
                  </div>
                  <Button variant="outline" size="sm">Use Template</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Generated Reports ({filteredReports.length})
              </CardTitle>
              <CardDescription>
                View, download, and share your previously generated reports
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const StatusIcon = getStatusIcon(report.status);
                const TypeIcon = getTypeIcon(report.type);
                
                return (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{report.title}</h4>
                            <Badge className={getStatusColor(report.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{formatDate(report.period.start)} - {formatDate(report.period.end)}</span>
                            <span>•</span>
                            <span>{calculateReportSize(report)} KB</span>
                            {report.downloadUrl && (
                              <>
                                <span>•</span>
                                <span>Generated {formatDate(report.generatedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        {report.status === 'completed' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id)}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleShareReport(report.id)}>
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                          </>
                        )}
                        {report.status === 'generating' && (
                          <Button variant="outline" size="sm" disabled>
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Report Content Summary */}
                    {report.status === 'completed' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Key Insights:</span>
                            <p className="font-medium">{report.content.keyInsights.length} items</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Charts:</span>
                            <p className="font-medium">{report.content.charts.length} charts</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Recommendations:</span>
                            <p className="font-medium">{report.content.recommendations.length} items</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Action Items:</span>
                            <p className="font-medium">{report.content.actionItems.length} items</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'Generate your first report to see it here.'
                  : `No ${filterStatus} reports found. Try adjusting your filters.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {reports.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Generating</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reports.filter(r => r.status === 'generating').length}
              </p>
            </div>
            <Loader className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold text-purple-900">
                {reports.filter(r => {
                  const generatedDate = new Date(r.generatedAt);
                  const now = new Date();
                  return generatedDate.getMonth() === now.getMonth() && 
                         generatedDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};