import React, { useState, useCallback, useEffect } from 'react';
import {
  Type,
  Code,
  GitBranch,
  Calculator,
  Eye,
  EyeOff,
  Download,
  Save,
  Maximize2,
  Minimize2,
  Settings,
  Edit2,
  Check,
  X,
  Code2,
  Brain,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Image,
  Table,
  FileText,
  Columns,
  Hash,
  Play,
  Pause,
  RotateCcw,
  Search,
  Replace,
  Copy,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Monitor,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Keyboard,
  Sparkles
} from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  keyboardShortcut?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'icon';
}

interface ModeConfig {
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface EditorSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  showMinimap: boolean;
  enableWordWrap: boolean;
  enableVimMode: boolean;
  tabSize: number;
  indentSize: number;
  useSpaces: boolean;
  enableEmmet: boolean;
  livePreview: boolean;
  showPreview: boolean;
  mermaidTheme: string;
  mathPreview: boolean;
  syntaxHighlight: boolean;
  showRuler: boolean;
  highlightActiveLine: boolean;
  highlightSelectionMatches: boolean;
  autoCloseBrackets: boolean;
  showInvisibles: boolean;
}

const EDITOR_MODES: Record<string, ModeConfig> = {
  'rich-text': {
    title: 'Rich Text',
    icon: Type,
    description: 'Formatted text with images, tables, and links',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
  },
  'code': {
    title: 'Code',
    icon: Code,
    description: 'Source code with syntax highlighting',
    color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
  },
  'syntax-highlight': {
    title: 'Syntax Highlight',
    icon: Code2,
    description: 'Syntax highlighted code blocks',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300'
  },
  'mind-map': {
    title: 'Mind Map',
    icon: Brain,
    description: 'Interactive mind mapping with drag and drop',
    color: 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-300'
  },
  'mermaid': {
    title: 'Mermaid',
    icon: GitBranch,
    description: 'Flowcharts, diagrams, and visualizations',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
  },
  'math': {
    title: 'Math',
    icon: Calculator,
    description: 'LaTeX mathematical expressions',
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300'
  }
};

const DEFAULT_SETTINGS: EditorSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  theme: 'system',
  fontSize: 14,
  lineHeight: 1.5,
  showLineNumbers: true,
  showMinimap: false,
  enableWordWrap: true,
  enableVimMode: false,
  tabSize: 2,
  indentSize: 2,
  useSpaces: true,
  enableEmmet: true,
  livePreview: true,
  showPreview: false,
  mermaidTheme: 'default',
  mathPreview: true,
  syntaxHighlight: true,
  showRuler: false,
  highlightActiveLine: true,
  highlightSelectionMatches: false,
  autoCloseBrackets: true,
  showInvisibles: false
};

