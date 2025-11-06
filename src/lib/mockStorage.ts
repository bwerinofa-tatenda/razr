// Local Storage Management for Mock Data Mode
const STORAGE_PREFIX = 'tradejournal_mock_';

// Calculate System Quality Number from the 5 scoring fields
export function calculateSystemQualityNumber(
  analysis: number,
  execution: number,
  tradeManagement: number,
  riskManagement: number,
  mindset: number
): number {
  const scores = [analysis, execution, tradeManagement, riskManagement, mindset];
  const validScores = scores.filter(score => typeof score === 'number' && score >= 1 && score <= 5);
  
  if (validScores.length === 0) return 3; // Default to 3 if no valid scores
  
  const sum = validScores.reduce((total, score) => total + score, 0);
  return Math.round((sum / validScores.length) * 10) / 10; // Round to 1 decimal place
}

export interface MockAccount {
  id: string;
  user_id: string;
  name: string;
  account_number: string;
  encrypted_investor_password: string;
  is_connected: boolean;
  last_sync: string | null;
  sync_status: 'success' | 'syncing' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
}

export interface MockTrade {
  id: string;
  asset: string;
  asset_type: 'FX' | 'Futures' | 'Metals' | 'Commodities';
  trade_type: string;
  size: number;
  session: 'Asia' | 'London 1' | 'London 2' | 'London 3' | 'New York 1' | 'New York 2' | 'New York 3';
  duration: string;
  outcome: 'win' | 'loss' | 'break_even';
  entry_tag: string;
  emotion: string;
  what_liked: string;
  what_didnt_like: string;
  comment: string;
  pnl: number;
  time: string;
  system_quality_number: number;
  // New scoring fields
  analysis: number;
  execution: number;
  trade_management: number;
  risk_management: number;
  mindset: number;
  // Optional fields for mock mode
  user_id?: string;
  account_number?: string;
  position_id?: string;
  entry_price?: number;
  exit_price?: number;
  created_at?: string;
}

export interface MockStrategy {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description?: string;
  created_at: string;
}

export interface MockNote {
  id: string;
  text: string;
  title?: string;
  category?: string;
  tab?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  user_id?: string;
  strategy_id?: string;
  // Rich content support
  content_type: 'plain-text' | 'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math';
  content_data?: {
    // For rich text (HTML)
    html_content?: string;
    // For code
    code_language?: string;
    code_content?: string;
    // For syntax-highlight
    highlighted_code?: string;
    // For mind maps
    mindmap_data?: MindMapNode[];
    // For mermaid diagrams
    mermaid_code?: string;
    // For math
    latex_content?: string;
  };
  // Version control
  versions?: NoteVersion[];
  current_version?: string;
  // Metadata
  metadata?: {
    word_count?: number;
    char_count?: number;
    tags?: string[];
    last_edited_by?: string;
    last_accessed?: string;
    last_migrated?: string;
    migration_type?: string;
    favorite?: boolean;
    pinned?: boolean;
    folderId?: string;
  };
}

export interface MindMapNode {
  id: string;
  topic: string;
  children: MindMapNode[];
  parent?: string;
  x?: number;
  y?: number;
  color?: string;
  style?: string;
}

export interface NoteVersion {
  id: string;
  content: string;
  content_data?: any;
  created_at: string;
  created_by?: string;
  version_number: number;
  change_summary?: string;
  // Diff data for tracking changes
  diff_data?: {
    added?: number;
    removed?: number;
    modified?: number;
  };
}

export interface MockChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  user_id: string;
  created_at: string;
  metadata?: {
    usedNotes?: any[];
    hasKnowledgeBase?: boolean;
    mode?: 'coach' | 'pre_session' | 'post_session' | 'psychology' | 'orderflow';
  };
}

export interface MockDataStore {
  accounts: MockAccount[];
  trades: MockTrade[];
  strategies: MockStrategy[];
  notes: MockNote[];
  chatMessages: MockChatMessage[];
  initialized: boolean;
  lastUpdate: string;
}

// Storage utility functions
export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  clearAll(): void {
    this.clear();
  }
};

