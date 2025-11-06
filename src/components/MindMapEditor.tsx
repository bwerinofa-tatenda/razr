import React, { useState } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  LayoutGrid,
  FileText,
  FolderOpen,
  Brain,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { EditorSettings } from './SettingsPanel';

interface MindMapEditorProps {
  value?: string;
  onChange: (mindMapData: string) => void;
  className?: string;
  readonly?: boolean;
  settings?: EditorSettings;
}

interface MindNode {
  id: string;
  topic: string;
  children: MindNode[];
  parent?: string;
  x?: number;
  y?: number;
}

const MIND_MAP_TEMPLATES = {
  blank: {
    topic: 'Central Topic',
    children: []
  },
  project: {
    topic: 'Project Plan',
    children: [
      {
        topic: 'Planning',
        children: [
          { topic: 'Requirements', children: [] },
          { topic: 'Timeline', children: [] },
          { topic: 'Resources', children: [] }
        ]
      },
      {
        topic: 'Design',
        children: [
          { topic: 'UI/UX', children: [] },
          { topic: 'Architecture', children: [] },
          { topic: 'Database', children: [] }
        ]
      },
      {
        topic: 'Development',
        children: [
          { topic: 'Frontend', children: [] },
          { topic: 'Backend', children: [] },
          { topic: 'Testing', children: [] }
        ]
      }
    ]
  }
};

export default function MindMapEditor({
  value,
  onChange,
  className = '',
  readonly = false
}: MindMapEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('project');
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const currentData = value ? JSON.parse(value) : MIND_MAP_TEMPLATES[selectedTemplate as keyof typeof MIND_MAP_TEMPLATES];

  const handleExport = () => {
    const data = currentData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          onChange(content);
        } catch (error) {
          console.error('Invalid mind map file:', error);
          alert('Invalid mind map file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    if (!readonly) {
      const data = MIND_MAP_TEMPLATES[template as keyof typeof MIND_MAP_TEMPLATES];
      onChange(JSON.stringify(data));
    }
  };

  const handleReset = () => {
    if (!readonly) {
      const data = MIND_MAP_TEMPLATES[selectedTemplate as keyof typeof MIND_MAP_TEMPLATES];
      onChange(JSON.stringify(data));
    }
  };

  const startEditing = (nodeId: string, currentText: string) => {
    if (readonly) return;
    setEditingNode(nodeId);
    setEditText(currentText);
  };

  const saveEdit = (nodeId: string) => {
    if (readonly || !editText.trim()) return;
    
    // Simple implementation - this would need proper tree traversal in a real app
    console.log('Save edit for node:', nodeId, 'with text:', editText);
    setEditingNode(null);
    setEditText('');
    
    // In a real implementation, you'd update the tree structure here
    // For now, we'll just trigger a re-render
    onChange(JSON.stringify(currentData));
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditText('');
  };

  const renderNode = (node: any, level: number = 0, index: number = 0) => {
    const nodeId = `${level}-${index}`;
    const isEditing = editingNode === nodeId;

    return (
      <div
        key={nodeId}
        className={`
          ${level === 0 ? 'text-center' : 'ml-4'}
          ${level > 0 ? 'border-l-2 border-gray-300 dark:border-gray-600 pl-4' : ''}
          my-2
        `}
      >
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') saveEdit(nodeId);
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={() => saveEdit(nodeId)}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
            />
            <button
              onClick={() => saveEdit(nodeId)}
              className="p-1 text-green-600 hover:text-green-800"
            >
              ✓
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 group">
            <div
              className={`
                ${level === 0 
                  ? 'text-lg font-bold bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg' 
                  : 'text-base bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md'
                }
                ${!readonly ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
              `}
              onClick={() => !readonly && startEditing(nodeId, node.topic)}
            >
              {node.topic}
            </div>
            
            {!readonly && (
              <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                <button
                  onClick={() => startEditing(nodeId, node.topic)}
                  className="p-1 text-gray-500 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  className="p-1 text-gray-500 hover:text-green-600"
                  title="Add child"
                >
                  <Plus className="w-3 h-3" />
                </button>
                {level > 0 && (
                  <button
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child: any, childIndex: number) => 
              renderNode(child, level + 1, childIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-white">Mind Map Editor</span>
          
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={readonly}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ml-4"
          >
            <option value="project">Project Plan</option>
            <option value="blank">Blank</option>
          </select>
          
          {!readonly && (
            <>
              <button
                onClick={handleReset}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reset to template"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <label className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Export as JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {readonly ? 'Read Only' : 'Editable'}
        </div>
      </div>

      {/* Mind Map Content */}
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {renderNode(currentData)}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p className="mb-1">
            <strong>Instructions:</strong> 
            {!readonly ? (
              <> Click on text to edit, use the + button to add child nodes</>
            ) : (
              <> Mind map is in read-only mode</>
            )}
          </p>
          <p className="flex items-center space-x-4">
            <span>• Click text to edit nodes</span>
            <span>• Templates available for quick start</span>
            <span>• Export/Import mind map data</span>
          </p>
        </div>
      </div>
    </div>
  );
}
