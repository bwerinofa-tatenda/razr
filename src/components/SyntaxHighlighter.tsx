import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';
import 'highlight.js/styles/github.css'; // Default theme
import { Copy, Check } from 'lucide-react';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  theme?: 'github' | 'atom-one-dark' | 'monokai' | 'vs2015';
  editable?: boolean;
  onChange?: (code: string) => void;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust',
  'html', 'css', 'json', 'yaml', 'xml', 'markdown', 'sql', 'bash', 'powershell'
];

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('powershell', powershell);

const THEMES = {
  github: 'github.css',
  'atom-one-dark': 'atom-one-dark.css',
  monokai: 'monokai.css',
  vs2015: 'vs2015.css'
};

export default function SyntaxHighlighter({
  code,
  language = 'javascript',
  showLineNumbers = true,
  theme = 'github',
  editable = false,
  onChange,
  className = ''
}: SyntaxHighlighterProps) {
  const codeRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editCode, setEditCode] = React.useState(code);

  useEffect(() => {
    if (codeRef.current && !editable) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language, theme, editable]);

  useEffect(() => {
    // Import theme CSS dynamically
    const themeModule = THEMES[theme];
    if (themeModule) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/${themeModule}`;
      
      // Remove old theme link
      const oldLink = document.querySelector('link[data-theme="hljs"]');
      if (oldLink) {
        oldLink.remove();
      }
      
      link.setAttribute('data-theme', 'hljs');
      document.head.appendChild(link);
    }
  }, [theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveEdit = () => {
    onChange?.(editCode);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditCode(code);
    setIsEditing(false);
  };

  const detectLanguage = (text: string): string => {
    // Simple language detection based on patterns
    if (text.includes('def ') && text.includes(':')) return 'python';
    if (text.includes('function') && text.includes('(')) return 'javascript';
    if (text.includes('import') && text.includes('from')) return 'python';
    if (text.includes('<') && text.includes('>')) return 'html';
    if (text.includes('{') && text.includes('}')) return 'json';
    if (text.includes('SELECT') && text.includes('FROM')) return 'sql';
    
    return 'plaintext';
  };

  const renderCode = () => {
    const detectedLang = SUPPORTED_LANGUAGES.includes(language) ? language : detectLanguage(code);
    
    if (editable) {
      if (isEditing) {
        return (
          <div className="relative">
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className="w-full h-full min-h-[200px] p-4 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your code here..."
              autoFocus
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <pre className="relative">
            <code
              ref={codeRef}
              className={`language-${detectedLang} ${className}`}
              data-language={detectedLang}
            >
              {code}
            </code>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </pre>
        );
      }
    } else {
      return (
        <pre className="relative group">
          <code
            ref={codeRef}
            className={`language-${detectedLang} ${className}`}
            data-language={detectedLang}
            data-line-numbers={showLineNumbers}
          >
            {code}
          </code>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </pre>
      );
    }
  };

  return (
    <div className={`syntax-highlighter ${editable ? 'editable' : ''} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {SUPPORTED_LANGUAGES.includes(language) ? language.toUpperCase() : 'AUTO'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {detectLanguage(code)}
          </span>
        </div>
        {!editable && (
          <div className="flex items-center space-x-2">
            <select
              value={theme}
              onChange={(e) => {/* Theme change handler */}
              }
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="github">GitHub</option>
              <option value="atom-one-dark">Atom Dark</option>
              <option value="monokai">Monokai</option>
              <option value="vs2015">VS 2015</option>
            </select>
          </div>
        )}
      </div>
      {renderCode()}
    </div>
  );
}

// Utility function to extract code blocks from rich text
export const extractCodeBlocks = (html: string) => {
  const codeBlocks: Array<{ code: string; language: string; index: number }> = [];
  const regex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  let match;
  let index = 0;
  
  while ((match = regex.exec(html)) !== null) {
    codeBlocks.push({
      language: match[1],
      code: match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
      index
    });
    index++;
  }
  
  return codeBlocks;
};

// Utility function to highlight code blocks in HTML
export const highlightCodeBlocks = (html: string) => {
  return html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (match, language, code) => {
    const highlightedCode = hljs.highlight(code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), {
      language: SUPPORTED_LANGUAGES.includes(language) ? language : 'plaintext'
    }).value;
    
    return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;
  });
};
