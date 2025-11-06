import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import mermaid from 'mermaid';
import * as katex from 'katex';
import 'katex/dist/katex.min.css';
import SyntaxHighlighter, { highlightCodeBlocks } from './SyntaxHighlighter';
import MindMapEditor from './MindMapEditor';
import EditorToolbar from './EditorToolbar';
import { SettingsPanel, DEFAULT_SETTINGS, type EditorSettings } from './SettingsPanel';
import { KeyboardShortcuts } from './KeyboardShortcuts';
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
  Brain
} from 'lucide-react';

// Configure CKEditor with proper license handling
const CKEDITOR_CONFIG = {
  licenseKey: 'GPL', // Use GPL license key for open source usage
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'outdent',
      'indent',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'mediaEmbed',
      '|',
      'undo',
      'redo'
    ]
  },
  image: {
    toolbar: [
      'imageStyle:alignLeft',
      'imageStyle:alignCenter',
      'imageStyle:alignRight',
      '|',
      'imageStyle:full',
      'imageStyle:side',
      '|',
      'imageResize:50',
      'imageResize:75',
      'imageResize:original'
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells'
    ]
  },
  mediaEmbed: {
    previewsInData: true
  }
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: 'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math';
  onModeChange: (mode: 'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math') => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  settings?: Partial<EditorSettings>;
  onSettingsChange?: (settings: EditorSettings) => void;
}

const MERMAID_TEMPLATES = {
  'flowchart': `graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]`,
  'sequence': `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great!`,
  'gantt': `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Section
    Task A           :a1, 2023-01-01, 30d
    Task B           :after a1  , 20d`,
  'state': `stateDiagram-v2
    [*] --> State1
    State1 --> State2 : event1
    State2 --> [*] : event2`
};

export default function RichTextEditor({
  value,
  onChange,
  mode,
  onModeChange,
  language = 'javascript',
  onLanguageChange,
  title,
  onTitleChange,
  isFullscreen = false,
  onToggleFullscreen,
  settings: propSettings,
  onSettingsChange
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>({
    ...DEFAULT_SETTINGS,
    ...propSettings
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editorRef = useRef<any>(null);
  const mermaidInitialized = useRef(false);

  // Initialize Mermaid once
  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
      });
      mermaidInitialized.current = true;
    }
  }, []);

  // Update word/char counts
  useEffect(() => {
    const text = value.replace(/<[^>]*>/g, ''); // Strip HTML tags
    setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(text.length);
  }, [value]);

  // Handle CKEditor change
  const handleCKEditorChange = useCallback((event: any, editor: any) => {
    const data = editor.getData();
    onChange(data);
    setCanUndo(editor.commands.undo.isEnabled);
    setCanRedo(editor.commands.redo.isEnabled);
  }, [onChange]);

  // Handle CodeMirror change
  const handleCodeMirrorChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  // Get language extensions for CodeMirror
  const getLanguageExtensions = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return [javascript()];
      case 'python':
        return [python()];
      case 'java':
        return [java()];
      case 'cpp':
        return [cpp()];
      case 'html':
        return [html()];
      case 'css':
        return [css()];
      case 'json':
        return [json()];
      case 'yaml':
        return [yaml()];
      default:
        return [javascript()];
    }
  };

  // Render Mermaid diagram
  const renderMermaid = useCallback(async () => {
    if (!value.trim()) {
      setMermaidSvg('');
      return;
    }

    try {
      const { svg } = await mermaid.render('mermaid-diagram', value);
      setMermaidSvg(svg);
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      setMermaidSvg('<div class="text-red-500">Failed to render diagram</div>');
    }
  }, [value]);

  useEffect(() => {
    if (mode === 'mermaid') {
      renderMermaid();
    }
  }, [mode, value, renderMermaid]);

  // Export functions
  const exportAsMarkdown = useCallback(() => {
    const markdown = value
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [value, title]);

  const exportAsHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Document'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  ${value}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [value, title]);

  // Handle settings change
  const handleSettingsChange = (newSettings: EditorSettings) => {
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // Render editor based on mode
  const renderEditor = () => {
    switch (mode) {
      case 'rich-text':
        return (
          <div className="h-full">
            {React.createElement(CKEditor as any, {
              ref: editorRef,
              editor: ClassicEditor,
              data: value,
              onChange: handleCKEditorChange,
              config: CKEDITOR_CONFIG,
              disabled: isPreview,
              style: { height: '100%' }
            })}
          </div>
        );

      case 'code':
      case 'syntax-highlight':
        return (
          <div className="h-full">
            <CodeMirror
              value={value}
              onChange={handleCodeMirrorChange}
              theme={settings.darkMode ? oneDark : undefined}
              extensions={getLanguageExtensions(language)}
              basicSetup={{
                lineNumbers: settings.showLineNumbers,
                foldGutter: settings.showCodeFolding,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false,
                searchKeymap: true,
              }}
              style={{ height: '100%' }}
              placeholder={settings.placeholder || 'Start typing your code...'}
            />
          </div>
        );

      case 'mermaid':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto p-4">
              {value.trim() ? (
                <div 
                  className="mermaid"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                />
              ) : (
                <div className="text-gray-500 text-center mt-8">
                  Enter Mermaid diagram syntax to see the rendered diagram
                </div>
              )}
            </div>
            {isPreview && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-32 p-2 border border-gray-300 rounded resize-none dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Mermaid syntax..."
                />
              </div>
            )}
          </div>
        );

      case 'mind-map':
        return (
          <div className="h-full">
            <MindMapEditor
              value={value}
              onChange={onChange}
              settings={settings}
            />
          </div>
        );

      case 'math':
        return (
          <div className="h-full p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">LaTeX Input</label>
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-32 p-2 border border-gray-300 rounded resize-none dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter LaTeX math expressions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rendered Output</label>
                <div 
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded min-h-[100px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(value, { 
                      displayMode: true,
                      throwOnError: false 
                    })
                  }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full p-4">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full p-2 border border-gray-300 rounded resize-none dark:bg-gray-700 dark:border-gray-600"
              placeholder="Start typing..."
            />
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <EditorToolbar
            mode={mode}
            onModeChange={onModeChange}
            language={language}
            onLanguageChange={onLanguageChange}
            onPreview={() => setIsPreview(!isPreview)}
            onExportMarkdown={exportAsMarkdown}
            onExportHTML={exportAsHTML}
            isPreview={isPreview}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onTogglePreview={() => setIsPreview(!isPreview)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {wordCount} words, {charCount} chars
          </span>
          
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Keyboard Shortcuts"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>

      {/* Panels */}
      {showSettingsPanel && (
        <SettingsPanel
          isOpen={true}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettingsPanel(false)}
          onResetSettings={() => {}}
          onSaveSettings={() => {}}
          currentMode={mode}
        />
      )}

      {showKeyboardShortcuts && (
        <KeyboardShortcuts
          isOpen={true}
          onClose={() => setShowKeyboardShortcuts(false)}
        />
      )}
    </div>
  );
}