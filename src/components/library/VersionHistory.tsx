// Version History Component
// Shows note version history with diff visualization and restore functionality

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Clock,
  User,
  RotateCcw,
  Eye,
  X,
  ChevronRight,
  FileText,
  Edit3,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { NoteVersion, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface VersionHistoryProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: string, contentData: any) => void;
}

interface VersionDiff {
  added: number;
  removed: number;
  modified: number;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  noteId,
  isOpen,
  onClose,
  onRestore
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<NoteVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && noteId) {
      loadVersions();
    }
  }, [isOpen, noteId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const noteVersions = await advancedLibraryService.getNoteVersions(noteId);
      setVersions(noteVersions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (version: NoteVersion) => {
    setSelectedVersion(version);
    setCompareVersion(null);
    setDiff(null);
    
    if (versions.length > 1) {
      const currentIndex = versions.findIndex(v => v.id === version.id);
      if (currentIndex < versions.length - 1) {
        // Calculate diff with next version (newer)
        const nextVersion = versions[currentIndex + 1];
        calculateDiff(nextVersion.content, version.content);
      }
    }
  };

  const handleCompareVersions = (version1: NoteVersion, version2: NoteVersion) => {
    setSelectedVersion(version1);
    setCompareVersion(version2);
    calculateDiff(version1.content, version2.content);
  };

  const calculateDiff = (oldContent: string, newContent: string) => {
    // Simple diff calculation - in production, use a proper diff library
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let added = 0, removed = 0, modified = 0;
    
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (!oldLine && newLine) {
        added++;
      } else if (oldLine && !newLine) {
        removed++;
      } else if (oldLine !== newLine) {
        modified++;
      }
    }
    
    setDiff({ added, removed, modified });
  };

  const handleRestoreVersion = async (version: NoteVersion) => {
    if (!user) return;
    
    setIsRestoring(true);
    try {
      const content = await advancedLibraryService.restoreVersion(noteId, version.id);
      onRestore(content.content, content.contentData);
      loadVersions(); // Refresh versions after restore
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'restore':
        return <RotateCcw className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return 'text-green-600 bg-green-50';
      case 'edit':
        return 'text-blue-600 bg-blue-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      case 'restore':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Version History
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {versions.length} versions
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
          {/* Version List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Versions
              </h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedVersion?.id === version.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleVersionSelect(version)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getChangeTypeIcon(version.changeType)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getChangeTypeColor(version.changeType)}`}>
                            v{version.versionNumber}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      
                      {version.changeSummary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {version.changeSummary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{version.createdBy || 'Unknown'}</span>
                        </div>
                        
                        {versions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = versions.findIndex(v => v.id === version.id);
                              if (currentIndex > 0) {
                                handleCompareVersions(version, versions[currentIndex - 1]);
                              }
                            }}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            Compare
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Version Content */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                {/* Version Info */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getChangeTypeIcon(selectedVersion.changeType)}
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        Version {selectedVersion.versionNumber}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getChangeTypeColor(selectedVersion.changeType)}`}>
                        {selectedVersion.changeType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(selectedVersion.createdAt)}
                      </span>
                      <button
                        onClick={() => handleRestoreVersion(selectedVersion)}
                        disabled={isRestoring}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {selectedVersion.changeSummary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedVersion.changeSummary}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{selectedVersion.createdBy || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(selectedVersion.createdAt)}</span>
                    </div>
                    {diff && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">+{diff.added}</span>
                        <span className="text-red-600">-{diff.removed}</span>
                        <span className="text-yellow-600">±{diff.modified}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>

                {/* Compare View */}
                {compareVersion && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comparing with Version {compareVersion.versionNumber}
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                        {compareVersion.content}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Version
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a version from the list to view its content and changes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
