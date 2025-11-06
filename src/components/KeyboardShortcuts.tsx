import React, { useState } from 'react';
import {
  Keyboard,
  X,
  Search,
  Edit,
  Save,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Search as SearchIcon,
  Replace,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Table,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  Code,
  FileText,
  GitBranch,
  Calculator,
  Type,
  Brain,
  Sparkles,
  Play,
  Settings,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Delete
} from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
  icon?: React.ReactNode;
  contexts?: string[];
}

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // File Operations
  {
    key: 'Ctrl+S',
    description: 'Save document',
    category: 'File',
    icon: <Save className="w-4 h-4" />
  },
  {
    key: 'Ctrl+O',
    description: 'Open document',
    category: 'File',
    icon: <FileText className="w-4 h-4" />
  },
  {
    key: 'Ctrl+N',
    description: 'New document',
    category: 'File',
    icon: <FileText className="w-4 h-4" />
  },
  {
    key: 'Ctrl+P',
    description: 'Print document',
    category: 'File',
    icon: <FileText className="w-4 h-4" />
  },

  // Edit Operations
  {
    key: 'Ctrl+Z',
    description: 'Undo',
    category: 'Edit',
    icon: <Undo className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Y',
    description: 'Redo',
    category: 'Edit',
    icon: <Redo className="w-4 h-4" />
  },
  {
    key: 'Ctrl+X',
    description: 'Cut',
    category: 'Edit',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Ctrl+C',
    description: 'Copy',
    category: 'Edit',
    icon: <Copy className="w-4 h-4" />
  },
  {
    key: 'Ctrl+V',
    description: 'Paste',
    category: 'Edit',
    icon: <Clipboard className="w-4 h-4" />
  },
  {
    key: 'Ctrl+A',
    description: 'Select All',
    category: 'Edit',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Ctrl+D',
    description: 'Duplicate Line',
    category: 'Edit',
    icon: <Copy className="w-4 h-4" />
  },
  {
    key: 'Ctrl+L',
    description: 'Select Line',
    category: 'Edit',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Shift+Delete',
    description: 'Delete Line',
    category: 'Edit',
    icon: <Delete className="w-4 h-4" />
  },

  // Search & Replace
  {
    key: 'Ctrl+F',
    description: 'Find',
    category: 'Search',
    icon: <Search className="w-4 h-4" />
  },
  {
    key: 'Ctrl+H',
    description: 'Replace',
    category: 'Search',
    icon: <Replace className="w-4 h-4" />
  },
  {
    key: 'F3',
    description: 'Find Next',
    category: 'Search',
    icon: <SearchIcon className="w-4 h-4" />
  },
  {
    key: 'Shift+F3',
    description: 'Find Previous',
    category: 'Search',
    icon: <SearchIcon className="w-4 h-4" />
  },
  {
    key: 'Ctrl+G',
    description: 'Go to Line',
    category: 'Search',
    icon: <Edit className="w-4 h-4" />
  },

  // View
  {
    key: 'Ctrl++',
    description: 'Zoom In',
    category: 'View',
    icon: <ZoomIn className="w-4 h-4" />
  },
  {
    key: 'Ctrl+-',
    description: 'Zoom Out',
    category: 'View',
    icon: <ZoomOut className="w-4 h-4" />
  },
  {
    key: 'Ctrl+0',
    description: 'Reset Zoom',
    category: 'View',
    icon: <RotateCcw className="w-4 h-4" />
  },
  {
    key: 'F11',
    description: 'Toggle Fullscreen',
    category: 'View',
    icon: <Maximize2 className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+W',
    description: 'Toggle Word Wrap',
    category: 'View',
    icon: <Edit className="w-4 h-4" />
  },

  // Editor Modes
  {
    key: 'Ctrl+1',
    description: 'Rich Text Mode',
    category: 'Modes',
    icon: <Type className="w-4 h-4" />
  },
  {
    key: 'Ctrl+2',
    description: 'Code Mode',
    category: 'Modes',
    icon: <Code className="w-4 h-4" />
  },
  {
    key: 'Ctrl+3',
    description: 'Syntax Highlight Mode',
    category: 'Modes',
    icon: <Code className="w-4 h-4" />
  },
  {
    key: 'Ctrl+4',
    description: 'Mermaid Mode',
    category: 'Modes',
    icon: <GitBranch className="w-4 h-4" />
  },
  {
    key: 'Ctrl+5',
    description: 'Math Mode',
    category: 'Modes',
    icon: <Calculator className="w-4 h-4" />
  },
  {
    key: 'Ctrl+6',
    description: 'Mind Map Mode',
    category: 'Modes',
    icon: <Brain className="w-4 h-4" />
  },

  // Rich Text Formatting
  {
    key: 'Ctrl+B',
    description: 'Bold',
    category: 'Formatting',
    icon: <Bold className="w-4 h-4" />
  },
  {
    key: 'Ctrl+I',
    description: 'Italic',
    category: 'Formatting',
    icon: <Italic className="w-4 h-4" />
  },
  {
    key: 'Ctrl+U',
    description: 'Underline',
    category: 'Formatting',
    icon: <Underline className="w-4 h-4" />
  },
  {
    key: 'Ctrl+K',
    description: 'Insert Link',
    category: 'Formatting',
    icon: <Link className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+S',
    description: 'Strikethrough',
    category: 'Formatting',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+L',
    description: 'Bulleted List',
    category: 'Formatting',
    icon: <List className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+O',
    description: 'Numbered List',
    category: 'Formatting',
    icon: <ListOrdered className="w-4 h-4" />
  },
  {
    key: 'Ctrl+T',
    description: 'Insert Table',
    category: 'Formatting',
    icon: <Table className="w-4 h-4" />
  },

  // Preview & Toggle
  {
    key: 'Ctrl+Shift+P',
    description: 'Toggle Preview',
    category: 'View',
    icon: <Eye className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+E',
    description: 'Toggle Editor',
    category: 'View',
    icon: <EyeOff className="w-4 h-4" />
  },

  // Code Editor Specific
  {
    key: 'Ctrl+/',
    description: 'Toggle Comment',
    category: 'Code',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Shift+Alt+A',
    description: 'Block Comment',
    category: 'Code',
    icon: <Edit className="w-4 h-4" />
  },
  {
    key: 'Tab',
    description: 'Indent Line',
    category: 'Code',
    icon: null
  },
  {
    key: 'Shift+Tab',
    description: 'Outdent Line',
    category: 'Code',
    icon: null
  },

  // Mermaid Specific
  {
    key: 'Ctrl+Shift+M',
    description: 'Render Mermaid',
    category: 'Mermaid',
    icon: <Play className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Shift+A',
    description: 'Auto-layout Mermaid',
    category: 'Mermaid',
    icon: <Sparkles className="w-4 h-4" />
  },

  // Navigation
  {
    key: 'Home',
    description: 'Start of Line',
    category: 'Navigation',
    icon: <Home className="w-4 h-4" />
  },
  {
    key: 'End',
    description: 'End of Line',
    category: 'Navigation',
    icon: <Home className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Home',
    description: 'Start of Document',
    category: 'Navigation',
    icon: <Home className="w-4 h-4" />
  },
  {
    key: 'Ctrl+End',
    description: 'End of Document',
    category: 'Navigation',
    icon: <Home className="w-4 h-4" />
  },
  {
    key: 'Page Up',
    description: 'Page Up',
    category: 'Navigation',
    icon: <ArrowUp className="w-4 h-4" />
  },
  {
    key: 'Page Down',
    description: 'Page Down',
    category: 'Navigation',
    icon: <ArrowDown className="w-4 h-4" />
  },

  // Selection
  {
    key: 'Shift+Arrow Left',
    description: 'Select Left Character',
    category: 'Selection',
    icon: <ArrowLeft className="w-4 h-4" />
  },
  {
    key: 'Shift+Arrow Right',
    description: 'Select Right Character',
    category: 'Selection',
    icon: <ArrowRight className="w-4 h-4" />
  },
  {
    key: 'Shift+Arrow Up',
    description: 'Select Up Line',
    category: 'Selection',
    icon: <ArrowUp className="w-4 h-4" />
  },
  {
    key: 'Shift+Arrow Down',
    description: 'Select Down Line',
    category: 'Selection',
    icon: <ArrowDown className="w-4 h-4" />
  },

  // Generic
  {
    key: 'Escape',
    description: 'Close Dialog/Escape',
    category: 'Generic',
    icon: null
  },
  {
    key: 'F1',
    description: 'Help',
    category: 'Generic',
    icon: <Settings className="w-4 h-4" />
  },
  {
    key: 'Ctrl+Q',
    description: 'Quit/Close',
    category: 'Generic',
    icon: <X className="w-4 h-4" />
  }
];