// Simulate network delay for realistic UX
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
export const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Content formatting and validation utilities
export const contentValidators = {
  isValidCodeContent: (content: string): boolean => {
    return typeof content === 'string' && content.length > 0;
  },

  isValidMindMapData: (data: any): boolean => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return parsed && typeof parsed === 'object' && parsed.topic && Array.isArray(parsed.children);
    } catch {
      return false;
    }
  },

  isValidMermaidContent: (content: string): boolean => {
    try {
      // Basic validation - mermaid code should start with valid keywords
      const validStarters = ['graph', 'flowchart', 'sequenceDiagram', 'gantt', 'stateDiagram', 'journey', 'classDiagram', 'erDiagram'];
      const trimmed = content.trim();
      return validStarters.some(starter => trimmed.startsWith(starter));
    } catch {
      return false;
    }
  },

  isValidLatexContent: (content: string): boolean => {
    try {
      // Basic LaTeX validation - should contain math delimiters or commands
      return content.includes('$') || content.includes('\\') || content.includes('{') || content.includes('}');
    } catch {
      return false;
    }
  },

  detectContentType: (content: string): MockNote['content_type'] => {
    if (contentValidators.isValidMindMapData(content)) return 'mind-map';
    if (contentValidators.isValidMermaidContent(content)) return 'mermaid';
    if (contentValidators.isValidLatexContent(content)) return 'math';
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1')) return 'rich-text';
    if (content.includes('```')) return 'syntax-highlight';
    return 'plain-text';
  }
};

// Rich content data management
export const contentManager = {
  // Create content data based on type
  createContentData: (type: MockNote['content_type'], content: string, language?: string): any => {
    const baseData: any = {
      metadata: {
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      }
    };

    switch (type) {
      case 'rich-text':
        return {
          ...baseData,
          html_content: content,
          format: 'ckeditor'
        };

      case 'code':
        return {
          ...baseData,
          code_content: content,
          code_language: language || 'javascript',
          editor_settings: {
            theme: 'one-dark',
            lineNumbers: true,
            wordWrap: true
          }
        };

      case 'syntax-highlight':
        return {
          ...baseData,
          highlighted_code: content,
          language: language || 'javascript',
          theme: 'github'
        };

      case 'mind-map':
        try {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          return {
            ...baseData,
            mindmap_data: parsed,
            format: 'custom',
            node_count: contentManager.countMindMapNodes(parsed)
          };
        } catch {
          return {
            ...baseData,
            mindmap_data: { topic: 'Empty Mind Map', children: [] },
            format: 'custom'
          };
        }

      case 'mermaid':
        return {
          ...baseData,
          mermaid_code: content,
          format: 'mermaid',
          render_status: 'pending'
        };

      case 'math':
        return {
          ...baseData,
          latex_content: content,
          format: 'katex',
          math_type: 'mixed'
        };

      default:
        return {
          ...baseData,
          text_content: content
        };
    }
  },

  // Extract plain text from rich content
  extractPlainText: (note: MockNote): string => {
    if (note.content_type === 'plain-text' || !note.content_data) {
      return note.text || '';
    }

    switch (note.content_type) {
      case 'rich-text':
        // Strip HTML tags to get plain text
        return note.content_data.html_content?.replace(/<[^>]*>/g, '') || '';
      
      case 'code':
        return note.content_data.code_content || '';
      
      case 'mind-map':
        return contentManager.mindMapToPlainText(note.content_data.mindmap_data);
      
      case 'mermaid':
        return note.content_data.mermaid_code || '';
      
      case 'math':
        return note.content_data.latex_content || '';
      
      default:
        return note.text || '';
    }
  },

  // Convert mind map to plain text
  mindMapToPlainText: (mindmap: any): string => {
    if (!mindmap) return '';
    
    const formatNode = (node: any, level: number = 0): string => {
      const indent = '  '.repeat(level);
      const text = `${indent}${node.topic}`;
      const children = node.children || [];
      const childrenText = children.map((child: any) => formatNode(child, level + 1)).join('\n');
      return childrenText ? `${text}\n${childrenText}` : text;
    };

    return formatNode(mindmap);
  },

  // Count nodes in mind map
  countMindMapNodes: (mindmap: any): number => {
    if (!mindmap) return 0;
    
    let count = 1;
    if (mindmap.children) {
      count += mindmap.children.reduce((sum: number, child: any) => {
        return sum + contentManager.countMindMapNodes(child);
      }, 0);
    }
    return count;
  },

  // Update metadata
  updateMetadata: (note: MockNote): MockNote => {
    const plainText = contentManager.extractPlainText(note);
    const metadata = {
      word_count: plainText.split(/\s+/).filter(word => word.length > 0).length,
      char_count: plainText.length,
      last_accessed: new Date().toISOString()
    };

    return {
      ...note,
      metadata: {
        ...note.metadata,
        ...metadata
      }
    };
  }
};

