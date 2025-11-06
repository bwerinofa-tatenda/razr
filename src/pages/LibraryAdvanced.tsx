// Advanced Library Component
// Enhanced version with all advanced features: versioning, collaboration, smart suggestions, etc.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Folder, 
  Settings, 
  Edit2, 
  MoreHorizontal, 
  Trash2, 
  X, 
  Download, 
  Upload, 
  Archive, 
  Database, 
  GitBranch, 
  Network,
  BookmarkIcon,
  TrendingUp,
  Shield,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  Calendar,
  Zap,
  Brain,
  Mic,
  Clock,
  Link2,
  Users,
  Sparkles
} from 'lucide-react';
import type { MockNote, MockTrade } from '../lib/mockStorage';
import { notesDB, backupManager, contentManager, migrationManager } from '../lib/mockStorage';
import { storage } from '../lib/mockStorage';
import RichTextEditor from '../components/RichTextEditor';
import ForceGraph from '../components/ForceGraph';
import { batchMigrateNotes, contentDetectors } from '../utils/contentMigration';
import { contentValidation } from '../utils/contentUtils';
import FolderTree, { type FolderNode } from '../components/library/FolderTree';
import NoteList, { type NoteFilter } from '../components/library/NoteList';
import TemplateManager, { type NoteTemplate } from '../components/library/TemplateManager';
import { advancedLibraryService } from '../lib/advancedLibraryService';
import supabaseLibraryService, { supabase, type SupabaseNote, type NoteFilter as SupabaseNoteFilter } from '../lib/supabaseLibraryService';

// Advanced Feature Components
import VersionHistory from '../components/library/VersionHistory';
import SmartSuggestions from '../components/library/SmartSuggestions';
import NoteLinks from '../components/library/NoteLinks';
import VoiceInput from '../components/library/VoiceInput';
import Reminders from '../components/library/Reminders';
import ExportManager from '../components/library/ExportManager';

// Analytics Components
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

// Data Management Components
import { DataManagementPanel } from '../components/library/DataManagementPanel';

// Calculate trading statistics from notes and trades
interface TradingStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winners: number;
  losers: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  sharpeRatio: number;
  lastUpdated: string;
}

