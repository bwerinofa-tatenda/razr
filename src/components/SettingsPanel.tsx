import React, { useState, useCallback } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Type,
  Eye,
  EyeOff,
  Code,
  FileText,
  Layout,
  Keyboard,
  Palette,
  Zap,
  Smartphone,
  Tablet,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

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
  darkMode: boolean;
  showCodeFolding: boolean;
  placeholder: string;
  enableSpellCheck: boolean;
  enableAutoCorrect: boolean;
  enableLineWrapping: boolean;
  showIndentGuides: boolean;
  showWhitespace: boolean;
  highlightCurrentLine: boolean;
  enableCodeFolding: boolean;
  showFoldWidgets: boolean;
  enableBracketMatching: boolean;
  enableAutoIndent: boolean;
  showPrintMargin: boolean;
  printMarginColumn: number;
  enableLiveAutocomplete: boolean;
  showGutter: boolean;
  enableSmartIndent: boolean;
  showInvisiblesChar: boolean;
  enableAnimateScrolling: boolean;
  highlightGutterLine: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  onResetSettings: () => void;
  onSaveSettings: () => void;
  currentMode: string;
  className?: string;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: SettingItem[];
}

interface SettingItem {
  key: keyof EditorSettings;
  label: string;
  description: string;
  type: 'boolean' | 'number' | 'select' | 'range' | 'color';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Basic editor preferences and behavior',
    icon: <Settings className="w-4 h-4" />,
    settings: [
      {
        key: 'theme',
        label: 'Editor Theme',
        description: 'Choose your preferred color theme',
        type: 'select',
        options: ['light', 'dark', 'system']
      },
      {
        key: 'autoSave',
        label: 'Auto Save',
        description: 'Automatically save changes to the document',
        type: 'boolean'
      },
      {
        key: 'autoSaveInterval',
        label: 'Auto Save Interval',
        description: 'How often to auto-save (in seconds)',
        type: 'number',
        min: 5,
        max: 300,
        unit: 'seconds'
      },
      {
        key: 'livePreview',
        label: 'Live Preview',
        description: 'Show real-time preview while editing',
        type: 'boolean'
      },
      {
        key: 'enableSpellCheck',
        label: 'Spell Check',
        description: 'Enable spell checking and auto-correction',
        type: 'boolean'
      }
    ]
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Visual settings and layout preferences',
    icon: <Palette className="w-4 h-4" />,
    settings: [
      {
        key: 'fontSize',
        label: 'Font Size',
        description: 'Size of the editor font',
        type: 'range',
        min: 10,
        max: 24,
        unit: 'px'
      },
      {
        key: 'lineHeight',
        label: 'Line Height',
        description: 'Vertical spacing between lines',
        type: 'range',
        min: 1.2,
        max: 2.0,
        step: 0.1
      },
      {
        key: 'showLineNumbers',
        label: 'Line Numbers',
        description: 'Show line numbers in the gutter',
        type: 'boolean'
      },
      {
        key: 'showMinimap',
        label: 'Minimap',
        description: 'Show a mini overview of the document',
        type: 'boolean'
      },
      {
        key: 'highlightActiveLine',
        label: 'Highlight Active Line',
        description: 'Highlight the line where the cursor is',
        type: 'boolean'
      },
      {
        key: 'showWhitespace',
        label: 'Show Whitespace',
        description: 'Display invisible characters (spaces, tabs)',
        type: 'boolean'
      },
      {
        key: 'showRuler',
        label: 'Show Ruler',
        description: 'Show a vertical ruler at the specified column',
        type: 'boolean'
      },
      {
        key: 'printMarginColumn',
        label: 'Print Margin',
        description: 'Column where to show the print margin',
        type: 'number',
        min: 80,
        max: 120
      }
    ]
  },
  {
    id: 'editing',
    title: 'Editing',
    description: 'Text editing and code assistance features',
    icon: <Code className="w-4 h-4" />,
    settings: [
      {
        key: 'enableWordWrap',
        label: 'Word Wrap',
        description: 'Automatically wrap long lines',
        type: 'boolean'
      },
      {
        key: 'tabSize',
        label: 'Tab Size',
        description: 'Number of spaces per tab',
        type: 'number',
        min: 1,
        max: 8
      },
      {
        key: 'indentSize',
        label: 'Indent Size',
        description: 'Number of spaces per indent',
        type: 'number',
        min: 1,
        max: 8
      },
      {
        key: 'useSpaces',
        label: 'Insert Spaces',
        description: 'Use spaces instead of tabs for indentation',
        type: 'boolean'
      },
      {
        key: 'enableAutoIndent',
        label: 'Auto Indent',
        description: 'Automatically indent new lines',
        type: 'boolean'
      },
      {
        key: 'autoCloseBrackets',
        label: 'Auto Close Brackets',
        description: 'Automatically close brackets, quotes, etc.',
        type: 'boolean'
      },
      {
        key: 'enableBracketMatching',
        label: 'Bracket Matching',
        description: 'Highlight matching brackets and quotes',
        type: 'boolean'
      },
      {
        key: 'enableEmmet',
        label: 'Emmet Support',
        description: 'Enable Emmet abbreviations for HTML/CSS',
        type: 'boolean'
      },
      {
        key: 'enableCodeFolding',
        label: 'Code Folding',
        description: 'Allow collapsing code blocks',
        type: 'boolean'
      },
      {
        key: 'enableLiveAutocomplete',
        label: 'Live Autocomplete',
        description: 'Show autocomplete suggestions while typing',
        type: 'boolean'
      }
    ]
  },
  {
    id: 'code',
    title: 'Code Editor',
    description: 'Specific settings for code editing modes',
    icon: <FileText className="w-4 h-4" />,
    settings: [
      {
        key: 'syntaxHighlight',
        label: 'Syntax Highlighting',
        description: 'Enable syntax highlighting for code',
        type: 'boolean'
      },
      {
        key: 'highlightSelectionMatches',
        label: 'Highlight Matches',
        description: 'Highlight all occurrences of selected text',
        type: 'boolean'
      },
      {
        key: 'showGutter',
        label: 'Show Gutter',
        description: 'Show the editor gutter with line numbers and fold widgets',
        type: 'boolean'
      },
      {
        key: 'showFoldWidgets',
        label: 'Fold Widgets',
        description: 'Show fold/collapse widgets in the gutter',
        type: 'boolean'
      },
      {
        key: 'highlightGutterLine',
        label: 'Highlight Gutter Line',
        description: 'Highlight the line in the gutter where the cursor is',
        type: 'boolean'
      },
      {
        key: 'showInvisiblesChar',
        label: 'Show Invisible Characters',
        description: 'Display dots or arrows for tabs, spaces, and line endings',
        type: 'boolean'
      },
      {
        key: 'enableAnimateScrolling',
        label: 'Animate Scrolling',
        description: 'Smooth scrolling when moving the cursor',
        type: 'boolean'
      },
      {
        key: 'showPrintMargin',
        label: 'Show Print Margin',
        description: 'Show a visual margin for printing',
        type: 'boolean'
      }
    ]
  },
  {
    id: 'mode-specific',
    title: 'Mode Specific',
    description: 'Settings specific to the current editing mode',
    icon: <Layout className="w-4 h-4" />,
    settings: [
      {
        key: 'mermaidTheme',
        label: 'Mermaid Theme',
        description: 'Theme for Mermaid diagrams',
        type: 'select',
        options: ['default', 'forest', 'dark', 'neutral', 'base', 'earth']
      },
      {
        key: 'mathPreview',
        label: 'Math Preview',
        description: 'Show real-time preview of LaTeX math expressions',
        type: 'boolean'
      },
      {
        key: 'showPreview',
        label: 'Show Preview',
        description: 'Show split view with preview panel',
        type: 'boolean'
      }
    ]
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    description: 'Settings to improve accessibility and usability',
    icon: <Eye className="w-4 h-4" />,
    settings: [
      {
        key: 'enableAutoCorrect',
        label: 'Auto Correct',
        description: 'Automatically correct common typing mistakes',
        type: 'boolean'
      },
      {
        key: 'showIndentGuides',
        label: 'Indent Guides',
        description: 'Show visual guides for indentation levels',
        type: 'boolean'
      },
      {
        key: 'enableSmartIndent',
        label: 'Smart Indent',
        description: 'Intelligently handle indentation based on context',
        type: 'boolean'
      }
    ]
  }
];

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
  showInvisibles: false,
  darkMode: false,
  showCodeFolding: true,
  placeholder: 'Start typing...',
  enableSpellCheck: true,
  enableAutoCorrect: false,
  enableLineWrapping: true,
  showIndentGuides: false,
  showWhitespace: false,
  highlightCurrentLine: true,
  enableCodeFolding: true,
  showFoldWidgets: true,
  enableBracketMatching: true,
  enableAutoIndent: true,
  showPrintMargin: false,
  printMarginColumn: 80,
  enableLiveAutocomplete: true,
  showGutter: true,
  enableSmartIndent: true,
  showInvisiblesChar: false,
  enableAnimateScrolling: true,
  highlightGutterLine: true
};

