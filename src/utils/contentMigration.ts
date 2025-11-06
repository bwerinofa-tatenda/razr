// Content Migration Utilities for Rich Content Types
import type { MockNote } from '../lib/mockStorage';

// Migration strategies for different content types
export const migrationStrategies = {
  // Plain text to rich text (HTML)
  'plain-text': {
    to: {
      'rich-text': (content: string) => {
        // Convert plain text to basic HTML
        return content
          .split('\n\n')
          .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
          .join('');
      },
      'code': (content: string) => {
        // Detect if content looks like code
        const codeKeywords = ['function', 'const', 'let', 'var', 'class', 'import', 'export', 'def ', 'class ', 'def __init__'];
        const looksLikeCode = codeKeywords.some(keyword => content.includes(keyword));
        return looksLikeCode ? content : '';
      },
      'syntax-highlight': (content: string) => {
        // Convert fenced code blocks to syntax-highlight format
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        let result = content;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
          const [, language, code] = match;
          const codeBlock = `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
          result = result.replace(match[0], codeBlock);
        }
        
        return result !== content ? result : '';
      }
    }
  },

  // Existing HTML content
  'rich-text': {
    to: {
      'code': (content: string) => {
        // Strip HTML tags and keep only text content
        return content.replace(/<[^>]*>/g, '').trim();
      },
      'syntax-highlight': (content: string) => {
        // Extract code blocks from HTML
        const codeBlocks = content.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g);
        if (codeBlocks) {
          return codeBlocks.map(block => {
            const text = block.replace(/<\/?pre[^>]*>/g, '').replace(/<\/?code[^>]*>/g, '');
            return text.trim();
          }).join('\n\n');
        }
        return '';
      }
    }
  },

  // Code content
  'code': {
    to: {
      'syntax-highlight': (content: string) => {
        return content; // Already in code format
      },
      'rich-text': (content: string) => {
        return `<pre><code>${content}</code></pre>`;
      }
    }
  }
};

// Content detection utilities
export const contentDetectors = {
  // Detect if content contains HTML
  hasHTML: (content: string): boolean => {
    return /<[^>]+>/.test(content);
  },

  // Detect if content contains code
  hasCode: (content: string): boolean => {
    const codePatterns = [
      /\bfunction\s+\w+/,
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
      /\bclass\s+\w+/,
      /\bimport\s+/,
      /\bexport\s+/,
      /\bdef\s+\w+/,
      /\bpublic\s+\w+/,
      /\bprivate\s+\w+/,
      /\bint\s+\w+/,
      /\bstring\s+\w+/
    ];
    return codePatterns.some(pattern => pattern.test(content));
  },

  // Detect if content contains markdown-style code blocks
  hasMarkdownCodeBlocks: (content: string): boolean => {
    return /```[\w]*\n[\s\S]*?```/.test(content);
  },

  // Detect if content contains mind map structure
  hasMindMapStructure: (content: string): boolean => {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' && parsed.topic && Array.isArray(parsed.children);
    } catch {
      return false;
    }
  },

  // Detect if content contains mermaid diagram
  hasMermaidDiagram: (content: string): boolean => {
    const mermaidStarters = [
      'graph',
      'flowchart',
      'sequenceDiagram',
      'gantt',
      'stateDiagram',
      'journey',
      'classDiagram',
      'erDiagram'
    ];
    const trimmed = content.trim();
    return mermaidStarters.some(starter => trimmed.startsWith(starter));
  },

  // Detect if content contains LaTeX math
  hasLatexMath: (content: string): boolean => {
    return content.includes('$') || content.includes('\\(') || content.includes('\\[') || content.includes('$$');
  },

  // Auto-detect the best content type
  autoDetectType: (content: string): MockNote['content_type'] => {
    if (contentDetectors.hasMindMapStructure(content)) return 'mind-map';
    if (contentDetectors.hasMermaidDiagram(content)) return 'mermaid';
    if (contentDetectors.hasLatexMath(content)) return 'math';
    if (contentDetectors.hasHTML(content)) return 'rich-text';
    if (contentDetectors.hasMarkdownCodeBlocks(content)) return 'syntax-highlight';
    if (contentDetectors.hasCode(content)) return 'code';
    return 'plain-text';
  }
};

// Migration engine
export class ContentMigrationEngine {
  private notes: MockNote[];

  constructor(notes: MockNote[]) {
    this.notes = notes;
  }

  // Migrate all notes that need upgrading
  public migrateAll(): { migrated: number; errors: string[] } {
    let migrated = 0;
    const errors: string[] = [];

    this.notes.forEach(note => {
      try {
        const detectionResult = contentDetectors.autoDetectType(note.text);
        
        if (detectionResult !== note.content_type) {
          const migratedNote = this.migrateNote(note, detectionResult);
          if (migratedNote) {
            Object.assign(note, migratedNote);
            migrated++;
            console.log(`📝 Migrated note "${note.title}" from ${note.content_type} to ${detectionResult}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to migrate note "${note.title}": ${error}`);
        console.error(`Error migrating note ${note.id}:`, error);
      }
    });

    return { migrated, errors };
  }

  // Migrate a single note
  public migrateNote(note: MockNote, targetType: MockNote['content_type']): Partial<MockNote> | null {
    const sourceType = note.content_type || 'plain-text';
    
    // If types are the same, no migration needed
    if (sourceType === targetType) {
      return null;
    }

    const strategy = migrationStrategies[sourceType as keyof typeof migrationStrategies];
    const migrationFunction = strategy?.to?.[targetType];

    if (!migrationFunction) {
      console.warn(`No migration strategy from ${sourceType} to ${targetType}`);
      return null;
    }

    try {
      const migratedContent = migrationFunction(note.text);
      
      if (!migratedContent) {
        console.warn(`Migration from ${sourceType} to ${targetType} produced empty content`);
        return null;
      }

      // Create migration metadata
      const migrationVersion = {
        id: `migration_${Date.now()}`,
        content: note.text,
        created_at: new Date().toISOString(),
        version_number: (note.versions?.length || 0) + 1,
        change_summary: `Auto-migration from ${sourceType} to ${targetType}`
      };

      return {
        content_type: targetType,
        text: this.extractPlainText(migratedContent, targetType),
        versions: [...(note.versions || []), migrationVersion],
        updated_at: new Date().toISOString(),
        metadata: {
          ...note.metadata,
          last_migrated: new Date().toISOString(),
          migration_type: `${sourceType}->${targetType}`
        }
      };
    } catch (error) {
      console.error(`Migration error from ${sourceType} to ${targetType}:`, error);
      throw error;
    }
  }

  // Extract plain text from migrated content
  private extractPlainText(content: string, contentType: MockNote['content_type']): string {
    switch (contentType) {
      case 'rich-text':
        return content.replace(/<[^>]*>/g, '').trim();
      case 'syntax-highlight':
        return content.replace(/<[^>]*>/g, '').trim();
      case 'mind-map':
        try {
          const parsed = JSON.parse(content);
          return this.mindMapToPlainText(parsed);
        } catch {
          return content;
        }
      default:
        return content;
    }
  }

  // Convert mind map to plain text
  private mindMapToPlainText(mindmap: any): string {
    if (!mindmap) return '';
    
    const formatNode = (node: any, level: number = 0): string => {
      const indent = '  '.repeat(level);
      const text = `${indent}${node.topic}`;
      const children = node.children || [];
      const childrenText = children.map((child: any) => formatNode(child, level + 1)).join('\n');
      return childrenText ? `${text}\n${childrenText}` : text;
    };

    return formatNode(mindmap);
  }

  // Get migration statistics
  public getMigrationStats(): { 
    total: number; 
    byType: Record<string, number>;
    migrationCandidates: number;
  } {
    const byType: Record<string, number> = {};
    let migrationCandidates = 0;

    this.notes.forEach(note => {
      const currentType = note.content_type || 'plain-text';
      byType[currentType] = (byType[currentType] || 0) + 1;

      // Check if auto-detection would suggest a different type
      const detectedType = contentDetectors.autoDetectType(note.text);
      if (detectedType !== currentType && detectedType !== 'plain-text') {
        migrationCandidates++;
      }
    });

    return {
      total: this.notes.length,
      byType,
      migrationCandidates
    };
  }
}

// Batch migration utility
export const batchMigrateNotes = (notes: MockNote[]): {
  engine: ContentMigrationEngine;
  stats: ReturnType<ContentMigrationEngine['getMigrationStats']>;
  run: () => { migrated: number; errors: string[] };
} => {
  const engine = new ContentMigrationEngine(notes);
  const stats = engine.getMigrationStats();
  
  return {
    engine,
    stats,
    run: () => engine.migrateAll()
  };
};

// Quick migration functions for specific scenarios
export const quickMigrations = {
  // Migrate all notes to their optimal content types
  optimizeAllNotes: (notes: MockNote[]): MockNote[] => {
    const migratedNotes = [...notes];
    
    migratedNotes.forEach(note => {
      const optimalType = contentDetectors.autoDetectType(note.text);
      
      if (optimalType !== note.content_type && optimalType !== 'plain-text') {
        const migrationResult = batchMigrateNotes([note]);
        const migrated = migrationResult.run();
        
        if (migrated.migrated > 0) {
          Object.assign(note, migratedNotes.find(n => n.id === note.id));
        }
      }
    });
    
    return migratedNotes;
  },

  // Clean up and normalize note structure
  normalizeNoteStructure: (note: MockNote): MockNote => {
    return {
      ...note,
      content_type: note.content_type || 'plain-text',
      content_data: note.content_data || {},
      versions: note.versions || [],
      current_version: note.current_version || `version_${Date.now()}`,
      metadata: {
        word_count: 0,
        char_count: 0,
        favorite: false,
        pinned: false,
        ...note.metadata
      }
    };
  }
};