interface EditorToolbarProps {
  mode: string;
  onModeChange: (mode: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExport?: () => void;
  onSave?: () => void;
  onPreview?: () => void;
  onExportMarkdown?: () => void;
  onExportHTML?: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
  showKeyboardShortcuts?: boolean;
  onToggleKeyboardShortcuts?: () => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  search?: () => void;
  replace?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
  copy?: () => void;
  paste?: () => void;
  find?: () => void;
  className?: string;
}

function ToolbarButton({
  icon,
  label,
  isActive = false,
  disabled = false,
  onClick,
  keyboardShortcut,
  variant = 'ghost',
  size = 'sm'
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${label}${keyboardShortcut ? ` (${keyboardShortcut})` : ''}`}
      className={`
        inline-flex items-center justify-center rounded-md transition-colors
        ${size === 'icon' ? 'w-8 h-8' : 'px-2 py-1'}
        ${variant === 'outline' 
          ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700' 
          : variant === 'ghost'
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${isActive 
          ? 'bg-blue-500 text-white dark:bg-blue-600' 
          : 'text-gray-700 dark:text-gray-300'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        text-xs sm:text-sm
      `}
    >
      <span className={size === 'icon' ? 'w-4 h-4' : 'w-3 h-3 mr-1'}>{icon}</span>
      {size !== 'icon' && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

export default function EditorToolbar({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  title,
  onTitleChange,
  isFullscreen,
  onToggleFullscreen,
  onExport,
  onSave,
  settings,
  onSettingsChange,
  showSettings,
  onToggleSettings,
  showKeyboardShortcuts,
  onToggleKeyboardShortcuts,
  isPreview,
  onTogglePreview,
  undo,
  redo,
  canUndo,
  canRedo,
  search,
  replace,
  zoomIn,
  zoomOut,
  resetZoom,
  copy,
  paste,
  find,
  className = ''
}: EditorToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || '');

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(title || '');
    }
  }, [title, isEditingTitle]);

  const handleModeChange = useCallback((newMode: string) => {
    onModeChange(newMode);
  }, [onModeChange]);

  const handleTitleEdit = useCallback(() => {
    setEditedTitle(title || '');
    setIsEditingTitle(true);
  }, [title]);

  const saveTitle = useCallback(() => {
    if (editedTitle.trim() && editedTitle !== title) {
      onTitleChange?.(editedTitle.trim());
    }
    setIsEditingTitle(false);
  }, [editedTitle, title, onTitleChange]);

  const cancelTitleEdit = useCallback(() => {
    setEditedTitle(title || '');
    setIsEditingTitle(false);
  }, [title]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            undo?.();
          }
          break;
        case 'y':
        case 'Z':
          e.preventDefault();
          redo?.();
          break;
        case 'f':
          e.preventDefault();
          find?.();
          break;
        case 'h':
          e.preventDefault();
          replace?.();
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn?.();
          break;
        case '-':
          e.preventDefault();
          zoomOut?.();
          break;
        case '0':
          e.preventDefault();
          resetZoom?.();
          break;
        case 'c':
          e.preventDefault();
          copy?.();
          break;
        case 'v':
          e.preventDefault();
          paste?.();
          break;
      }
    }
  }, [onSave, undo, redo, find, replace, zoomIn, zoomOut, resetZoom, copy, paste]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getModeIcon = (modeKey: string) => {
    const config = EDITOR_MODES[modeKey];
    return config ? React.createElement(config.icon, { className: 'w-4 h-4' }) : null;
  };

  const getModeColor = (modeKey: string) => {
    const config = EDITOR_MODES[modeKey];
    return config ? config.color : '';
  };

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Main Toolbar */}
      <div className="flex items-center justify-between p-2 sm:p-3">
        {/* Left Section - Title & Mode */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          {/* Title Editing */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') cancelTitleEdit();
                  }}
                  onBlur={saveTitle}
                  className="text-sm sm:text-base font-medium bg-transparent text-gray-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 max-w-xs"
                  placeholder="Document title..."
                  autoFocus
                />
                <button
                  onClick={saveTitle}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                  title="Save title"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={cancelTitleEdit}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 min-w-0">
                <h2 
                  onClick={handleTitleEdit}
                  className="text-sm sm:text-base font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  title="Click to edit title"
                >
                  {title || 'Untitled Document'}
                </h2>
                <button
                  onClick={handleTitleEdit}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                  title="Edit title"
                >
                  <Edit2 className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="hidden lg:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {Object.entries(EDITOR_MODES).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  className={`inline-flex items-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? `${config.color} shadow-sm`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={config.description}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.title}
                </button>
              );
            })}
          </div>

          {/* Mobile Mode Selector */}
          <div className="lg:hidden flex items-center space-x-1">
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
            >
              {Object.entries(EDITOR_MODES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Undo/Redo */}
          <div className="hidden sm:flex items-center space-x-1">
            <ToolbarButton
              icon={<Undo className="w-3 h-3" />}
              label="Undo"
              disabled={!canUndo}
              onClick={undo || (() => {})}
              keyboardShortcut="Ctrl+Z"
            />
            <ToolbarButton
              icon={<Redo className="w-3 h-3" />}
              label="Redo"
              disabled={!canRedo}
              onClick={redo || (() => {})}
              keyboardShortcut="Ctrl+Y"
            />
          </div>

          {/* Search & Replace */}
          <div className="hidden sm:flex items-center space-x-1">
            <ToolbarButton
              icon={<Search className="w-3 h-3" />}
              label="Find"
              onClick={find || (() => {})}
              keyboardShortcut="Ctrl+F"
            />
            <ToolbarButton
              icon={<Replace className="w-3 h-3" />}
              label="Replace"
              onClick={replace || (() => {})}
              keyboardShortcut="Ctrl+H"
            />
          </div>

          {/* Preview Toggle (for specific modes) */}
          {(mode === 'mermaid' || mode === 'math' || mode === 'syntax-highlight') && (
            <ToolbarButton
              icon={isPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              label={isPreview ? 'Code' : 'Preview'}
              onClick={onTogglePreview || (() => {})}
              isActive={isPreview}
            />
          )}

          {/* Settings */}
          <ToolbarButton
            icon={<Settings className="w-3 h-3" />}
            label="Settings"
            onClick={onToggleSettings || (() => {})}
            isActive={showSettings}
          />

          {/* Keyboard Shortcuts */}
          <ToolbarButton
            icon={<Keyboard className="w-3 h-3" />}
            label="Shortcuts"
            onClick={onToggleKeyboardShortcuts || (() => {})}
            isActive={showKeyboardShortcuts}
          />

          {/* Save & Export */}
          <div className="hidden sm:flex items-center space-x-1">
            <ToolbarButton
              icon={<Save className="w-3 h-3" />}
              label="Save"
              onClick={onSave || (() => {})}
              keyboardShortcut="Ctrl+S"
            />
            <ToolbarButton
              icon={<Download className="w-3 h-3" />}
              label="Export"
              onClick={onExport || (() => {})}
            />
          </div>

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <ToolbarButton
              icon={isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              onClick={onToggleFullscreen}
            />
          )}
        </div>
      </div>

      {/* Secondary Toolbar - Mode-specific features */}
      <div className="border-t border-gray-100 dark:border-gray-700 p-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Language Selector for Code modes */}
          {(mode === 'code' || mode === 'syntax-highlight') && (
            <>
              <select
                value={language || 'javascript'}
                onChange={(e) => onLanguageChange?.(e.target.value)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="xml">XML</option>
                <option value="markdown">Markdown</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
              </select>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            </>
          )}

          {/* Rich Text Toolbar */}
          {mode === 'rich-text' && (
            <>
              <div className="flex items-center space-x-1">
                <ToolbarButton icon={<Bold className="w-3 h-3" />} label="Bold" keyboardShortcut="Ctrl+B" onClick={() => {}} />
                <ToolbarButton icon={<Italic className="w-3 h-3" />} label="Italic" keyboardShortcut="Ctrl+I" onClick={() => {}} />
                <ToolbarButton icon={<Underline className="w-3 h-3" />} label="Underline" keyboardShortcut="Ctrl+U" onClick={() => {}} />
                <ToolbarButton icon={<Strikethrough className="w-3 h-3" />} label="Strikethrough" onClick={() => {}} />
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-1">
                <ToolbarButton icon={<List className="w-3 h-3" />} label="Bullet List" onClick={() => {}} />
                <ToolbarButton icon={<ListOrdered className="w-3 h-3" />} label="Numbered List" onClick={() => {}} />
                <ToolbarButton icon={<Quote className="w-3 h-3" />} label="Quote" onClick={() => {}} />
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-1">
                <ToolbarButton icon={<Link className="w-3 h-3" />} label="Link" keyboardShortcut="Ctrl+K" onClick={() => {}} />
                <ToolbarButton icon={<Image className="w-3 h-3" />} label="Image" onClick={() => {}} />
                <ToolbarButton icon={<Table className="w-3 h-3" />} label="Table" onClick={() => {}} />
              </div>
            </>
          )}

          {/* Mermaid Toolbar */}
          {mode === 'mermaid' && (
            <>
              <select
                onChange={(e) => {
                  // This would be handled by parent component
                  if (e.target.value) {
                    // Trigger template insertion
                  }
                }}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
              >
                <option value="">Templates...</option>
                <option value="flowchart">Flowchart</option>
                <option value="sequence">Sequence Diagram</option>
                <option value="gantt">Gantt Chart</option>
                <option value="state">State Diagram</option>
                <option value="journey">User Journey</option>
                <option value="gitgraph">Git Graph</option>
              </select>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <ToolbarButton
                icon={<RotateCcw className="w-3 h-3" />}
                label="Render"
                onClick={() => {/* Trigger rendering */}}
              />
              <ToolbarButton
                icon={<Sparkles className="w-3 h-3" />}
                label="Auto-layout"
                onClick={() => {/* Trigger auto-layout */}}
              />
            </>
          )}

          {/* Math Toolbar */}
          {mode === 'math' && (
            <>
              <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                <span>LaTeX:</span>
              </div>
              <button className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                ∫ ∑ ∏
              </button>
              <button className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                α β γ δ
              </button>
              <button className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                → ⇒ ⟹
              </button>
            </>
          )}

          {/* Zoom Controls */}
          <div className="ml-auto flex items-center space-x-1">
            <ToolbarButton
              icon={<ZoomOut className="w-3 h-3" />}
              label="Zoom Out"
              onClick={zoomOut || (() => {})}
              keyboardShortcut="Ctrl+-"
            />
            <ToolbarButton
              icon={<ZoomIn className="w-3 h-3" />}
              label="Zoom In"
              onClick={zoomIn || (() => {})}
              keyboardShortcut="Ctrl+="
            />
            <ToolbarButton
              icon={<Monitor className="w-3 h-3" />}
              label="Reset Zoom"
              onClick={resetZoom || (() => {})}
              keyboardShortcut="Ctrl+0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}