const CATEGORIES = [
  'File',
  'Edit',
  'Search',
  'View',
  'Modes',
  'Formatting',
  'Code',
  'Mermaid',
  'Navigation',
  'Selection',
  'Generic'
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode?: string;
  className?: string;
}

function KeyboardShortcuts({
  isOpen,
  onClose,
  currentMode = 'rich-text',
  className = ''
}: KeyboardShortcutsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter(shortcut => {
    const matchesSearch = shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatKeyCombo = (key: string) => {
    return key.replace('Arrow', '').replace('Ctrl', '⌘').replace('Shift', '⇧').replace('Alt', '⌥');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categories</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm rounded ${
                  selectedCategory === 'All'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>All</span>
                <span className="ml-auto text-xs">({KEYBOARD_SHORTCUTS.length})</span>
              </button>
              {CATEGORIES.map(category => {
                const count = KEYBOARD_SHORTCUTS.filter(s => s.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm rounded ${
                      selectedCategory === category
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{category}</span>
                    <span className="ml-auto text-xs">({count})</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 p-4 overflow-y-auto">
            {Object.keys(groupedShortcuts).length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No shortcuts found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({shortcuts.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {shortcut.icon && (
                              <div className="text-gray-500 dark:text-gray-400">
                                {shortcut.icon}
                              </div>
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {shortcut.description}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {shortcut.key.split('+').map((part, partIndex) => (
                              <React.Fragment key={partIndex}>
                                <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 font-mono">
                                  {formatKeyCombo(part)}
                                </kbd>
                                {partIndex < shortcut.key.split('+').length - 1 && (
                                  <span className="text-gray-400 text-xs">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Current Mode: <strong>{currentMode}</strong></span>
              <span>Total Shortcuts: <strong>{filteredShortcuts.length}</strong></span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">⌘</kbd>
                <span>= Ctrl/Cmd</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">⇧</kbd>
                <span>= Shift</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">⌥</kbd>
                <span>= Alt/Option</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { KeyboardShortcuts, KEYBOARD_SHORTCUTS };