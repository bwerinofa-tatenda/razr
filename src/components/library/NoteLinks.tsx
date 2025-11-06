// Note Links Component
// Manages cross-references between notes with backlinks and forward links

import React, { useState, useEffect } from 'react';
import {
  Link,
  ExternalLink,
  Plus,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  GitBranch,
  FileText,
  TrendingUp,
  Target,
  Hash,
  Calendar,
  User
} from 'lucide-react';
import { NoteLink, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface NoteLinksProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onLinkCreate: (sourceId: string, targetId: string, linkType: string) => void;
}

interface NoteReference {
  id: string;
  title?: string;
  text: string;
  category?: string;
  created_at: string;
}

const NoteLinks: React.FC<NoteLinksProps> = ({
  noteId,
  isOpen,
  onClose,
  onLinkCreate
}) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [outgoingLinks, setOutgoingLinks] = useState<NoteLink[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<NoteLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteReference[]>([]);
  const [selectedLinkType, setSelectedLinkType] = useState<'reference' | 'citation' | 'trades' | 'pattern'>('reference');
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  useEffect(() => {
    if (isOpen && noteId) {
      loadLinks();
    }
  }, [isOpen, noteId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchNotes();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadLinks = async () => {
    setIsLoading(true);
    try {
      const noteLinks = await advancedLibraryService.getNoteLinks(noteId);
      
      // Separate outgoing and incoming links
      const outgoing = noteLinks.filter(link => link.sourceNoteId === noteId);
      const incoming = noteLinks.filter(link => link.targetNoteId === noteId);
      
      setOutgoingLinks(outgoing);
      setIncomingLinks(incoming);
      setLinks(noteLinks);
    } catch (error) {
      console.error('Failed to load links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchNotes = async () => {
    try {
      // Simulate search - in production, this would query the database
      const mockResults: NoteReference[] = [
        {
          id: '1',
          title: 'Market Analysis Template',
          text: 'A comprehensive template for market analysis...',
          category: 'analysis',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Daily Trading Plan',
          text: 'My daily trading strategy and goals...',
          category: 'planning',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Psychology Notes',
          text: 'Understanding trading psychology and emotional control...',
          category: 'psychology',
          created_at: new Date().toISOString()
        }
      ];
      
      const filtered = mockResults.filter(result => 
        result.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search notes:', error);
    }
  };

  const handleCreateLink = async (targetNoteId: string) => {
    if (!user) return;
    
    try {
      await advancedLibraryService.createLink(
        noteId,
        targetNoteId,
        selectedLinkType
      );
      
      await loadLinks();
      setIsCreatingLink(false);
      setSearchQuery('');
      setSearchResults([]);
      
      onLinkCreate(noteId, targetNoteId, selectedLinkType);
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  };

  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType) {
      case 'reference':
        return <FileText className="w-4 h-4" />;
      case 'citation':
        return <Hash className="w-4 h-4" />;
      case 'trades':
        return <TrendingUp className="w-4 h-4" />;
      case 'pattern':
        return <Target className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getLinkTypeColor = (linkType: string) => {
    switch (linkType) {
      case 'reference':
        return 'text-blue-600 bg-blue-50';
      case 'citation':
        return 'text-purple-600 bg-purple-50';
      case 'trades':
        return 'text-green-600 bg-green-50';
      case 'pattern':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Note Links & References
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {links.length} total links
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4 space-y-2">
              <button
                onClick={() => setIsCreatingLink(false)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  !isCreatingLink
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Link className="w-4 h-4" />
                  <span className="text-sm font-medium">All Links</span>
                </div>
              </button>
              
              <button
                onClick={() => setIsCreatingLink(true)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isCreatingLink
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Link</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : isCreatingLink ? (
              <CreateLinkTab
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchResults={searchResults}
                selectedLinkType={selectedLinkType}
                onLinkTypeChange={setSelectedLinkType}
                onCreateLink={handleCreateLink}
                getLinkTypeColor={getLinkTypeColor}
                getLinkTypeIcon={getLinkTypeIcon}
                formatDate={formatDate}
              />
            ) : (
              <LinksTab
                outgoingLinks={outgoingLinks}
                incomingLinks={incomingLinks}
                getLinkTypeColor={getLinkTypeColor}
                getLinkTypeIcon={getLinkTypeIcon}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateLinkTabProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: NoteReference[];
  selectedLinkType: string;
  onLinkTypeChange: (type: 'reference' | 'citation' | 'trades' | 'pattern') => void;
  onCreateLink: (noteId: string) => void;
  getLinkTypeColor: (type: string) => string;
  getLinkTypeIcon: (type: string) => React.ReactNode;
  formatDate: (date: string) => string;
}

const CreateLinkTab: React.FC<CreateLinkTabProps> = ({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  selectedLinkType,
  onLinkTypeChange,
  onCreateLink,
  getLinkTypeColor,
  getLinkTypeIcon,
  formatDate
}) => {
  const linkTypes = [
    { value: 'reference', label: 'Reference', description: 'General reference to related content' },
    { value: 'citation', label: 'Citation', description: 'Quote or cite specific content' },
    { value: 'trades', label: 'Trades', description: 'Link to specific trades' },
    { value: 'pattern', label: 'Pattern', description: 'Link to similar patterns' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Create New Link
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {linkTypes.map(type => (
              <button
                key={type.value}
                onClick={() => onLinkTypeChange(type.value as any)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedLinkType === type.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded ${getLinkTypeColor(type.value)}`}>
                    {getLinkTypeIcon(type.value)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Notes
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search for notes to link..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Search Results ({searchResults.length})
          </h4>
          <div className="space-y-2">
            {searchResults.map(note => (
              <div
                key={note.id}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {note.title && (
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {note.title}
                      </h5>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {note.text}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {note.category && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                          {note.category}
                        </span>
                      )}
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onCreateLink(note.id)}
                    className="ml-3 p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Create Link"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notes found matching your search
          </p>
        </div>
      )}
    </div>
  );
};

interface LinksTabProps {
  outgoingLinks: NoteLink[];
  incomingLinks: NoteLink[];
  getLinkTypeColor: (type: string) => string;
  getLinkTypeIcon: (type: string) => React.ReactNode;
  formatDate: (date: string) => string;
}

const LinksTab: React.FC<LinksTabProps> = ({
  outgoingLinks,
  incomingLinks,
  getLinkTypeColor,
  getLinkTypeIcon,
  formatDate
}) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Link Network
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outgoing Links */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Outgoing Links ({outgoingLinks.length})
              </h4>
            </div>
            <div className="space-y-2">
              {outgoingLinks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No outgoing links
                </p>
              ) : (
                outgoingLinks.map(link => (
                  <div
                    key={link.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${getLinkTypeColor(link.linkType)}`}>
                          {getLinkTypeIcon(link.linkType)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {link.linkType}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(link.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Links to note: {link.targetNoteId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Incoming Links */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ArrowLeft className="w-4 h-4 text-green-500" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incoming Links ({incomingLinks.length})
              </h4>
            </div>
            <div className="space-y-2">
              {incomingLinks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No incoming links
                </p>
              ) : (
                incomingLinks.map(link => (
                  <div
                    key={link.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${getLinkTypeColor(link.linkType)}`}>
                          {getLinkTypeIcon(link.linkType)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {link.linkType}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(link.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Linked from note: {link.sourceNoteId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteLinks;