// Version control functionality
export const versionManager = {
  // Create a new version of a note
  createVersion: (note: MockNote, changeSummary?: string): NoteVersion => {
    const versionId = generateId();
    const currentVersion = note.versions?.length || 0;
    
    return {
      id: versionId,
      content: note.text,
      content_data: note.content_data,
      created_at: new Date().toISOString(),
      version_number: currentVersion + 1,
      change_summary: changeSummary,
      diff_data: versionManager.calculateDiff(note, versionId)
    };
  },

  // Calculate diff between versions
  calculateDiff: (note: MockNote, newVersionId: string) => {
    const oldVersion = note.versions?.[note.versions.length - 1];
    if (!oldVersion) return { added: 0, removed: 0, modified: 0 };

    // Simple diff calculation - in a real app, you'd use a proper diff library
    const oldText = versionManager.getVersionContent(oldVersion, note.content_type);
    const newText = versionManager.getVersionContent(note, note.content_type);
    
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    return {
      added: Math.max(0, newLines.length - oldLines.length),
      removed: Math.max(0, oldLines.length - newLines.length),
      modified: Math.min(oldLines.length, newLines.length)
    };
  },

  // Get content from version
  getVersionContent: (version: NoteVersion | MockNote, contentType: MockNote['content_type']): string => {
    if ('content_data' in version && version.content_data) {
      switch (contentType) {
        case 'rich-text':
          return version.content_data.html_content || (version as any).text || '';
        case 'code':
          return version.content_data.code_content || (version as any).text || '';
        case 'mind-map':
          return JSON.stringify(version.content_data.mindmap_data || {});
        case 'mermaid':
          return version.content_data.mermaid_code || (version as any).text || '';
        case 'math':
          return version.content_data.latex_content || (version as any).text || '';
        default:
          return (version as any).text || '';
      }
    }
    return (version as any).text || '';
  },

  // Restore a version
  restoreVersion: (note: MockNote, version: NoteVersion): MockNote => {
    const restoredNote: MockNote = {
      ...note,
      text: version.content,
      content_data: version.content_data,
      current_version: version.id,
      updated_at: new Date().toISOString()
    };

    // Add the restoration as a new version
    const restoreVersion = versionManager.createVersion(restoredNote, `Restored to version ${version.version_number}`);
    
    return {
      ...restoredNote,
      versions: [...(note.versions || []), restoreVersion]
    };
  },

  // Export methods
  exportAsMarkdown: (note: MockNote): string => {
    const title = `# ${note.title || 'Untitled Note'}\n\n`;
    const meta = `**Category:** ${note.category || 'Uncategorized'}  \n**Created:** ${new Date(note.created_at).toLocaleDateString()}  \n**Content Type:** ${note.content_type}  \n\n`;
    const content = contentManager.extractPlainText(note);
    
    return `${title}${meta}${content}`;
  },

  exportAsHTML: (note: MockNote): string => {
    const title = `<h1>${note.title || 'Untitled Note'}</h1>`;
    const meta = `<p><strong>Category:</strong> ${note.category || 'Uncategorized'}  \n<strong>Created:</strong> ${new Date(note.created_at).toLocaleDateString()}  \n<strong>Content Type:</strong> ${note.content_type}  </p>`;
    const content = `<div>${note.text.replace(/\n/g, '<br>')}</div>`;
    
    return `${title}${meta}${content}`;
  }
};

