// Smart Suggestions Component
// Provides AI-powered suggestions for content, templates, tags, and references

import React, { useState, useEffect, useRef } from 'react';
import {
  Lightbulb,
  X,
  Zap,
  Tag,
  FileText,
  Link,
  Check,
  ChevronRight,
  Clock,
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Suggestion, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface SmartSuggestionsProps {
  noteId?: string;
  content: string;
  onSuggestionApply: (suggestionType: string, suggestionData: any) => void;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

interface SuggestionCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  suggestions: Suggestion[];
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  noteId,
  content,
  onSuggestionApply,
  isOpen,
  onClose,
  position
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && content.trim()) {
      analyzeContent();
    }
  }, [isOpen, content, noteId]);

  useEffect(() => {
    // Handle clicks outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const analyzeContent = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setIsLoading(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedSuggestions = await advancedLibraryService.generateSuggestions(
        content,
        user.id,
        noteId
      );
      
      setSuggestions(generatedSuggestions);
      
      // Auto-expand categories with high-confidence suggestions
      const highConfidenceCategories = new Set(
        generatedSuggestions
          .filter(s => s.confidenceScore > 0.7)
          .map(s => s.suggestionType)
      );
      setExpandedCategories(highConfidenceCategories);
      
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSuggestionApply = async (suggestion: Suggestion) => {
    try {
      // Update suggestion status
      suggestion.status = 'applied';
      suggestion.appliedAt = new Date().toISOString();
      
      // Apply the suggestion
      onSuggestionApply(suggestion.suggestionType, suggestion.suggestionData);
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  };

  const handleSuggestionDismiss = (suggestion: Suggestion) => {
    suggestion.status = 'dismissed';
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const groupSuggestionsByCategory = (): SuggestionCategory[] => {
    const categories: { [key: string]: Suggestion } = {};
    
    suggestions.forEach(suggestion => {
      if (suggestion.status === 'pending') {
        categories[suggestion.suggestionType] = suggestion;
      }
    });

    const categoryMap: { [key: string]: SuggestionCategory } = {
      template: {
        id: 'template',
        name: 'Templates',
        icon: <FileText className="w-4 h-4" />,
        color: 'text-blue-600 bg-blue-50',
        suggestions: []
      },
      tag: {
        id: 'tag',
        name: 'Tags',
        icon: <Tag className="w-4 h-4" />,
        color: 'text-green-600 bg-green-50',
        suggestions: []
      },
      reference: {
        id: 'reference',
        name: 'References',
        icon: <Link className="w-4 h-4" />,
        color: 'text-purple-600 bg-purple-50',
        suggestions: []
      },
      completion: {
        id: 'completion',
        name: 'Auto-completion',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-yellow-600 bg-yellow-50',
        suggestions: []
      },
      content: {
        id: 'content',
        name: 'Content',
        icon: <Lightbulb className="w-4 h-4" />,
        color: 'text-orange-600 bg-orange-50',
        suggestions: []
      }
    };

    Object.values(categoryMap).forEach(category => {
      category.suggestions = suggestions.filter(s => s.suggestionType === category.id);
    });

    return Object.values(categoryMap).filter(category => category.suggestions.length > 0);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return 'High confidence';
    if (score >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  if (!isOpen) return null;

  const suggestionCategories = groupSuggestionsByCategory();

  return (
    <div
      ref={containerRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-w-md"
      style={{
        left: position?.x || 400,
        top: position?.y || 200,
        maxHeight: '70vh'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Smart Suggestions
          </h3>
          {isAnalyzing && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-600">Analyzing...</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-6 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              No suggestions yet
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Start typing to get AI-powered suggestions for your content
            </p>
          </div>
        ) : (
          <div className="p-2">
            {suggestionCategories.map(category => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${category.color}`}>
                      {category.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({category.suggestions.length})
                    </span>
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedCategories.has(category.id) && (
                  <div className="mt-1 space-y-2 ml-6">
                    {category.suggestions.map(suggestion => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={() => handleSuggestionApply(suggestion)}
                        onDismiss={() => handleSuggestionDismiss(suggestion)}
                        getConfidenceColor={getConfidenceColor}
                        getConfidenceText={getConfidenceText}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{suggestions.filter(s => s.status === 'pending').length} suggestions</span>
            <button
              onClick={analyzeContent}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: () => void;
  onDismiss: () => void;
  getConfidenceColor: (score: number) => string;
  getConfidenceText: (score: number) => string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
  getConfidenceColor,
  getConfidenceText
}) => {
  const renderSuggestionContent = () => {
    switch (suggestion.suggestionType) {
      case 'template':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {suggestion.suggestionData.title}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {suggestion.suggestionData.description}
            </p>
          </div>
        );
      
      case 'tag':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Suggested Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestion.suggestionData.suggestedTags?.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      
      case 'reference':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Link className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {suggestion.suggestionData.type === 'related_notes' ? 'Related Notes' : 'References'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {suggestion.suggestionData.description}
            </p>
          </div>
        );
      
      case 'completion':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Auto-complete
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono">
              {suggestion.suggestionData.term}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {suggestion.suggestionData.description}
            </p>
          </div>
        );
      
      default:
        return (
          <div>
            <p className="text-sm text-gray-900 dark:text-white">
              {JSON.stringify(suggestion.suggestionData)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
      {renderSuggestionContent()}
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            suggestion.confidenceScore >= 0.8 ? 'bg-green-500' :
            suggestion.confidenceScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-xs ${getConfidenceColor(suggestion.confidenceScore)}`}>
            {getConfidenceText(suggestion.confidenceScore)}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            onClick={onApply}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 hover:text-green-700"
            title="Apply"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestions;
