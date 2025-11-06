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
  DollarSign,
  Target,
  Activity,
  BarChart3,
  Calendar,
  Zap
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

  // Calculate maximum drawdown
  let runningBalance = 0;
  let peakBalance = 0;
  let maxDrawdown = 0;

  trades.forEach(trade => {
    runningBalance += trade.pnl;
    peakBalance = Math.max(peakBalance, runningBalance);
    const drawdown = peakBalance - runningBalance;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  // Simplified Sharpe ratio calculation (assuming risk-free rate = 0)
  const returns = trades.map(trade => trade.pnl);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

  return {
    totalPnl,
    winRate,
    totalTrades: trades.length,
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

// Enhanced note type with trading integration
interface TradingNote extends MockNote {
  tradingData?: {
    relatedTrades: string[];
    performanceMetrics?: {
      score: number;
      notes: string;
    };
    planType?: 'pre-market' | 'post-session' | 'trade-analysis' | 'weekly-review' | 'monthly-goals';
    templates?: string[];
  };
}

const TAB_CONFIG = {
  strategy: {
    title: 'Strategy',
    icon: Lightbulb,
    description: 'Trading strategies and frameworks',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400'
  },
  rules: {
    title: 'Rules',
    icon: BookOpen,
    description: 'Trading rules and procedures',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400'
  },
  notes: {
    title: 'Notes',
    icon: FileText,
    description: 'General trading notes and observations',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400'
  },
  relationships: {
    title: 'Relationships',
    icon: GitBranch,
    description: 'Visual relationship mapping between notes',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400'
  },
  'recently-deleted': {
    title: 'Recently Deleted',
    icon: Archive,
    description: 'Recently deleted notes',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400'
  }
};

// Enhanced content validation helpers with trading-specific detection
const tradingContentValidators = {
  isTradingNote: (content: string): boolean => {
    const tradingKeywords = ['trade', 'pnl', 'entry', 'exit', 'stop loss', 'take profit', 'risk', 'position', 'currency', 'forex', 'analysis'];
    return tradingKeywords.some(keyword => content.toLowerCase().includes(keyword));
  },

  isPlanNote: (content: string): boolean => {
    const planKeywords = ['plan', 'pre-market', 'post-session', 'daily', 'weekly', 'monthly', 'goals', 'strategy'];
    return planKeywords.some(keyword => content.toLowerCase().includes(keyword));
  },

  detectTradingNoteType: (content: string): TradingNote['tradingData']['planType'] => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('pre-market') || lowerContent.includes('daily plan')) return 'pre-market';
    if (lowerContent.includes('post-session') || lowerContent.includes('end of day')) return 'post-session';
    if (lowerContent.includes('trade analysis') || lowerContent.includes('trade review')) return 'trade-analysis';
    if (lowerContent.includes('weekly review') || lowerContent.includes('weekly goals')) return 'weekly-review';
    if (lowerContent.includes('monthly') || lowerContent.includes('goals')) return 'monthly-goals';
    return undefined;
  },

  extractTradingMetrics: (content: string): any => {
    // Extract P&L values, win rates, etc. from note content
    const pnlMatch = content.match(/(?:pnl|p&l|profit|loss)[:\s]*\$?([-+]?\d+\.?\d*)/i);
    const winRateMatch = content.match(/(?:win rate|winning)[:\s]*(\d+(?:\.\d+)?)\s*%/i);
    
    return {
      pnl: pnlMatch ? parseFloat(pnlMatch[1]) : null,
      winRate: winRateMatch ? parseFloat(winRateMatch[1]) : null
    };
  }
};

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'strategy' | 'rules' | 'notes' | 'force-graph' | 'relationships' | 'recently-deleted'>('strategy');
  const [notes, setNotes] = useState<TradingNote[]>([]);
  const [trades, setTrades] = useState<MockTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<TradingNote | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [showBackupPanel, setShowBackupPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'html' | 'txt'>('json');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Enhanced folder and tag management
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  
  // Note filter state
  const [noteFilter, setNoteFilter] = useState<NoteFilter>({
    search: '',
    folder: null,
    tags: [],
    dateRange: { start: null, end: null },
    sortBy: 'created_at',
    sortOrder: 'desc',
    showDeleted: false
  });

  // Trading stats
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load notes
      const notesData = notesDB.loadNotes(user.id) as TradingNote[];
      
      // Load trades for integration
      const tradesData = storage.get<MockTrade[]>(`trades_${user.id}`) || [];
      
      // Process notes with trading data integration
      const enhancedNotes = notesData.map(note => enhanceNoteWithTradingData(note, tradesData));
      
      setNotes(enhancedNotes);
      setTrades(tradesData);
      
      // Calculate trading stats
      const stats = calculateTradingStats(tradesData);
      setTradingStats(stats);
      
      // Initialize folder structure
      initializeFolders(enhancedNotes);
      
      console.log('📚 Loaded enhanced notes:', enhancedNotes.length, 'trades:', tradesData.length);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const enhanceNoteWithTradingData = (note: MockNote, tradesData: MockTrade[]): TradingNote => {
    // Detect trading-related content
    const isTradingRelated = tradingContentValidators.isTradingNote(note.text || '');
    const planType = tradingContentValidators.isPlanNote(note.text || '') 
      ? tradingContentValidators.detectTradingNoteType(note.text || '') 
      : undefined;
    
    // Extract trading metrics from content
    const metrics = tradingContentValidators.extractTradingMetrics(note.text || '');
    
    // Find related trades (if any mentioned in content)
    const relatedTrades: string[] = [];
    if (note.text) {
      const tradeIdMatches = note.text.match(/(?:trade[-_\s]?id|position[-_\s]?id)[:\s]*([a-zA-Z0-9\-_]+)/gi);
      if (tradeIdMatches) {
        tradeIdMatches.forEach(match => {
          const tradeId = match.split(':')[1]?.trim();
          if (tradeId && tradesData.find(t => t.id === tradeId || t.position_id === tradeId)) {
            relatedTrades.push(tradeId);
          }
        });
      }
    }

    return {
      ...note,
      tradingData: {
        relatedTrades,
        performanceMetrics: metrics.winRate || metrics.pnl ? {
          score: Math.round((metrics.winRate || 0) + (metrics.pnl || 0)),
          notes: 'Automatically extracted from note content'
        } : undefined,
        planType,
        templates: []
      }
    };
  };

  const initializeFolders = (notesData: TradingNote[]) => {
    // Create folder structure from notes
    const folderMap = new Map<string, FolderNode>();
    
    // Initialize with default structure
    const defaultFolders: FolderNode[] = [
      {
        id: 'trade-notes',
        name: 'Trade Notes',
        parentId: null,
        children: [],
        type: 'folder',
        noteCount: 0,
        expanded: true
      },
      {
        id: 'daily-journal',
        name: 'Daily Journal',
        parentId: null,
        children: [],
        type: 'folder',
        noteCount: 0,
        expanded: true
      },
      {
        id: 'weekly-reviews',
        name: 'Weekly Reviews',
        parentId: null,
        children: [],
        type: 'folder',
        noteCount: 0,
        expanded: false
      },
      {
        id: 'monthly-goals',
        name: 'Monthly Goals',
        parentId: null,
        children: [],
        type: 'folder',
        noteCount: 0,
        expanded: false
      }
    ];

    // Add tag folders
    const tagFolders: FolderNode[] = [
      {
        id: 'tag-fomc',
        name: 'FOMC',
        parentId: null,
        children: [],
        type: 'tag',
        noteCount: 0,
        expanded: true
      },
      {
        id: 'tag-goals',
        name: 'Goals',
        parentId: null,
        children: [],
        type: 'tag',
        noteCount: 0,
        expanded: true
      },
      {
        id: 'tag-market-news',
        name: 'Market News',
        parentId: null,
        children: [],
        type: 'tag',
        noteCount: 0,
        expanded: false
      },
      {
        id: 'tag-mistakes',
        name: 'Mistakes',
        parentId: null,
        children: [],
        type: 'tag',
        noteCount: 0,
        expanded: false
      },
      {
        id: 'tag-plan-action',
        name: 'Plan of Action',
        parentId: null,
        children: [],
        type: 'tag',
        noteCount: 0,
        expanded: false
      }
    ];

    const allFolders = [...defaultFolders, ...tagFolders];
    
    // Count notes in each folder
    allFolders.forEach(folder => {
      const count = notesData.filter(note => {
        if (folder.type === 'tag') {
          return note.metadata?.tags?.includes(folder.name.toLowerCase()) || 
                 note.category?.toLowerCase().includes(folder.name.toLowerCase());
        } else {
          // Folder-based logic
          switch (folder.id) {
            case 'trade-notes':
              return tradingContentValidators.isTradingNote(note.text || '') && 
                     !note.tradingData?.planType;
            case 'daily-journal':
              return note.tradingData?.planType === 'pre-market' || 
                     note.tradingData?.planType === 'post-session';
            case 'weekly-reviews':
              return note.tradingData?.planType === 'weekly-review';
            case 'monthly-goals':
              return note.tradingData?.planType === 'monthly-goals';
            default:
              return note.category?.toLowerCase().includes(folder.name.toLowerCase());
          }
        }
      }).length;
      folder.noteCount = count;
    });

    setFolders(allFolders);
  };

  // Folder management functions
  const handleFolderCreate = (parentId: string | null, name: string, type: 'folder' | 'tag') => {
    const newFolder: FolderNode = {
      id: `folder-${Date.now()}`,
      name: name || `New ${type === 'tag' ? 'Tag' : 'Folder'}`,
      parentId,
      children: [],
      type,
      noteCount: 0,
      expanded: true
    };
    
    setFolders(prev => [...prev, newFolder]);
  };

  const handleFolderRename = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
  };

  const handleFolderDelete = (folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId && folder.parentId !== folderId));
  };

  const handleFolderToggle = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, expanded: !folder.expanded } : folder
    ));
  };

  // Note management functions
  const handleNoteCreate = (folderId: string | null, tags?: string[]) => {
    if (!user) return;
    
    const newNote: TradingNote = {
      id: `note_${Date.now()}`,
      title: 'New Note',
      text: '',
      content_type: 'plain-text',
      content_data: contentManager.createContentData('plain-text', ''),
      category: folderId || 'General',
      tab: activeTab,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      versions: [],
      current_version: `version_${Date.now()}`,
      metadata: {
        word_count: 0,
        char_count: 0,
        favorite: false,
        pinned: false,
        tags: tags || []
      },
      tradingData: {
        relatedTrades: [],
        templates: tags || []
      }
    };
    
    try {
      const savedNote = notesDB.saveNote(user.id, newNote);
      setNotes(prevNotes => [...prevNotes, savedNote]);
      setSelectedNote(savedNote);
      console.log('📝 Created new note');
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note');
    }
  };

  const handleNoteUpdate = (updatedNote: TradingNote) => {
    if (!user) return;
    
    try {
      const savedNote = notesDB.saveNote(user.id, updatedNote);
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === savedNote.id ? savedNote : note)
      );
      console.log('📝 Updated note:', savedNote.id);
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    }
  };

  const handleNoteDelete = (noteId: string) => {
    if (!user) return;
    
    const success = notesDB.deleteNote(user.id, noteId);
    if (success) {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { ...note, deleted_at: new Date().toISOString() }
            : note
        )
      );
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      
      console.log('🗑️ Deleted note:', noteId);
    }
  };

  const handleNoteRestore = (noteId: string) => {
    if (!user) return;
    
    const success = notesDB.restoreNote(user.id, noteId);
    if (success) {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { ...note, deleted_at: undefined }
            : note
        )
      );
      console.log('♻️ Restored note:', noteId);
    }
  };

  // Template management
  const handleTemplateCreate = (template: Omit<NoteTemplate, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    const newTemplate: NoteTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    console.log('📋 Created template:', newTemplate.name);
  };

  const handleTemplateUpdate = (id: string, updates: Partial<NoteTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updates } : template
    ));
  };

  const handleTemplateDelete = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  const handleTemplateUse = (templateId: string) => {
    // Apply template to new note
    handleNoteCreate(null);
    // Update usage count
    handleTemplateUpdate(templateId, { 
      lastUsed: new Date().toISOString(),
      usageCount: templates.find(t => t.id === templateId)?.usageCount || 0 + 1
    });
  };

  // Filter notes based on current folder selection and filters
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Deleted filter
      if (noteFilter.showDeleted && !note.deleted_at) return false;
      if (!noteFilter.showDeleted && note.deleted_at) return false;
      
      // Folder filter
      if (selectedFolderId) {
        const folder = folders.find(f => f.id === selectedFolderId);
        if (folder) {
          if (folder.type === 'tag') {
            const hasTag = note.metadata?.tags?.includes(folder.name.toLowerCase()) ||
                          note.category?.toLowerCase().includes(folder.name.toLowerCase());
            if (!hasTag) return false;
          } else {
            // Folder-based logic
            switch (folder.id) {
              case 'trade-notes':
                if (!tradingContentValidators.isTradingNote(note.text || '') || note.tradingData?.planType) return false;
                break;
              case 'daily-journal':
                if (note.tradingData?.planType !== 'pre-market' && note.tradingData?.planType !== 'post-session') return false;
                break;
              case 'weekly-reviews':
                if (note.tradingData?.planType !== 'weekly-review') return false;
                break;
              case 'monthly-goals':
                if (note.tradingData?.planType !== 'monthly-goals') return false;
                break;
              default:
                if (!note.category?.toLowerCase().includes(folder.name.toLowerCase())) return false;
            }
          }
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [notes, selectedFolderId, folders, noteFilter.showDeleted]);

  const filteredNotesForList = useMemo(() => {
    return filteredNotes.filter(note => note.tab === activeTab || activeTab === 'relationships');
  }, [filteredNotes, activeTab]);

  // Backup and Export Functions (keeping existing ones)
  const createBackup = () => {
    if (!user) return;
    
    try {
      const backupData = backupManager.createBackup(user.id);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tradejournal-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('📦 Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Failed to create backup');
    }
  };

  const exportNotes = (format: 'json' | 'markdown' | 'html' | 'txt' = 'json') => {
    if (!user) return;
    
    try {
      const notesToExport = filteredNotes.filter(note => !note.deleted_at);
      const exportData = backupManager.exportNotes(notesToExport, format);
      
      const mimeTypes = {
        json: 'application/json',
        markdown: 'text/markdown',
        html: 'text/html',
        txt: 'text/plain'
      };
      
      const extensions = {
        json: 'json',
        markdown: 'md',
        html: 'html',
        txt: 'txt'
      };
      
      const blob = new Blob([exportData], { type: mimeTypes[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-export-${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('📤 Notes exported successfully');
    } catch (error) {
      console.error('Error exporting notes:', error);
      setError('Failed to export notes');
    }
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = e.target?.result as string;
        const result = backupManager.importBackup(backupData, user.id);
        
        if (result.success) {
          alert(`Successfully imported ${result.notes} notes`);
          loadData(); // Refresh all data
        } else {
          alert(`Import completed with errors: ${result.errors.join(', ')}`);
          loadData(); // Still refresh to see any successful imports
        }
      } catch (error) {
        console.error('Error importing backup:', error);
        setError('Failed to import backup');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Library</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border-b border-red-200 dark:border-red-800 p-4">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Top Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library</h1>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Trading Stats Quick View */}
              {tradingStats && (
                <div className="flex items-center space-x-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      ${tradingStats.totalPnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {tradingStats.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {tradingStats.totalTrades}
                    </span>
                  </div>
                </div>
              )}

              {/* Template Manager Button */}
              <button
                onClick={() => setShowTemplateManager(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Template Manager"
              >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                Templates
              </button>

              {/* Backup and Export Controls */}
              <button
                onClick={createBackup}
                className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Create backup"
              >
                <Archive className="w-4 h-4 mr-2" />
                Backup
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowBackupPanel(!showBackupPanel)}
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Export options"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                
                {showBackupPanel && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 backup-panel">
                    <div className="p-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Export Notes</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => exportNotes('json')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export as JSON
                        </button>
                        <button
                          onClick={() => exportNotes('markdown')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export as Markdown
                        </button>
                        <button
                          onClick={() => exportNotes('html')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export as HTML
                        </button>
                        <button
                          onClick={() => exportNotes('txt')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export as Text
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Content Management</h3>
                      <button
                        onClick={() => {
                          const migrationResult = batchMigrateNotes(notes);
                          const result = migrationResult.run();
                          alert(`Migration complete: ${result.migrated} notes migrated, ${result.errors.length} errors`);
                          if (result.migrated > 0) {
                            loadData();
                          }
                          setShowBackupPanel(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Database className="w-4 h-4 inline mr-2" />
                        Auto-Migrate Content
                      </button>
                      <label className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer mt-1">
                        <Upload className="w-4 h-4 inline mr-2" />
                        Import Backup
                        <input
                          type="file"
                          accept=".json"
                          onChange={importBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <nav className="flex space-x-8">
            {Object.entries(TAB_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = activeTab === key;
              const tabNotes = key === 'recently-deleted' 
                ? notes.filter(note => note.deleted_at)
                : notes.filter(note => note.tab === key && !note.deleted_at);
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`inline-flex items-center px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-2 ${
                    isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'
                  }`} />
                  {config.title}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {tabNotes.length}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Three-Panel Layout */}
      {activeTab === 'force-graph' ? (
        /* Force Graph - Full Width */
        <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex-1">
            <ForceGraph
              notes={notes}
              onNodeClick={setSelectedNote}
              selectedNote={selectedNote}
              height={800}
            />
          </div>
        </div>
      ) : activeTab === 'relationships' ? (
        /* Relationship Map - Full Width */
        <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex-1">
            <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Relationship Map
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Interactive relationship mapping coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Three-Panel Layout - 20/30/50 Split */
        <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Left Panel - Folders (20%) */}
          <div className="w-[20%] min-w-[240px] max-w-[300px]">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
              onFolderToggle={handleFolderToggle}
            />
          </div>
          
          {/* Middle Panel - Note List (30%) */}
          <div className="w-[30%] min-w-[300px]">
            <NoteList
              notes={filteredNotesForList}
              selectedNoteId={selectedNote?.id || null}
              onNoteSelect={setSelectedNote}
              onNoteCreate={handleNoteCreate}
              onNoteUpdate={handleNoteUpdate}
              onNoteDelete={handleNoteDelete}
              onNoteRestore={handleNoteRestore}
              filter={noteFilter}
              onFilterChange={setNoteFilter}
              tradingStats={tradingStats || undefined}
            />
          </div>
          
          {/* Right Panel - Rich Content Editor (50%) */}
          <div className="flex-1">
            <NoteEditor
              selectedNote={selectedNote}
              onNoteUpdate={handleNoteUpdate}
              templates={templates}
              onTemplateUse={handleTemplateUse}
            />
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          templates={templates}
          onTemplateCreate={handleTemplateCreate}
          onTemplateUpdate={handleTemplateUpdate}
          onTemplateDelete={handleTemplateDelete}
          onTemplateUse={handleTemplateUse}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
}

// Enhanced Note Editor Component with Trading Integration
interface NoteEditorProps {
  selectedNote: TradingNote | null;
  onNoteUpdate: (note: TradingNote) => void;
  templates: NoteTemplate[];
  onTemplateUse: (templateId: string) => void;
}

function NoteEditor({ selectedNote, onNoteUpdate, templates, onTemplateUse }: NoteEditorProps) {
  const [editorMode, setEditorMode] = useState<'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math'>('rich-text');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Update note content when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setNoteContent(selectedNote.text || '');
      
      // Auto-detect editor mode based on content type
      if (selectedNote.content_type === 'rich-text') setEditorMode('rich-text');
      else if (selectedNote.content_type === 'code') setEditorMode('code');
      else if (selectedNote.content_type === 'syntax-highlight') setEditorMode('syntax-highlight');
      else if (selectedNote.content_type === 'mind-map') setEditorMode('mind-map');
      else if (selectedNote.content_type === 'mermaid') setEditorMode('mermaid');
      else if (selectedNote.content_type === 'math') setEditorMode('math');
      else setEditorMode('rich-text');
    }
  }, [selectedNote]);

  // Save note changes with enhanced content handling
  const handleNoteChange = (content: string) => {
    setNoteContent(content);
    if (selectedNote) {
      // Auto-detect content type if not set
      let updatedNote = { ...selectedNote };
      
      if (updatedNote.content_type === 'plain-text' || !updatedNote.content_type) {
        // Use enhanced trading content detection
        let detectedType: TradingNote['content_type'] = 'plain-text';
        
        if (tradingContentValidators.isTradingNote(content)) detectedType = 'rich-text';
        else if (content.includes('```')) detectedType = 'syntax-highlight';
        else if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1')) detectedType = 'rich-text';
        else if (content.includes('$') || content.includes('\\') || content.includes('{') || content.includes('}')) detectedType = 'math';
        
        if (detectedType !== 'plain-text') {
          updatedNote = migrationManager.migrateToRichContent(
            { ...updatedNote, text: content }, 
            detectedType
          ) as TradingNote;
          setNoteContent(contentManager.extractPlainText(updatedNote));
        }
      }

      // Update the note
      updatedNote = {
        ...updatedNote,
        text: contentManager.extractPlainText(updatedNote),
        updated_at: new Date().toISOString()
      };

      // Update trading data if content changed
      if (tradingContentValidators.isTradingNote(content)) {
        updatedNote.tradingData = {
          ...updatedNote.tradingData,
          planType: tradingContentValidators.detectTradingNoteType(content)
        };
      }

      onNoteUpdate(updatedNote);
    }
  };

  // Handle title changes from RichTextEditor
  const handleTitleChange = (newTitle: string) => {
    if (selectedNote) {
      const updatedNote = {
        ...selectedNote,
        title: newTitle,
        updated_at: new Date().toISOString()
      };
      
      onNoteUpdate(updatedNote);
    }
  };

  if (!selectedNote) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No note selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Choose a note from the sidebar to start editing
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BookmarkIcon className="w-4 h-4 inline mr-2" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Editor Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {selectedNote.title || 'Untitled Note'}
              </h2>
              {selectedNote.tradingData?.planType && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded">
                  {selectedNote.tradingData.planType.replace('-', ' ')}
                </span>
              )}
              {selectedNote.tradingData?.performanceMetrics && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">
                  Score: {selectedNote.tradingData.performanceMetrics.score}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedNote.category} • {new Date(selectedNote.updated_at || selectedNote.created_at).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Use Template"
            >
              <BookmarkIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <X className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Trading Integration Panel */}
      {selectedNote.tradingData && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              {selectedNote.tradingData.relatedTrades.length > 0 && (
                <span className="text-gray-600 dark:text-gray-400">
                  Related Trades: {selectedNote.tradingData.relatedTrades.length}
                </span>
              )}
              {selectedNote.tradingData.performanceMetrics && (
                <span className="text-green-600 dark:text-green-400">
                  Performance Score: {selectedNote.tradingData.performanceMetrics.score}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor */}
      <div className="flex-1">
        <RichTextEditor
          value={noteContent}
          onChange={handleNoteChange}
          mode={editorMode}
          onModeChange={setEditorMode}
          language={editorLanguage}
          onLanguageChange={setEditorLanguage}
          title={selectedNote.title || 'Untitled Note'}
          onTitleChange={handleTitleChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      </div>
      
      {/* Template Selection */}
      {showTemplates && (
        <TemplateManager
          templates={templates}
          onTemplateCreate={() => {}} // Not needed for this use case
          onTemplateUpdate={() => {}} // Not needed for this use case  
          onTemplateDelete={() => {}} // Not needed for this use case
          onTemplateUse={(templateId) => {
            const template = templates.find(t => t.id === templateId);
            if (template && selectedNote) {
              // Apply template content to current note
              handleNoteChange(template.content);
              setShowTemplates(false);
            }
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}