function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onResetSettings,
  onSaveSettings,
  currentMode,
  className = ''
}: SettingsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));
  const [hasChanges, setHasChanges] = useState(false);
  const [tempSettings, setTempSettings] = useState<EditorSettings>(settings);

  React.useEffect(() => {
    setTempSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const updateSetting = useCallback((key: keyof EditorSettings, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const applySettings = useCallback(() => {
    onSettingsChange(tempSettings);
    setHasChanges(false);
  }, [tempSettings, onSettingsChange]);

  const resetSettings = useCallback(() => {
    setTempSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  }, []);

  const handleSaveAndClose = useCallback(() => {
    applySettings();
    onSaveSettings?.();
    onClose();
  }, [applySettings, onSaveSettings, onClose]);

  const getSettingControl = (setting: SettingItem) => {
    const value = tempSettings[setting.key];

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => updateSetting(setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={value as number}
              onChange={(e) => updateSetting(setting.key, parseInt(e.target.value))}
              min={setting.min}
              max={setting.max}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {setting.unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{setting.unit}</span>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value as number}
              onChange={(e) => updateSetting(setting.key, parseFloat(e.target.value))}
              min={setting.min}
              max={setting.max}
              step={setting.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{setting.min}{setting.unit || ''}</span>
              <span className="font-medium">{value}{setting.unit || ''}</span>
              <span>{setting.max}{setting.unit || ''}</span>
            </div>
          </div>
        );

      case 'color':
        return (
          <input
            type="color"
            value={value as string}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
          />
        );

      default:
        return null;
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor Settings</h2>
            {hasChanges && (
              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categories</h3>
            <nav className="space-y-1">
              {SETTING_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {SETTING_SECTIONS.map(section => (
                <div key={section.id} className={expandedSections.has(section.id) ? '' : 'hidden'}>
                  <div className="flex items-center space-x-2 mb-3">
                    {section.icon}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{section.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>

                  <div className="space-y-4">
                    {section.settings.map(setting => (
                      <div key={setting.key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.label}
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          </div>
                          {setting.key === 'theme' && (
                            <div className="ml-2">
                              {getThemeIcon(tempSettings[setting.key] as string)}
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          {getSettingControl(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={resetSettings}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset to Defaults
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={!hasChanges}
              className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-1" />
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsPanel, DEFAULT_SETTINGS };
export type { EditorSettings, SettingSection, SettingItem };