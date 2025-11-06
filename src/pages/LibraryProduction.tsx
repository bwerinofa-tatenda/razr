import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookmarkIcon,
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
  Trash2, 
  X, 
  Download, 
  Upload, 
  Archive, 
  Database, 
  GitBranch, 
  Network,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  Calendar,
  Zap
} from 'lucide-react';
import { isSupabaseConfigured, libraryService, type LibraryNote, type LibraryFolder, type LibraryTemplate } from '../lib/libraryService';
import { storage, type MockNote } from '../lib/mockStorage';
import RichTextEditor from '../components/RichTextEditor';
import ForceGraph from '../components/ForceGraph';
import FolderTree, { type FolderNode } from '../components/library/FolderTree';
import NoteList, { type NoteFilter } from '../components/library/NoteList';
import TemplateManager, { type NoteTemplate } from '../components/library/TemplateManager';

// Trading statistics interface
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

// Convert service types to component types
interface NoteNode extends LibraryNote {
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

// Type conversion helpers
const convertNoteNodeToMockNote = (noteNode: NoteNode): MockNote => {
  return {
    id: noteNode.id,
    text: noteNode.text || '',
    title: noteNode.title,
    category: noteNode.category,
    tab: noteNode.tab,
    created_at: noteNode.created_at,
    updated_at: noteNode.updated_at,
    deleted_at: noteNode.deleted_at,
    user_id: noteNode.user_id || '',
    strategy_id: undefined,
    content_type: noteNode.content_type,
    content_data: noteNode.content_data,
    metadata: noteNode.metadata
  };
};

const convertNoteNodeArrayToMockNoteArray = (notes: NoteNode[]): MockNote[] => {
  return notes.map(convertNoteNodeToMockNote);
};

const convertMockNoteToNoteNode = (mockNote: MockNote): NoteNode => {
  return {
    ...mockNote,
    user_id: mockNote.user_id || '',
    content_data: mockNote.content_data || {},
    metadata: mockNote.metadata || {},
    versions: mockNote.versions || [],
    updated_at: mockNote.updated_at || new Date().toISOString(),
    tradingData: {
      relatedTrades: []
    },
    trading_data: {}
  };
};

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

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'strategy' | 'rules' | 'notes' | 'force-graph' | 'relationships' | 'recently-deleted'>('strategy');
  const [notes, setNotes] = useState<NoteNode[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteNode | null>(null);
  const [showBackupPanel, setShowBackupPanel] = useState(false);
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
  
  // Configuration state
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    if (isConfigured && user) {
      loadData();
    }
  }, [user, isConfigured]);

  const checkConfiguration = () => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    if (!configured) {
      console.warn('Supabase not configured, falling back to localStorage');
    }
  };

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (isConfigured) {
        // Load from Supabase
        await loadFromSupabase();
      } else {
        // Fallback to localStorage
        await loadFromLocalStorage();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
      // Fallback to localStorage if Supabase fails
      if (isConfigured) {
        console.log('Falling back to localStorage...');
        await loadFromLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromSupabase = async () => {
    // Load notes, folders, and templates from Supabase
    const [notesData, foldersData, templatesData] = await Promise.all([
      libraryService.getNotes(),
      libraryService.getFolders(),
      libraryService.getTemplates()
    ]);

    // Load trades for integration
    const tradesData = storage.get<any[]>(`trades_${user.id}`) || [];

    // Convert service types to component types
    const enhancedNotes = notesData.map(note => ({
      ...note,
      tradingData: note.trading_data || {}
    }));

    const convertedFolders = foldersData.map(folder => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
      children: [],
      type: folder.type,
      noteCount: 0, // Will be calculated
      expanded: folder.expanded
    }));

    const convertedTemplates = templatesData.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      content: template.content,
      tags: template.tags || [],
      isFavorite: template.is_favorite,
      createdAt: template.created_at,
      lastUsed: template.last_used_at || template.updated_at,
      usageCount: template.usage_count
    }));

    setNotes(enhancedNotes);
    setTrades(tradesData);
    setFolders(convertedFolders);
    setTemplates(convertedTemplates);

    // Calculate trading stats
    if (tradesData.length > 0) {
      const stats = await libraryService.calculateTradingStats(tradesData);
      setTradingStats(stats);
    }

    console.log('📚 Loaded data from Supabase:', {
      notes: enhancedNotes.length,
      folders: convertedFolders.length,
      templates: convertedTemplates.length,
      trades: tradesData.length
    });
  };

  const loadFromLocalStorage = async () => {
    // Fallback to existing localStorage implementation
    const { notesDB } = await import('../lib/mockStorage');
    
    const notesData = notesDB.loadNotes(user.id) as NoteNode[];
    const tradesData = storage.get<any[]>(`trades_${user.id}`) || [];
    
    setNotes(notesData);
    setTrades(tradesData);
    
    // Initialize with mock folders for localStorage fallback
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
      }
    ];

    const defaultTags: FolderNode[] = [
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
      }
    ];

    setFolders([...defaultFolders, ...defaultTags]);
    setTemplates([]);

    console.log('📚 Loaded data from localStorage:', {
      notes: notesData.length,
      trades: tradesData.length
    });
  };

  // Filter notes based on current folder selection and filters
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Deleted filter
      if (noteFilter.showDeleted && !note.deleted_at) return false;
      if (!noteFilter.showDeleted && note.deleted_at) return false;
      
      // Search filter
      if (noteFilter.search) {
        const searchLower = noteFilter.search.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(searchLower);
        const contentMatch = note.text?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }
      
      return true;
    });
    
    return filtered;
  }, [notes, noteFilter]);

  const filteredNotesForList = useMemo(() => {
    return filteredNotes.filter(note => note.tab === activeTab || activeTab === 'relationships');
  }, [filteredNotes, activeTab]);

  // Folder management functions
  const handleFolderCreate = async (parentId: string | null, name: string, type: 'folder' | 'tag') => {
    try {
      if (isConfigured) {
        const newFolder = await libraryService.createFolder({
          name: name || `New ${type === 'tag' ? 'Tag' : 'Folder'}`,
          type,
          parent_id: parentId,
          expanded: true,
          sort_order: 0
        });
        
        if (newFolder) {
          const folderNode: FolderNode = {
            id: newFolder.id,
            name: newFolder.name,
            parentId: newFolder.parent_id,
            children: [],
            type: newFolder.type,
            noteCount: 0,
            expanded: newFolder.expanded
          };
          setFolders(prev => [...prev, folderNode]);
        }
      } else {
        // Fallback to localStorage
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
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder');
    }
  };

  const handleFolderRename = async (folderId: string, newName: string) => {
    try {
      if (isConfigured) {
        const success = await libraryService.updateFolder(folderId, { name: newName });
        if (success) {
          setFolders(prev => prev.map(folder => 
            folder.id === folderId ? { ...folder, name: newName } : folder
          ));
        }
      } else {
        setFolders(prev => prev.map(folder => 
          folder.id === folderId ? { ...folder, name: newName } : folder
        ));
      }
    } catch (error) {
      console.error('Error renaming folder:', error);
      setError('Failed to rename folder');
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      if (isConfigured) {
        const success = await libraryService.deleteFolder(folderId);
        if (success) {
          setFolders(prev => prev.filter(folder => folder.id !== folderId && folder.parentId !== folderId));
        }
      } else {
        setFolders(prev => prev.filter(folder => folder.id !== folderId && folder.parentId !== folderId));
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Failed to delete folder');
    }
  };

  const handleFolderToggle = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, expanded: !folder.expanded } : folder
    ));
  };

  // Note management functions
  const handleNoteCreate = async (folderId: string | null, tags?: string[]) => {
    if (!user) return;
    
    try {
      const newNote: Partial<LibraryNote> = {
        title: 'New Note',
        text: '',
        content_type: 'plain-text',
        category: folderId || 'General',
        tab: activeTab,
        folder_id: folderId,
        trading_data: {},
        content_data: {},
        metadata: {
          tags: tags || []
        }
      };

      if (isConfigured) {
        const savedNote = await libraryService.createNote(newNote);
        if (savedNote) {
          const noteNode: NoteNode = { ...savedNote, tradingData: { relatedTrades: [] } };
          setNotes(prevNotes => [...prevNotes, noteNode]);
          setSelectedNote(noteNode);
        }
      } else {
        // Fallback to localStorage
        const { notesDB } = await import('../lib/mockStorage');
        const mockNote = await notesDB.saveNote(user.id, {
          ...newNote,
          id: `note_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          versions: [],
          current_version: `version_${Date.now()}`
        } as any);
        
        setNotes(prevNotes => [...prevNotes, convertMockNoteToNoteNode(mockNote)]);
        setSelectedNote(convertMockNoteToNoteNode(mockNote));
      }
      
      console.log('📝 Created new note');
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note');
    }
  };

  const handleNoteUpdate = async (updatedNote: NoteNode) => {
    if (!user) return;
    
    try {
      if (isConfigured) {
        const savedNote = await libraryService.updateNote(updatedNote.id, {
          title: updatedNote.title,
          text: updatedNote.text,
          content_type: updatedNote.content_type,
          category: updatedNote.category,
          trading_data: updatedNote.tradingData,
          content_data: updatedNote.content_data,
          metadata: updatedNote.metadata
        });
        
        if (savedNote) {
          const noteNode = { ...savedNote, tradingData: savedNote.trading_data || {} };
          setNotes(prevNotes => 
            prevNotes.map(note => note.id === savedNote.id ? noteNode : note)
          );
          console.log('📝 Updated note:', savedNote.id);
        }
      } else {
        // Fallback to localStorage
        const { notesDB } = await import('../lib/mockStorage');
        const savedNote = await notesDB.saveNote(user.id, updatedNote as any);
        setNotes(prevNotes => 
          prevNotes.map(note => note.id === savedNote.id ? savedNote as NoteNode : note)
        );
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    if (!user) return;
    
    try {
      if (isConfigured) {
        const success = await libraryService.deleteNote(noteId);
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
      } else {
        // Fallback to localStorage
        const { notesDB } = await import('../lib/mockStorage');
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
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    }
  };

  const handleNoteRestore = async (noteId: string) => {
    if (!user) return;
    
    try {
      if (isConfigured) {
        const success = await libraryService.restoreNote(noteId);
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
      } else {
        // Fallback to localStorage
        const { notesDB } = await import('../lib/mockStorage');
        const success = notesDB.restoreNote(user.id, noteId);
        if (success) {
          setNotes(prevNotes => 
            prevNotes.map(note => 
              note.id === noteId 
                ? { ...note, deleted_at: undefined }
                : note
            )
          );
        }
      }
    } catch (error) {
      console.error('Error restoring note:', error);
      setError('Failed to restore note');
    }
  };

  // Template management
  const handleTemplateCreate = async (template: Omit<NoteTemplate, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      if (isConfigured) {
        const newTemplate = await libraryService.createTemplate({
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          tags: template.tags,
          is_favorite: template.isFavorite
        });
        
        if (newTemplate) {
          const templateNode: NoteTemplate = {
            id: newTemplate.id,
            name: newTemplate.name,
            description: newTemplate.description || '',
            category: newTemplate.category,
            content: newTemplate.content,
            tags: newTemplate.tags || [],
            isFavorite: newTemplate.is_favorite,
            createdAt: newTemplate.created_at,
            lastUsed: newTemplate.updated_at,
            usageCount: newTemplate.usage_count
          };
          setTemplates(prev => [...prev, templateNode]);
        }
      } else {
        // LocalStorage fallback
        const templateNode: NoteTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0
        };
        setTemplates(prev => [...prev, templateNode]);
      }
      
      console.log('📋 Created template:', template.name);
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    }
  };

  const handleTemplateUpdate = async (id: string, updates: Partial<NoteTemplate>) => {
    try {
      if (isConfigured) {
        await libraryService.updateTemplate(id, updates);
      }
      setTemplates(prev => prev.map(template => 
        template.id === id ? { ...template, ...updates } : template
      ));
    } catch (error) {
      console.error('Error updating template:', error);
      setError('Failed to update template');
    }
  };

  const handleTemplateDelete = async (id: string) => {
    try {
      if (isConfigured) {
        await libraryService.deleteTemplate(id);
      }
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  const handleTemplateUse = async (templateId: string) => {
    try {
      if (isConfigured) {
        await libraryService.incrementTemplateUsage(templateId);
      }
      
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Update usage count
        handleTemplateUpdate(templateId, { 
          lastUsed: new Date().toISOString(),
          usageCount: (template.usageCount || 0) + 1
        });
        
        // Apply template to new note
        handleNoteCreate(null, template.tags);
      }
    } catch (error) {
      console.error('Error using template:', error);
      setError('Failed to use template');
    }
  };

  const handleMigrateToSupabase = async () => {
    if (!user || !isConfigured) return;
    
    try {
      setLoading(true);
      const localStorageData = {
        notes: notes,
        folders: folders.filter(f => f.type === 'folder'), // Only actual folders
        templates: templates.filter(t => !t.createdAt.startsWith('2024-01-01')) // Only user templates
      };
      
      const result = await libraryService.migrateFromLocalStorage(localStorageData);
      alert(`Migration completed! ${result.migrated_items?.notes || 0} notes, ${result.migrated_items?.folders || 0} folders, ${result.migrated_items?.templates || 0} templates`);
      
      // Reload from Supabase
      await loadFromSupabase();
    } catch (error) {
      console.error('Migration error:', error);
      setError('Failed to migrate data to Supabase');
    } finally {
      setLoading(false);
    }
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

  // Show configuration message if not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Library</h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Configuration Required
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Supabase is not configured. The Library is currently using localStorage for data persistence.
              For production use, please configure Supabase credentials in the environment variables.
            </p>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              <p>Required environment variables:</p>
              <ul className="list-disc list-inside mt-2">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConfigured ? 'Production mode (Supabase)' : 'Development mode (LocalStorage)'}
              </p>
            </div>
            
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

              {/* Migration Button (only show if data exists in localStorage) */}
              {notes.length > 0 && !isConfigured && (
                <button
                  onClick={handleMigrateToSupabase}
                  className="px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  title="Migrate localStorage data to Supabase"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Migrate Data
                </button>
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
                onClick={() => {
                  // Implement backup for Supabase
                  alert('Backup functionality will be implemented with Supabase');
                }}
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Export Options</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => alert('Export functionality coming soon')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export All Data
                        </button>
                        <button
                          onClick={() => alert('Export functionality coming soon')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export Notes Only
                        </button>
                        <button
                          onClick={() => alert('Export functionality coming soon')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Export Templates
                        </button>
                      </div>
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
        <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="flex-1">
            <ForceGraph
              notes={convertNoteNodeArrayToMockNoteArray(notes)}
              onNodeClick={(note) => setSelectedNote(convertMockNoteToNoteNode(note))}
              selectedNote={selectedNote ? convertNoteNodeToMockNote(selectedNote) : null}
              height={800}
            />
          </div>
        </div>
      ) : activeTab === 'relationships' ? (
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
              notes={convertNoteNodeArrayToMockNoteArray(filteredNotesForList)}
              selectedNoteId={selectedNote?.id || null}
              onNoteSelect={(note) => setSelectedNote(convertMockNoteToNoteNode(note))}
              onNoteCreate={handleNoteCreate}
              onNoteUpdate={(note) => handleNoteUpdate(convertMockNoteToNoteNode(note))}
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
              onClearError={() => setError(null)}
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

// Enhanced Note Editor Component
interface NoteEditorProps {
  selectedNote: NoteNode | null;
  onNoteUpdate: (note: NoteNode) => void;
  templates: NoteTemplate[];
  onTemplateUse: (templateId: string) => void;
  onClearError: () => void;
}

function NoteEditor({ selectedNote, onNoteUpdate, templates, onTemplateUse, onClearError }: NoteEditorProps) {
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
  const handleNoteChange = async (content: string) => {
    setNoteContent(content);
    if (selectedNote) {
      let updatedNote = { ...selectedNote };
      
      // Auto-detect content type if needed
      if (updatedNote.content_type === 'plain-text' || !updatedNote.content_type) {
        let detectedType: NoteNode['content_type'] = 'plain-text';
        
        if (content.includes('```')) detectedType = 'syntax-highlight';
        else if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1')) detectedType = 'rich-text';
        else if (content.includes('$') || content.includes('\\') || content.includes('{') || content.includes('}')) detectedType = 'math';
        
        if (detectedType !== 'plain-text') {
          updatedNote.content_type = detectedType;
        }
      }

      // Update the note
      updatedNote = {
        ...updatedNote,
        text: content,
        updated_at: new Date().toISOString()
      };

      onNoteUpdate(updatedNote);
    }
  };

  // Handle title changes
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
              {selectedNote.tradingData.relatedTrades?.length > 0 && (
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
          onTemplateCreate={() => {}}
          onTemplateUpdate={() => {}}  
          onTemplateDelete={() => {}}
          onTemplateUse={(templateId) => {
            const template = templates.find(t => t.id === templateId);
            if (template && selectedNote) {
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