// Migration utilities
export const migrationManager = {
  // Migrate plain text note to rich content
  migrateToRichContent: (note: MockNote, targetType: MockNote['content_type']): MockNote => {
    if (note.content_type === targetType) return note;

    const contentData = contentManager.createContentData(targetType, note.text);
    const migratedNote: MockNote = {
      ...note,
      content_type: targetType,
      content_data: contentData,
      text: contentManager.extractPlainText({ ...note, content_data: contentData }),
      updated_at: new Date().toISOString()
    };

    // Create a migration version
    const migrationVersion = versionManager.createVersion(migratedNote, `Migrated from ${note.content_type} to ${targetType}`);
    
    return {
      ...migratedNote,
      versions: [...(note.versions || []), migrationVersion]
    };
  },

  // Auto-detect and migrate content type
  autoMigrate: (note: MockNote): MockNote => {
    const detectedType = contentValidators.detectContentType(note.text);
    
    if (detectedType !== note.content_type) {
      return migrationManager.migrateToRichContent(note, detectedType);
    }
    
    return note;
  }
};

// Backup and export functionality
export const backupManager = {
  // Create full backup
  createBackup: (userId: string): string => {
    const backup = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      version: '1.0',
      data: {
        notes: storage.get<MockNote[]>(`notes_${userId}`) || [],
        strategies: storage.get<MockStrategy[]>(`strategies_${userId}`) || [],
        trades: storage.get<MockTrade[]>(`trades_${userId}`) || []
      },
      metadata: {
        total_notes: storage.get<MockNote[]>(`notes_${userId}`)?.length || 0,
        total_strategies: storage.get<MockStrategy[]>(`strategies_${userId}`)?.length || 0,
        total_trades: storage.get<MockTrade[]>(`trades_${userId}`)?.length || 0
      }
    };

    return JSON.stringify(backup, null, 2);
  },

  // Export notes to various formats
  exportNote: (note: MockNote, format: 'json' | 'markdown' | 'html' | 'txt'): string => {
    switch (format) {
      case 'json':
        return JSON.stringify(note, null, 2);
      
      case 'markdown':
        return (contentManager as any).exportAsMarkdown(note);
      
      case 'html':
        return (contentManager as any).exportAsHTML(note);
      
      case 'txt':
        return contentManager.extractPlainText(note);
      
      default:
        return JSON.stringify(note, null, 2);
    }
  },

  // Export multiple notes
  exportNotes: (notes: MockNote[], format: 'json' | 'markdown' | 'html' | 'txt'): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          export_date: timestamp,
          notes: notes,
          total_count: notes.length
        }, null, 2);
      
      case 'markdown':
        return notes.map(note => (contentManager as any).exportAsMarkdown(note)).join('\n\n---\n\n');
      
      case 'html':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Notes Export - ${timestamp}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .note { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
              .note-title { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; }
              .note-meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
              .note-content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>Notes Export - ${timestamp}</h1>
            ${notes.map(note => (contentManager as any).exportAsHTML(note)).join('')}
          </body>
          </html>
        `;
      
      case 'txt':
        return notes.map(note => {
          const title = note.title || 'Untitled Note';
          const content = contentManager.extractPlainText(note);
          const meta = `Created: ${note.created_at}\nCategory: ${note.category || 'Uncategorized'}\n\n`;
          return `${title}\n${'='.repeat(title.length)}\n${meta}${content}`;
        }).join('\n\n');
      
      default:
        return JSON.stringify(notes, null, 2);
    }
  },

  // Import notes from backup
  importBackup: (backupData: string, userId: string): { success: boolean; notes: number; errors: string[] } => {
    try {
      const backup = JSON.parse(backupData);
      const errors: string[] = [];
      let importedCount = 0;

      if (backup.data && Array.isArray(backup.data.notes)) {
        const existingNotes = storage.get<MockNote[]>(`notes_${userId}`) || [];
        
        backup.data.notes.forEach((noteData: any) => {
          try {
            // Validate and normalize the imported note
            const normalizedNote = migrationManager.autoMigrate(noteData as MockNote);
            existingNotes.push(normalizedNote);
            importedCount++;
          } catch (error) {
            errors.push(`Failed to import note ${noteData.id}: ${error}`);
          }
        });

        storage.set(`notes_${userId}`, existingNotes);
      }

      return {
        success: errors.length === 0,
        notes: importedCount,
        errors
      };
    } catch (error) {
      return {
        success: false,
        notes: 0,
        errors: [`Invalid backup format: ${error}`]
      };
    }
  }
};

// Enhanced content export functions
const contentManager_exportAsMarkdown = (contentManager as any).exportAsMarkdown || ((note: MockNote) => {
  const title = `# ${note.title || 'Untitled Note'}\n\n`;
  const meta = `**Category:** ${note.category || 'Uncategorized'}  \n**Created:** ${new Date(note.created_at).toLocaleDateString()}  \n**Content Type:** ${note.content_type}  \n\n`;
  const content = contentManager.extractPlainText(note);
  
  return `${title}${meta}${content}`;
});

