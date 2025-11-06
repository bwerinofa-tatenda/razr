import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal, 
  Star, 
  Pin, 
  Archive,
  Trash2,
  Edit2,
  Plus,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  Tag as TagIcon
} from 'lucide-react';
import type { MockNote } from '../../lib/mockStorage';

export interface NoteFilter {
  search: string;
  folder: string | null;
  tags: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  sortBy: 'created_at' | 'updated_at' | 'title' | 'pinned';
  sortOrder: 'asc' | 'desc';
  showDeleted: boolean;
}

interface NoteListProps {
  notes: MockNote[];
  selectedNoteId: string | null;
  onNoteSelect: (note: MockNote | null) => void;
  onNoteCreate: (folderId: string | null, tags?: string[]) => void;
  onNoteUpdate: (note: MockNote) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteRestore: (noteId: string) => void;
  filter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  tradingStats?: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    winners: number;
    losers: number;
  };
}

export default function NoteList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteUpdate,
  onNoteDelete,
  onNoteRestore,
  filter,
  onFilterChange,
  tradingStats
}: NoteListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [newNoteName, setNewNoteName] = useState('');

  // Extract all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      if (note.metadata?.tags) {
        note.metadata.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(searchLower);
        const contentMatch = note.text?.toLowerCase().includes(searchLower);
        if (!titleMatch && !contentMatch) return false;
      }

      // Deleted filter
      if (filter.showDeleted && !note.deleted_at) return false;
      if (!filter.showDeleted && note.deleted_at) return false;

      // Date range filter
      if (filter.dateRange.start) {
        const noteDate = new Date(note.created_at);
        const startDate = new Date(filter.dateRange.start);
        if (noteDate < startDate) return false;
      }
      if (filter.dateRange.end) {
        const noteDate = new Date(note.created_at);
        const endDate = new Date(filter.dateRange.end);
        if (noteDate > endDate) return false;
      }

      return true;
    });

    // Sort notes
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filter.sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at);
          bValue = new Date(b.updated_at || b.created_at);
          break;
        case 'pinned':
          aValue = a.metadata?.pinned ? 1 : 0;
          bValue = b.metadata?.pinned ? 1 : 0;
          break;
        default: // created_at
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (aValue < bValue) return filter.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filter.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [notes, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getNoteIcon = (note: MockNote) => {
    if (note.metadata?.favorite) return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
    if (note.metadata?.pinned) return <Pin className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const handleNoteToggle = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      onNoteUpdate({
        ...note,
        metadata: {
          ...note.metadata,
          pinned: !note.metadata?.pinned
        }
      });
    }
  };

  const handleNoteFavorite = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      onNoteUpdate({
        ...note,
        metadata: {
          ...note.metadata,
          favorite: !note.metadata?.favorite
        }
      });
    }
  };

  const handleBulkDelete = () => {
    bulkActions.forEach(noteId => onNoteDelete(noteId));
    setBulkActions([]);
  };

  const handleBulkRestore = () => {
    bulkActions.forEach(noteId => onNoteRestore(noteId));
    setBulkActions([]);
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNoteCreate(filter.folder)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort by
              </label>
              <select
                value={`${filter.sortBy}-${filter.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [NoteFilter['sortBy'], 'asc' | 'desc'];
                  onFilterChange({ ...filter, sortBy, sortOrder });
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="updated_at-desc">Recently Updated</option>
                <option value="updated_at-asc">Least Recently Updated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="pinned-desc">Pinned First</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filter.dateRange.start || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    dateRange: { ...filter.dateRange, start: e.target.value || null }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filter.dateRange.end || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    dateRange: { ...filter.dateRange, end: e.target.value || null }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Deleted Notes Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-deleted"
                checked={filter.showDeleted}
                onChange={(e) => onFilterChange({ ...filter, showDeleted: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="show-deleted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show deleted notes
              </label>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => onFilterChange({
                search: '',
                folder: null,
                tags: [],
                dateRange: { start: null, end: null },
                sortBy: 'created_at',
                sortOrder: 'desc',
                showDeleted: false
              })}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Trading Stats */}
        {tradingStats && !filter.showDeleted && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Trading Performance
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  Net P&L: ${tradingStats.totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  Win Rate: {tradingStats.winRate}%
                </span>
              </div>
              <div className="flex items-center">
                <FileText className="w-3 h-3 mr-1 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  Total: {tradingStats.totalTrades}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-700 dark:text-green-300">
                  {tradingStats.winners}W/{tradingStats.losers}L
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {bulkActions.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {bulkActions.length} note{bulkActions.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              {!filter.showDeleted ? (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={handleBulkRestore}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Restore
                </button>
              )}
              <button
                onClick={() => setBulkActions([])}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {filter.search ? 'No notes match your search' : 'No notes found'}
            </p>
            {!filter.search && (
              <button
                onClick={() => onNoteCreate(filter.folder)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              const isBulkSelected = bulkActions.includes(note.id);
              
              return (
                <div
                  key={note.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/50 dark:border-blue-800' 
                      : isBulkSelected
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                  } border`}
                  onClick={() => {
                    if (isBulkSelected) {
                      setBulkActions(prev => prev.filter(id => id !== note.id));
                    } else {
                      setBulkActions([]);
                      onNoteSelect(note);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={isBulkSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setBulkActions(prev => [...prev, note.id]);
                            } else {
                              setBulkActions(prev => prev.filter(id => id !== note.id));
                            }
                          }}
                          className="mr-2 rounded"
                        />
                        {getNoteIcon(note)}
                        <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white truncate">
                          {note.title || 'Untitled Note'}
                        </h3>
                        {note.deleted_at && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">
                            Deleted
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {note.text?.slice(0, 120)}...
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(note.updated_at || note.created_at)}
                        </div>
                        {note.category && (
                          <div className="flex items-center">
                            <TagIcon className="w-3 h-3 mr-1" />
                            {note.category}
                          </div>
                        )}
                        {note.metadata?.word_count && (
                          <span>{note.metadata.word_count} words</span>
                        )}
                      </div>

                      {/* Tags */}
                      {note.metadata?.tags && note.metadata.tags.length > 0 && (
                        <div className="flex items-center mt-2 space-x-1">
                          {note.metadata.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.metadata.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{note.metadata.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteFavorite(note.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Toggle favorite"
                      >
                        <Star className={`w-3 h-3 ${
                          note.metadata?.favorite 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteToggle(note.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Toggle pin"
                      >
                        <Pin className={`w-3 h-3 ${
                          note.metadata?.pinned 
                            ? 'text-blue-500' 
                            : 'text-gray-400 hover:text-blue-500'
                        }`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNoteDelete(note.id);
                        }}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}