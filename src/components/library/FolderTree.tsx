import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Folder, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Hash,
  Tag
} from 'lucide-react';
import type { MockNote } from '../../lib/mockStorage';

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  type: 'folder' | 'tag';
  noteCount: number;
  expanded: boolean;
}

interface FolderTreeProps {
  folders: FolderNode[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: (parentId: string | null, name: string, type: 'folder' | 'tag') => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
  onFolderToggle: (folderId: string) => void;
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderToggle
}: FolderTreeProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showNewFolderMenu, setShowNewFolderMenu] = useState(false);
  const [newFolderType, setNewFolderType] = useState<'folder' | 'tag'>('folder');

  const startEditing = (folder: FolderNode) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onFolderRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = folder.expanded;
    const Icon = folder.type === 'tag' ? Hash : folder.children.length > 0 ? (isExpanded ? FolderOpen : Folder) : Folder;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`group flex items-center rounded-lg transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          {folder.children.length > 0 && (
            <button
              onClick={() => onFolderToggle(folder.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Folder/Tag Icon */}
          <button
            onClick={() => onFolderSelect(folder.id)}
            className="flex items-center flex-1 p-2 rounded-lg transition-colors"
          >
            <Icon className={`w-4 h-4 mr-2 ${
              folder.type === 'tag' 
                ? 'text-purple-500' 
                : isSelected 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
            }`} />
            
            {editingId === folder.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEdit}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {folder.name}
              </span>
            )}
          </button>

          {/* Note Count */}
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {folder.noteCount}
          </span>

          {/* Action Buttons */}
          {editingId !== folder.id && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onFolderCreate(folder.id, '', newFolderType)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Add sub-item"
              >
                <Plus className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </button>
              <button
                onClick={() => startEditing(folder)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Rename"
              >
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </button>
              <button
                onClick={() => onFolderDelete(folder.id)}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && folder.children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Library</h2>
          <div className="relative">
            <button
              onClick={() => setShowNewFolderMenu(!showNewFolderMenu)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Add new item"
            >
              <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            {showNewFolderMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    onFolderCreate(null, '', 'folder');
                    setShowNewFolderMenu(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  New Folder
                </button>
                <button
                  onClick={() => {
                    onFolderCreate(null, '', 'tag');
                    setShowNewFolderMenu(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  New Tag
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* All Notes */}
        <div
          className={`group flex items-center rounded-lg transition-colors mb-2 ${
            selectedFolderId === null 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <button
            onClick={() => onFolderSelect(null)}
            className="flex items-center flex-1 p-2 rounded-lg transition-colors"
          >
            <FolderOpen className={`w-4 h-4 mr-2 ${
              selectedFolderId === null 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">All Notes</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {folders.reduce((sum, f) => sum + f.noteCount, 0)}
            </span>
          </button>
        </div>

        {/* Quick Access Tags */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Quick Access
          </h3>
          <div className="space-y-1">
            {folders.filter(f => f.type === 'tag' && f.parentId === null).map(tag => (
              <div
                key={tag.id}
                className={`group flex items-center rounded-lg transition-colors ${
                  selectedFolderId === tag.id 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <button
                  onClick={() => onFolderSelect(tag.id)}
                  className="flex items-center flex-1 p-2 rounded-lg transition-colors"
                >
                  <Hash className={`w-4 h-4 mr-2 ${
                    selectedFolderId === tag.id 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-purple-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {tag.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {tag.noteCount}
                  </span>
                </button>
                
                {selectedFolderId !== tag.id && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                    <button
                      onClick={() => startEditing(tag)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Folders */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Folders
          </h3>
          <div className="space-y-1">
            {folders.filter(f => f.type === 'folder' && f.parentId === null).map(folder => 
              renderFolder(folder)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}