// Override with proper implementation
(contentManager as any).exportAsMarkdown = function(note: MockNote): string {
  const title = `# ${note.title || 'Untitled Note'}\n\n`;
  const meta = `**Category:** ${note.category || 'Uncategorized'}  \n**Created:** ${new Date(note.created_at).toLocaleDateString()}  \n**Content Type:** ${note.content_type}  \n\n`;
  const content = contentManager.extractPlainText(note);
  
  return `${title}${meta}${content}`;
};

(contentManager as any).exportAsHTML = function(note: MockNote): string {
  const title = note.title || 'Untitled Note';
  const content = note.content_type === 'rich-text' 
    ? note.content_data?.html_content || note.text
    : `<pre>${contentManager.extractPlainText(note)}</pre>`;
  
  return `
    <div class="note">
      <div class="note-title">${title}</div>
      <div class="note-meta">
        <strong>Category:</strong> ${note.category || 'Uncategorized'} | 
        <strong>Created:</strong> ${new Date(note.created_at).toLocaleDateString()} | 
        <strong>Type:</strong> ${note.content_type}
      </div>
      <div class="note-content">${content}</div>
    </div>
  `;
};

// Database operations for notes
export const notesDB = {
  // Save note with rich content support
  saveNote: (userId: string, note: MockNote): MockNote => {
    // Ensure note has proper structure
    const normalizedNote = {
      ...note,
      content_type: note.content_type || 'plain-text',
      content_data: note.content_data || contentManager.createContentData(note.content_type, note.text),
      versions: note.versions || [],
      current_version: note.current_version || generateId(),
      metadata: note.metadata || {}
    };

    // Update metadata
    const updatedNote = contentManager.updateMetadata(normalizedNote);

    // Create version if content has changed
    if (note.text !== updatedNote.text || JSON.stringify(note.content_data) !== JSON.stringify(updatedNote.content_data)) {
      const newVersion = versionManager.createVersion(updatedNote, 'Auto-save');
      updatedNote.versions = [...(note.versions || []), newVersion];
      updatedNote.current_version = newVersion.id;
    }

    // Save to storage
    const existingNotes = storage.get<MockNote[]>(`notes_${userId}`) || [];
    const noteIndex = existingNotes.findIndex(n => n.id === note.id);
    
    if (noteIndex >= 0) {
      existingNotes[noteIndex] = updatedNote;
    } else {
      existingNotes.push(updatedNote);
    }
    
    storage.set(`notes_${userId}`, existingNotes);
    return updatedNote;
  },

  // Load all notes for a user
  loadNotes: (userId: string): MockNote[] => {
    const notes = storage.get<MockNote[]>(`notes_${userId}`) || [];
    
    // Auto-migrate any notes that need upgrading
    return notes.map(note => migrationManager.autoMigrate(note));
  },

  // Delete note
  deleteNote: (userId: string, noteId: string): boolean => {
    const notes = storage.get<MockNote[]>(`notes_${userId}`) || [];
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex >= 0) {
      notes[noteIndex].deleted_at = new Date().toISOString();
      storage.set(`notes_${userId}`, notes);
      return true;
    }
    
    return false;
  },

  // Restore deleted note
  restoreNote: (userId: string, noteId: string): boolean => {
    const notes = storage.get<MockNote[]>(`notes_${userId}`) || [];
    const noteIndex = notes.findIndex(note => note.id === noteId && note.deleted_at);
    
    if (noteIndex >= 0) {
      notes[noteIndex].deleted_at = undefined;
      storage.set(`notes_${userId}`, notes);
      return true;
    }
    
    return false;
  },

  // Permanently delete note
  permanentlyDeleteNote: (userId: string, noteId: string): boolean => {
    const notes = storage.get<MockNote[]>(`notes_${userId}`) || [];
    const filteredNotes = notes.filter(note => note.id !== noteId);
    
    storage.set(`notes_${userId}`, filteredNotes);
    return filteredNotes.length < notes.length;
  }
};
