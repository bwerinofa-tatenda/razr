import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Lightbulb,
  ArrowRight,
  Filter,
  Star,
  Zap,
  Award,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import type { SmartRecommendation } from '../../lib/analyticsService';

interface SmartRecommendationsProps {
  recommendations: SmartRecommendation[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ recommendations }) => {
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<'all' | 'template' | 'content' | 'goal' | 'learning' | 'improvement'>('all');
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const priorityMatch = filterPriority === 'all' || rec.priority === filterPriority;
    const typeMatch = filterType === 'all' || rec.type === filterType;
    return priorityMatch && typeMatch;
  });

  // Group by type
  const groupedRecommendations = filteredRecommendations.reduce((acc, rec) => {
    if (!acc[rec.type]) acc[rec.type] = [];
    acc[rec.type].push(rec);
    return acc;
  }, {} as Record<string, SmartRecommendation[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return Archive;
      case 'content': return BookOpen;
      case 'goal': return Target;
      case 'learning': return Brain;
      case 'improvement': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'template': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'content': return 'bg-green-50 text-green-600 border-green-200';
      case 'goal': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'learning': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'improvement': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Star;
    }
  };

  const handleApplyRecommendation = (recId: string) => {
    setAppliedRecommendations(prev => new Set([...prev, recId]));
  };

  const handleDismissRecommendation = (recId: string) => {
    // In a real implementation, this would update the recommendation status
    console.log('Dismissed recommendation:', recId);
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600">
            Continue using your trading journal to generate personalized insights and recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Recommendations</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered insights to improve your trading journal and performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            <option value="template">Templates</option>
            <option value="content">Content</option>
            <option value="goal">Goals</option>
            <option value="learning">Learning</option>
            <option value="improvement">Improvement</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Recommendations</p>
              <p className="text-2xl font-bold text-blue-900">{filteredRecommendations.length}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">High Priority</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredRecommendations.filter(r => r.priority === 'high').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Applied</p>
              <p className="text-2xl font-bold text-green-900">{appliedRecommendations.size}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Avg Confidence</p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(filteredRecommendations.reduce((sum, r) => sum + r.confidence, 0) / filteredRecommendations.length * 100)}%
              </p>
            </div>
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recommendations by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredRecommendations.length})</TabsTrigger>
          {Object.keys(groupedRecommendations).map(type => (
            <TabsTrigger key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)} ({groupedRecommendations[type].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              isApplied={appliedRecommendations.has(recommendation.id)}
              onApply={() => handleApplyRecommendation(recommendation.id)}
              onDismiss={() => handleDismissRecommendation(recommendation.id)}
            />
          ))}
        </TabsContent>

        {Object.entries(groupedRecommendations).map(([type, recs]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {recs.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                isApplied={appliedRecommendations.has(recommendation.id)}
                onApply={() => handleApplyRecommendation(recommendation.id)}
                onDismiss={() => handleDismissRecommendation(recommendation.id)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {filteredRecommendations.length === 0 && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No recommendations match your current filters. Try adjusting the priority or type filters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Individual Recommendation Card Component
interface RecommendationCardProps {
  recommendation: SmartRecommendation;
  isApplied: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  isApplied, 
  onApply, 
  onDismiss 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return Archive;
      case 'content': return BookOpen;
      case 'goal': return Target;
      case 'learning': return Brain;
      case 'improvement': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'template': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'content': return 'bg-green-50 text-green-600 border-green-200';
      case 'goal': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'learning': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'improvement': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Star;
    }
  };

  const TypeIcon = getTypeIcon(recommendation.type);
  const PriorityIcon = getPriorityIcon(recommendation.priority);
  const typeColor = getTypeColor(recommendation.type);
  const priorityColor = getPriorityColor(recommendation.priority);

  if (isApplied) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">{recommendation.title}</h3>
              <p className="text-sm text-green-700">Applied successfully</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Applied
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border ${typeColor}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{recommendation.title}</CardTitle>
              <CardDescription>{recommendation.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={priorityColor}>
              <PriorityIcon className="w-3 h-3 mr-1" />
              {recommendation.priority}
            </Badge>
            <Badge variant="outline">
              {Math.round(recommendation.confidence * 100)}% confident
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AI Confidence</span>
            <span className="font-medium">{Math.round(recommendation.confidence * 100)}%</span>
          </div>
          <Progress value={recommendation.confidence * 100} className="h-2" />
        </div>

        {/* Reasoning */}
        {recommendation.reasoning && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Why this matters:</strong> {recommendation.reasoning}
            </p>
          </div>
        )}

        {/* Action Items Preview */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            {isExpanded ? 'Hide' : 'Show'} action items
            <ArrowRight className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">Recommended actions:</p>
              <ul className="space-y-1">
                {recommendation.actionItems.map((item, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Zap className="w-3 h-3 text-yellow-500 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Related Data */}
        {(recommendation.relatedNotes?.length || recommendation.relatedGoals?.length) && (
          <div className="flex flex-wrap gap-2">
            {recommendation.relatedNotes?.slice(0, 3).map((noteId, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                Note: {noteId}
              </Badge>
            ))}
            {recommendation.relatedGoals?.slice(0, 3).map((goalId, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                Goal: {goalId}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            onClick={onApply} 
            size="sm" 
            className="flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Apply Recommendation</span>
          </Button>
          <Button 
            onClick={onDismiss} 
            variant="ghost" 
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};