const calculateTradingStats = (trades: MockTrade[]): TradingStats => {
  if (trades.length === 0) {
    return {
      totalPnl: 0,
      winRate: 0,
      totalTrades: 0,
      winners: 0,
      losers: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      sharpeRatio: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  const winningTrades = trades.filter(trade => trade.outcome === 'win');
  const losingTrades = trades.filter(trade => trade.outcome === 'loss');
  
  const totalWins = winningTrades.length;
  const totalLosses = losingTrades.length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const avgWin = totalWins > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / totalWins : 0;
  const avgLoss = totalLosses > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / totalLosses) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  trades.forEach(trade => {
    if (trade.outcome === 'win') {
      currentWins++;
      currentLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
    } else if (trade.outcome === 'loss') {
      currentLosses++;
      currentWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    }
  });

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let runningPnL = 0;
  
  trades.forEach(trade => {
    runningPnL += trade.pnl;
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    const drawdown = peak - runningPnL;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(trade => trade.pnl);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;

  return {
    totalPnl,
    winRate,
    totalTrades,
    winners: totalWins,
    losers: totalLosses,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdown,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    sharpeRatio,
    lastUpdated: new Date().toISOString()
  };
};

const LibraryAdvanced: React.FC = () => {
  const { user } = useAuth();
  
  // Core state
  const [notes, setNotes] = useState<MockNote[]>([]);
  const [trades, setTrades] = useState<MockTrade[]>([]);
  const [selectedNote, setSelectedNote] = useState<MockNote | null>(null);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Supabase integration state
  const [useSupabase, setUseSupabase] = useState(false);
  const [supabaseNotes, setSupabaseNotes] = useState<SupabaseNote[]>([]);
  const [supabaseSelectedNote, setSupabaseSelectedNote] = useState<SupabaseNote | null>(null);
  
  // UI state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPerformance, setShowPerformance] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filter, setFilter] = useState<NoteFilter>({
    search: '',
    folder: null,
    tags: [],
    dateRange: { start: null, end: null },
    sortBy: 'updated_at',
    sortOrder: 'desc',
    showDeleted: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [editorMode, setEditorMode] = useState<'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math'>('rich-text');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  
  // Advanced features state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showNoteLinks, setShowNoteLinks] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [smartSuggestionPosition, setSmartSuggestionPosition] = useState({ x: 0, y: 0 });
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Try to load from Supabase first
          try {
            const supabaseNotesData = await supabaseLibraryService.getNotes();
            if (supabaseNotesData && supabaseNotesData.length > 0) {
              setSupabaseNotes(supabaseNotesData);
              setUseSupabase(true);
              console.log('✅ Using Supabase backend');
            } else {
              throw new Error('No data in Supabase');
            }
          } catch (supabaseError) {
            console.log('⚠️ Supabase not available, using mock data:', supabaseError);
            setUseSupabase(false);
            
            // Fallback to mock data
            const loadedNotes = await notesDB.loadNotes(user.id);
            if (loadedNotes.length === 0) {
              await initializeDefaultNotes();
            } else {
              setNotes(loadedNotes);
            }
            
            // Load trades
            const loadedTrades = storage.get<MockTrade[]>('trades') || [];
            setTrades(loadedTrades);

            // Load templates
            const loadedTemplates = storage.get<NoteTemplate[]>('templates') || [];
            setTemplates(loadedTemplates);
          }

          // Initialize folders (common for both modes)
          const defaultFolders: FolderNode[] = [
            { 
              id: '1', 
              name: 'Trade Notes', 
              type: 'folder', 
              parentId: null, 
              children: [], 
              noteCount: 0, 
              expanded: true
            },
            { 
              id: '2', 
              name: 'Daily Journal', 
              type: 'folder', 
              parentId: null, 
              children: [], 
              noteCount: 0, 
              expanded: true
            },
            { 
              id: '3', 
              name: 'Strategy', 
              type: 'folder', 
              parentId: null, 
              children: [], 
              noteCount: 0, 
              expanded: false
            }
          ];
          setFolders(defaultFolders);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle note selection and content update
  useEffect(() => {
    const currentNote = useSupabase ? supabaseSelectedNote : selectedNote;
    if (currentNote) {
      setNoteContent(currentNote.text || '');
      setNoteTitle(currentNote.title || '');
    } else {
      setNoteContent('');
      setNoteTitle('');
    }
  }, [useSupabase, supabaseSelectedNote, selectedNote]);

  // Utility functions for data conversion
  const convertToSupabaseNote = (mockNote: MockNote): Partial<SupabaseNote> => ({
    id: mockNote.id,
    title: mockNote.title,
    text: mockNote.text,
    content_type: mockNote.content_type || 'plain-text',
    content_data: mockNote.content_data,
    category: mockNote.category,
    tags: mockNote.metadata?.tags || [],
    is_favorite: mockNote.metadata?.favorite || false,
    is_pinned: mockNote.metadata?.pinned || false,
    created_at: mockNote.created_at,
    updated_at: mockNote.updated_at
  });

  const convertToMockNote = (supabaseNote: SupabaseNote): MockNote => ({
    id: supabaseNote.id,
    title: supabaseNote.title,
    text: supabaseNote.text,
    content_type: supabaseNote.content_type,
    content_data: supabaseNote.content_data,
    category: supabaseNote.category,
    created_at: supabaseNote.created_at,
    updated_at: supabaseNote.updated_at,
    metadata: {
      tags: supabaseNote.tags || [],
      favorite: supabaseNote.is_favorite,
      pinned: supabaseNote.is_pinned
    }
  });

  // Auto-save functionality
  useEffect(() => {
    const currentNote = useSupabase ? supabaseSelectedNote : selectedNote;
    if (!currentNote || !user) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        if (useSupabase) {
          // Auto-save to Supabase
          if (advancedLibraryService) {
            const updatedNote = await supabaseLibraryService.updateNote(currentNote.id, {
              text: noteContent,
              title: noteTitle,
              content_type: editorMode as any,
              content_data: { code_language: editorLanguage }
            });
            
            setSupabaseNotes(prev => prev.map(n => n.id === currentNote.id ? updatedNote : n));
            setSupabaseSelectedNote(updatedNote);
          }
        } else {
          // Auto-save to mock storage
          const updatedNote: MockNote = {
            ...currentNote as MockNote,
            text: noteContent,
            title: noteTitle,
            updated_at: new Date().toISOString(),
            content_type: editorMode as any,
            content_data: { code_language: editorLanguage }
          };
          
          await notesDB.saveNote(user.id, updatedNote);
          setNotes(prev => prev.map(n => n.id === currentNote.id ? updatedNote : n));
          setSelectedNote(updatedNote);
        }
        
        setLastAutoSave(new Date());
        setIsAutoSaving(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setIsAutoSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [noteContent, noteTitle, useSupabase, supabaseSelectedNote, selectedNote, user, editorMode, editorLanguage]);

  // Smart suggestions trigger
  useEffect(() => {
    if (noteContent.length > 50 && !showSmartSuggestions) {
      const timer = setTimeout(() => {
        // Show smart suggestions after user types for a while
        setShowSmartSuggestions(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [noteContent, showSmartSuggestions]);

  const initializeDefaultNotes = async () => {
    if (!user) return;
    
    const defaultNotes = [
      {
        id: '1',
        text: '# Daily Trading Journal\n\n## Pre-Market Analysis\n\nMarket conditions:\n\n## Key Levels\n\n## Trading Plan\n\n1. \n2. \n3. \n\n## Risk Management\n\n## Session Review',
        title: 'Daily Trading Journal',
        category: 'daily',
        tab: 'journal',
        created_at: new Date().toISOString(),
        content_type: 'rich-text' as const,
        content_data: {},
        metadata: { word_count: 0 }
      },
      {
        id: '2',
        text: '# Strategy Notes\n\n## Strategy Name\n\n## Entry Rules\n\n## Exit Rules\n\n## Risk Management\n\n## Backtest Results\n\n## Performance Metrics',
        title: 'Strategy Template',
        category: 'strategy',
        tab: 'strategy',
        created_at: new Date().toISOString(),
        content_type: 'rich-text' as const,
        content_data: {},
        metadata: { word_count: 0 }
      }
    ];

    for (const note of defaultNotes) {
      await notesDB.saveNote(user.id, note);
    }
    const loadedNotes = await notesDB.loadNotes(user.id);
    setNotes(loadedNotes);
  };

  // Advanced feature handlers
  const handleSuggestionApply = (suggestionType: string, suggestionData: any) => {
    switch (suggestionType) {
      case 'template':
        setNoteContent(prev => prev + '\n' + suggestionData.content);
        break;
      case 'tag':
        // Handle tag suggestions
        break;
      case 'completion':
        // Handle auto-completion
        break;
      default:
        break;
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setNoteContent(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleReminderCreate = (reminder: any) => {
    console.log('Reminder created:', reminder);
  };

  const handleLinkCreate = (sourceId: string, targetId: string, linkType: string) => {
    console.log('Link created:', { sourceId, targetId, linkType });
  };

  const handleNoteRestore = (content: string, contentData: any) => {
    setNoteContent(content);
    if (contentData.contentType) {
      setEditorMode(contentData.contentType);
    }
  };

  // Trading stats calculation
  const tradingStats = useMemo(() => {
    return calculateTradingStats(trades);
  }, [trades]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return note.title?.toLowerCase().includes(query) ||
               note.text?.toLowerCase().includes(query) ||
               note.category?.toLowerCase().includes(query);
      }
      
      if (filter.folder && note.metadata?.folderId !== filter.folder) {
        return false;
      }
      
      if (filter.tags.length > 0) {
        const noteTags = note.metadata?.tags || [];
        return filter.tags.some(tag => noteTags.includes(tag));
      }
      
      return !note.deleted_at;
    });
  }, [notes, searchQuery, filter]);

  const handleCreateNote = async () => {
    if (!user) return;
    
    const newNote: Omit<MockNote, 'id'> = {
      text: '',
      title: 'Untitled Note',
      category: 'general',
      tab: 'notes',
      created_at: new Date().toISOString(),
      content_type: 'rich-text',
      content_data: {},
      metadata: { word_count: 0 }
    };

    const addedNote = await notesDB.saveNote(user.id, newNote as MockNote);
    setNotes(prev => [addedNote, ...prev]);
    setSelectedNote(addedNote);
    setNoteContent('');
    setNoteTitle('Untitled Note');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    
    await notesDB.deleteNote(user.id, noteId);
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setNoteContent('');
      setNoteTitle('');
    }
  };

  const handleNoteChange = (content: string) => {
    setNoteContent(content);
    
    // Update the current note in either mode
    if (useSupabase && supabaseSelectedNote) {
      setSupabaseSelectedNote(prev => prev ? { ...prev, text: content } : null);
    } else if (!useSupabase && selectedNote) {
      setSelectedNote(prev => prev ? { ...prev, text: content } : null);
    }
  };

  const handleTitleChange = (title: string) => {
    setNoteTitle(title);
    
    // Update the current note in either mode
    if (useSupabase && supabaseSelectedNote) {
      setSupabaseSelectedNote(prev => prev ? { ...prev, title } : null);
    } else if (!useSupabase && selectedNote) {
      setSelectedNote(prev => prev ? { ...prev, title } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex bg-white dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Sidebar */}
      <div 
        className="flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Library Advanced
              </h1>
              {/* Status indicator */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  useSupabase ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {useSupabase ? 'Supabase' : 'Mock'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowExportManager(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Advanced Features Toolbar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Version History"
            >
              <GitBranch className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSmartSuggestions(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Smart Suggestions"
            >
              <Brain className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNoteLinks(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Note Links"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowVoiceInput(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-1 mt-1">
            <button
              onClick={() => setShowReminders(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reminders"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Analytics Dashboard"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDataManagement(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Data Management"
            >
              <Shield className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ${showPerformance ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              title="Performance"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-1">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ${showTemplates ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              title="Templates"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
          
          {/* Auto-save indicator */}
          {isAutoSaving && (
            <div className="flex items-center space-x-2 mt-2 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Saving...</span>
            </div>
          )}
          
          {lastAutoSave && !isAutoSaving && (
            <div className="text-xs text-gray-500 mt-1">
              Last saved: {lastAutoSave.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Templates Panel */}
        {showTemplates && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TemplateManager
              templates={templates}
              onTemplateCreate={() => {}}
              onTemplateUpdate={() => {}}
              onTemplateDelete={() => {}}
              onTemplateUse={(templateId) => {
                const template = templates.find(t => t.id === templateId);
                if (template) {
                  setNoteContent(template.content);
                  setShowTemplates(false);
                }
              }}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        )}

        {/* Performance Panel */}
        {showPerformance && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Trading Performance
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <div className="text-green-600 dark:text-green-400 font-medium">
                  ${tradingStats.totalPnl.toFixed(0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Net P&L</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {tradingStats.winRate.toFixed(1)}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                <div className="text-purple-600 dark:text-purple-400 font-medium">
                  {tradingStats.profitFactor.toFixed(2)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Profit Factor</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                <div className="text-orange-600 dark:text-orange-400 font-medium">
                  {tradingStats.totalTrades}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Trades</div>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          <NoteList
            notes={useSupabase ? supabaseNotes.map(convertToMockNote) : filteredNotes}
            selectedNoteId={(useSupabase ? supabaseSelectedNote?.id : selectedNote?.id) || null}
            onNoteSelect={(note) => {
              if (useSupabase) {
                const supabaseNote = supabaseNotes.find(n => n.id === note.id);
                setSupabaseSelectedNote(supabaseNote || null);
              } else {
                const mockNote = filteredNotes.find(n => n.id === note.id);
                setSelectedNote(mockNote || null);
              }
            }}
            onNoteCreate={async (folderId, tags) => {
              try {
                if (useSupabase && user) {
                  // Create note in Supabase
                  const newNote = await supabaseLibraryService.createNote({
                    title: 'New Note',
                    text: '',
                    content_type: 'plain-text',
                    folder_id: folderId,
                    tags: tags,
                    is_favorite: false,
                    is_pinned: false
                  });
                  
                  setSupabaseNotes(prev => [newNote, ...prev]);
                  setSupabaseSelectedNote(newNote);
                  console.log('✅ Note created in Supabase');
                } else if (user) {
                  // Create note in mock storage
                  const newNote: MockNote = {
                    id: `note_${Date.now()}`,
                    title: 'New Note',
                    text: '',
                    content_type: 'plain-text',
                    category: undefined,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: {
                      tags: tags || [],
                      favorite: false,
                      pinned: false
                    }
                  };
                  
                  await notesDB.saveNote(user.id, newNote);
                  setNotes(prev => [newNote, ...prev]);
                  setSelectedNote(newNote);
                  console.log('✅ Note created in mock storage');
                }
              } catch (error) {
                console.error('Failed to create note:', error);
              }
            }}
            onNoteUpdate={async (note) => {
              try {
                if (useSupabase) {
                  // Update note in Supabase
                  const updatedNote = await supabaseLibraryService.updateNote(note.id, convertToSupabaseNote(note as MockNote));
                  setSupabaseNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
                  if (supabaseSelectedNote?.id === note.id) {
                    setSupabaseSelectedNote(updatedNote);
                  }
                  console.log('✅ Note updated in Supabase');
                } else {
                  // Update note in mock storage
                  await notesDB.saveNote(user.id, note as MockNote);
                  setNotes(prev => prev.map(n => n.id === note.id ? note as MockNote : n));
                  if (selectedNote?.id === note.id) {
                    setSelectedNote(note as MockNote);
                  }
                  console.log('✅ Note updated in mock storage');
                }
              } catch (error) {
                console.error('Failed to update note:', error);
              }
            }}
            onNoteDelete={handleDeleteNote}
            onNoteRestore={(noteId) => {
              // Handle note restore
              console.log('Restore note:', noteId);
            }}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {/* Sidebar Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreateNote}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors"
        onMouseDown={(e) => {
          setIsResizing(true);
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          
          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + (e.clientX - startX);
            setSidebarWidth(Math.max(250, Math.min(600, newWidth)));
          };
          
          const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex-1">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg font-medium bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white w-full"
                  placeholder="Note title..."
                />
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span>Created: {new Date(selectedNote.created_at).toLocaleDateString()}</span>
                  {selectedNote.updated_at && (
                    <span>Updated: {new Date(selectedNote.updated_at).toLocaleDateString()}</span>
                  )}
                  <span>Words: {noteContent.split(/\s+/).filter(word => word.length > 0).length}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Toggle Fullscreen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1">
              <RichTextEditor
                value={noteContent}
                onChange={handleNoteChange}
                mode={editorMode}
                onModeChange={setEditorMode}
                language={editorLanguage}
                onLanguageChange={setEditorLanguage}
                title={noteTitle}
                onTitleChange={handleTitleChange}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Select a note to start editing
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a note from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Feature Modals */}
      {selectedNote && (
        <>
          <VersionHistory
            noteId={selectedNote.id}
            isOpen={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            onRestore={handleNoteRestore}
          />
          
          <SmartSuggestions
            noteId={selectedNote.id}
            content={noteContent}
            onSuggestionApply={handleSuggestionApply}
            isOpen={showSmartSuggestions}
            onClose={() => setShowSmartSuggestions(false)}
            position={smartSuggestionPosition}
          />
          
          <NoteLinks
            noteId={selectedNote.id}
            isOpen={showNoteLinks}
            onClose={() => setShowNoteLinks(false)}
            onLinkCreate={handleLinkCreate}
          />
          
          <VoiceInput
            noteId={selectedNote.id}
            onTranscript={handleVoiceTranscript}
            isOpen={showVoiceInput}
            onClose={() => setShowVoiceInput(false)}
          />
          
          <Reminders
            noteId={selectedNote.id}
            isOpen={showReminders}
            onClose={() => setShowReminders(false)}
            onReminderCreate={handleReminderCreate}
          />
        </>
      )}
      
      <ExportManager
        noteIds={filteredNotes.map(n => n.id)}
        isOpen={showExportManager}
        onClose={() => setShowExportManager(false)}
      />
      
      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard
        notes={useSupabase ? supabaseNotes.map(convertToMockNote) : notes}
        trades={trades}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
      
      {/* Data Management Panel Modal */}
      <DataManagementPanel
        onClose={() => setShowDataManagement(false)}
      />
    </div>
  );
};

export default LibraryAdvanced;
