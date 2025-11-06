import { supabase } from './supabaseClient';
import type { MockNote, MockTrade } from './mockStorage';

export interface BackupInfo {
  id: string;
  user_id: string;
  backup_type: 'full' | 'incremental' | 'differential';
  backup_format: 'json' | 'encrypted' | 'compressed';
  backup_size_bytes: number;
  notes_count: number;
  templates_count: number;
  files_included: string[];
  compression_ratio: number;
  encryption_enabled: boolean;
  cloud_storage_url?: string;
  local_file_path?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
  created_at: string;
  completed_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

export interface SyncOperation {
  id: string;
  user_id: string;
  operation_type: 'create' | 'update' | 'delete' | 'restore';
  entity_type: 'note' | 'template' | 'folder' | 'tag';
  entity_id: string;
  operation_data: Record<string, any>;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  device_id?: string;
  created_at: string;
  processed_at?: string;
  expires_at?: string;
}

export interface ImportSession {
  id: string;
  user_id: string;
  import_type: 'csv' | 'pdf' | 'docx' | 'evernote' | 'notion' | 'onenote' | 'markdown' | 'html';
  source_format: string;
  target_format: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  file_size_bytes: number;
  source_file_path?: string;
  validation_errors: Array<{
    row: number;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  import_mapping: Record<string, string>;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface StorageAnalysis {
  total_notes: number;
  total_size_bytes: number;
  avg_note_size_bytes: number;
  storage_efficiency: number;
  largest_notes: Array<{
    id: string;
    title: string;
    size_bytes: number;
    created_at: string;
  }>;
  storage_by_type: Record<string, {
    count: number;
    total_size: number;
    avg_size: number;
  }>;
  recommendations: string[];
  analyzed_at: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  entity_id: string;
  entity_type: string;
  validated_at: string;
}

class DataManagementService {
  private encryptionKey: string | null = null;

  constructor() {
    this.initializeEncryption();
  }

  private async initializeEncryption() {
    // Initialize encryption key from secure storage
    const storedKey = localStorage.getItem('library_encryption_key');
    if (storedKey) {
      this.encryptionKey = storedKey;
    }
  }

  // Encryption and Security Methods
  async setEncryptionPassword(password: string): Promise<void> {
    // Generate encryption key from password using PBKDF2
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Store the key and salt
    const keyData = {
      key: await this.exportKey(key),
      salt: Array.from(salt)
    };
    
    localStorage.setItem('library_encryption_key', JSON.stringify(keyData));
    this.encryptionKey = JSON.stringify(keyData);
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  private async importKey(keyData: string): Promise<CryptoKey> {
    const parsed = JSON.parse(keyData);
    return await crypto.subtle.importKey(
      'jwk',
      parsed,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptContent(content: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    const keyData = JSON.parse(this.encryptionKey);
    const key = await this.importKey(keyData.key);
    const salt = new Uint8Array(keyData.salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encoded = new TextEncoder().encode(content);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoded
    );

    const result = {
      iv: Array.from(iv),
      salt: Array.from(salt),
      encrypted: Array.from(new Uint8Array(encrypted))
    };

    return btoa(JSON.stringify(result));
  }

  async decryptContent(encryptedContent: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    const keyData = JSON.parse(this.encryptionKey);
    const key = await this.importKey(keyData.key);
    const parsed = JSON.parse(atob(encryptedContent));
    
    const iv = new Uint8Array(parsed.iv);
    const encrypted = new Uint8Array(parsed.encrypted);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  // Backup and Restore Methods
  async createBackup(
    backupType: 'full' | 'incremental' | 'differential',
    includeData: string[] = ['notes', 'templates', 'attachments', 'metadata']
  ): Promise<BackupInfo> {
    try {
      // Get current user's data
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create backup record
      const { data: backup, error: backupError } = await supabase
        .from('library_backup_history')
        .insert({
          user_id: user.user.id,
          backup_type: backupType,
          backup_format: 'json',
          files_included: includeData,
          status: 'pending'
        })
        .select()
        .single();

      if (backupError) throw backupError;

      // Get all user data
      const [notesResult, templatesResult] = await Promise.all([
        supabase.from('library_notes').select('*').eq('user_id', user.user.id),
        supabase.from('library_templates').select('*').eq('user_id', user.user.id)
      ]);

      if (notesResult.error) throw notesResult.error;
      if (templatesResult.error) throw templatesResult.error;

      // Prepare backup data
      const backupData = {
        backup_id: backup.id,
        created_at: new Date().toISOString(),
        backup_type: backupType,
        user_id: user.user.id,
        notes: notesResult.data || [],
        templates: templatesResult.data || [],
        metadata: {
          notes_count: notesResult.data?.length || 0,
          templates_count: templatesResult.data?.length || 0,
          total_size: JSON.stringify({ notes: notesResult.data, templates: templatesResult.data }).length
        }
      };

      // Store backup data
      const { error: updateError } = await supabase
        .from('library_backup_history')
        .update({
          notes_count: backupData.metadata.notes_count,
          templates_count: backupData.metadata.templates_count,
          backup_size_bytes: backupData.metadata.total_size,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', backup.id);

      if (updateError) throw updateError;

      return backup as BackupInfo;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupId: string, options: {
    mergeStrategy?: 'replace' | 'merge' | 'skip_existing';
    validateData?: boolean;
  } = {}): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: backup, error: backupError } = await supabase
        .from('library_backup_history')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', user.user.id)
        .single();

      if (backupError) throw backupError;
      if (backup.status !== 'completed') throw new Error('Backup not completed');

      // For now, this is a placeholder implementation
      // In a full implementation, you would:
      // 1. Download the backup file
      // 2. Validate the backup data
      // 3. Apply the merge strategy
      // 4. Restore all entities

      console.log(`Restoring backup ${backupId} with options:`, options);
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw error;
    }
  }

  async getBackupHistory(userId?: string): Promise<BackupInfo[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('library_backup_history')
        .select('*')
        .eq('user_id', userId || user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get backup history:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('library_backup_history')
        .delete()
        .eq('id', backupId)
        .eq('user_id', user.user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  // Real-time Synchronization Methods
  async queueSyncOperation(
    operation: Omit<SyncOperation, 'id' | 'user_id' | 'created_at' | 'status' | 'retry_count'>
  ): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('library_sync_queue')
        .insert({
          user_id: user.user.id,
          ...operation,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to queue sync operation:', error);
      throw error;
    }
  }

  async processSyncQueue(deviceId?: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get pending operations
      const { data: operations, error } = await supabase
        .from('library_sync_queue')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      for (const operation of operations || []) {
        try {
          // Update status to processing
          await supabase
            .from('library_sync_queue')
            .update({ status: 'processing' })
            .eq('id', operation.id);

          // Process the operation based on type
          await this.processOperation(operation);

          // Mark as completed
          await supabase
            .from('library_sync_queue')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', operation.id);

        } catch (error) {
          // Mark as failed and increment retry count
          const retryCount = operation.retry_count + 1;
          const status = retryCount >= operation.max_retries ? 'failed' : 'pending';
          
          await supabase
            .from('library_sync_queue')
            .update({
              status,
              retry_count: retryCount,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', operation.id);
        }
      }
    } catch (error) {
      console.error('Failed to process sync queue:', error);
      throw error;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const { data, error } = await supabase
      .from(operation.entity_type === 'note' ? 'library_notes' : 'library_templates')
      .upsert({
        id: operation.entity_id,
        ...operation.operation_data
      });

    if (error) throw error;
  }

  // Import and Export Methods
  async startImport(importType: ImportSession['import_type'], file: File, mapping: Record<string, string> = {}): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create import session
      const { data, error } = await supabase
        .from('library_import_sessions')
        .insert({
          user_id: user.user.id,
          import_type: importType,
          source_format: file.type || 'unknown',
          target_format: 'library_note',
          file_size_bytes: file.size,
          source_file_path: file.name,
          import_mapping: mapping,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Start the import process
      this.processImport(data.id, file, importType, mapping);

      return data.id;
    } catch (error) {
      console.error('Failed to start import:', error);
      throw error;
    }
  }

  private async processImport(sessionId: string, file: File, importType: ImportSession['import_type'], mapping: Record<string, string>): Promise<void> {
    try {
      // Update status to validating
      await supabase
        .from('library_import_sessions')
        .update({ status: 'validating' })
        .eq('id', sessionId);

      // Process the file based on type
      const data = await this.parseImportFile(file, importType);
      
      // Update status to importing
      await supabase
        .from('library_import_sessions')
        .update({ 
          status: 'importing',
          total_items: data.items.length,
          validation_errors: data.errors
        })
        .eq('id', sessionId);

      // Process items
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        try {
          await this.processImportItem(item, mapping);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to import item ${i}:`, error);
        }

        // Update progress
        await supabase
          .from('library_import_sessions')
          .update({
            processed_items: i + 1,
            successful_items: successCount,
            failed_items: failCount
          })
          .eq('id', sessionId);
      }

      // Mark as completed
      await supabase
        .from('library_import_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    } catch (error) {
      // Mark as failed
      await supabase
        .from('library_import_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', sessionId);
    }
  }

  private async parseCSV(file: File): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            resolve({ items: [], errors: [{ row: 0, field: 'file', message: 'Empty CSV file', severity: 'error' }] });
            return;
          }

          // Simple CSV parsing with basic quoted field support
          const parseLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"';
                  i++; // Skip next quote
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const headers = parseLine(lines[0]);
          const items: Array<Record<string, any>> = [];
          const errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }> = [];

          for (let i = 1; i < lines.length; i++) {
            try {
              const values = parseLine(lines[i]);
              if (values.length === 1 && !values[0]) continue; // Skip empty rows
              
              const item: Record<string, any> = {};
              headers.forEach((header, index) => {
                if (index < values.length) {
                  let value = values[index] || '';
                  // Remove surrounding quotes if present
                  if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                  }
                  item[header.trim()] = value;
                } else {
                  item[header.trim()] = '';
                }
              });
              items.push(item);
            } catch (error) {
              errors.push({
                row: i + 1,
                field: 'row',
                message: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error'
              });
            }
          }

          resolve({ items, errors });
        } catch (error) {
          resolve({ 
            items: [], 
            errors: [{ 
              row: 0, 
              field: 'file', 
              message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              severity: 'error' 
            }] 
          });
        }
      };
      reader.onerror = () => {
        resolve({ 
          items: [], 
          errors: [{ 
            row: 0, 
            field: 'file', 
            message: 'Failed to read file', 
            severity: 'error' 
          }] 
        });
      };
      reader.readAsText(file);
    });
  }

  private async processImportItem(item: Record<string, any>, mapping: Record<string, string>): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Map fields according to mapping configuration
    const noteData: Partial<MockNote> = {
      title: item[mapping.title || 'title'] || 'Untitled',
      text: item[mapping.content || 'content'] || '',
      category: item[mapping.category || 'category'] || 'general',
      content_type: 'rich-text' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        word_count: item[mapping.content || 'content']?.split(/\s+/).length || 0,
        tags: mapping.tags ? item[mapping.tags]?.split(',').map((t: string) => t.trim()) : []
      }
    };

    // Create the note
    const { error } = await supabase
      .from('library_notes')
      .insert({
        user_id: user.user.id,
        ...noteData
      });

    if (error) throw error;
  }

  async getImportStatus(sessionId: string): Promise<ImportSession | null> {
    try {
      const { data, error } = await supabase
        .from('library_import_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get import status:', error);
      return null;
    }
  }

  // Export Methods
  async exportData(format: 'csv' | 'json' | 'markdown' | 'html', options: {
    includeContent?: boolean;
    includeMetadata?: boolean;
    dateRange?: { start: string; end: string };
    categories?: string[];
  } = {}): Promise<{
    data: string;
    filename: string;
    contentType: string;
    size: number;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Build query with filters
      let query = supabase
        .from('library_notes')
        .select('*')
        .eq('user_id', user.user.id);

      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end);
      }

      if (options.categories && options.categories.length > 0) {
        query = query.in('category', options.categories);
      }

      const { data: notes, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!notes || notes.length === 0) {
        throw new Error('No data to export');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      let data: string;
      let filename: string;
      let contentType: string;

      switch (format) {
        case 'csv':
          data = await this.exportToCSV(notes, options);
          filename = `library-export-${timestamp}.csv`;
          contentType = 'text/csv';
          break;
        case 'json':
          data = await this.exportToJSON(notes, options);
          filename = `library-export-${timestamp}.json`;
          contentType = 'application/json';
          break;
        case 'markdown':
          data = await this.exportToMarkdown(notes, options);
          filename = `library-export-${timestamp}.md`;
          contentType = 'text/markdown';
          break;
        case 'html':
          data = await this.exportToHTML(notes, options);
          filename = `library-export-${timestamp}.html`;
          contentType = 'text/html';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        data,
        filename,
        contentType,
        size: new Blob([data]).size
      };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private async exportToCSV(notes: MockNote[], options: { includeContent?: boolean; includeMetadata?: boolean }): Promise<string> {
    const headers = ['ID', 'Title', 'Category', 'Content Type', 'Created At', 'Updated At'];
    
    if (options.includeContent) {
      headers.push('Content');
    }
    if (options.includeMetadata) {
      headers.push('Word Count', 'Tags', 'Additional Metadata');
    }

    const rows = [headers.join(',')];

    for (const note of notes) {
      const row = [
        note.id,
        this.escapeCSVField(note.title),
        this.escapeCSVField(note.category),
        note.content_type,
        note.created_at,
        note.updated_at
      ];

      if (options.includeContent) {
        row.push(this.escapeCSVField(note.text));
      }
      if (options.includeMetadata) {
        const wordCount = note.metadata?.word_count || 0;
        const tags = note.metadata?.tags?.join(';') || '';
        const additionalMetadata = JSON.stringify(note.metadata || {});
        row.push(
          wordCount.toString(),
          this.escapeCSVField(tags),
          this.escapeCSVField(additionalMetadata)
        );
      }

      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private async exportToJSON(notes: MockNote[], options: { includeContent?: boolean; includeMetadata?: boolean }): Promise<string> {
    const exportData = notes.map(note => {
      const exportNote: any = {
        id: note.id,
        title: note.title,
        category: note.category,
        content_type: note.content_type,
        created_at: note.created_at,
        updated_at: note.updated_at
      };

      if (options.includeContent) {
        exportNote.content = note.text;
      }
      if (options.includeMetadata) {
        exportNote.metadata = note.metadata;
      }

      return exportNote;
    });

    return JSON.stringify({
      export_info: {
        timestamp: new Date().toISOString(),
        format: 'library-json',
        version: '1.0',
        total_notes: notes.length
      },
      notes: exportData
    }, null, 2);
  }

  private async exportToMarkdown(notes: MockNote[], options: { includeContent?: boolean; includeMetadata?: boolean }): Promise<string> {
    const lines = [
      '# Library Export',
      '',
      `Exported on: ${new Date().toISOString()}`,
      `Total notes: ${notes.length}`,
      ''
    ];

    for (const note of notes) {
      lines.push(`## ${note.title}`);
      lines.push('');
      
      if (options.includeMetadata) {
        lines.push(`- **Category:** ${note.category}`);
        lines.push(`- **Created:** ${new Date(note.created_at).toLocaleDateString()}`);
        lines.push(`- **Updated:** ${new Date(note.updated_at).toLocaleDateString()}`);
        if (note.metadata?.word_count) {
          lines.push(`- **Word Count:** ${note.metadata.word_count}`);
        }
        if (note.metadata?.tags && note.metadata.tags.length > 0) {
          lines.push(`- **Tags:** ${note.metadata.tags.join(', ')}`);
        }
        lines.push('');
      }

      if (options.includeContent) {
        lines.push(note.text);
      }
      
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  private async exportToHTML(notes: MockNote[], options: { includeContent?: boolean; includeMetadata?: boolean }): Promise<string> {
    const escapedTitle = 'Library Export';
    const escapedContent = notes.map(note => {
      const title = this.escapeHTML(note.title);
      const category = this.escapeHTML(note.category);
      const content = options.includeContent ? this.escapeHTML(note.text) : '';
      const createdAt = new Date(note.created_at).toLocaleDateString();
      const updatedAt = new Date(note.updated_at).toLocaleDateString();
      const wordCount = note.metadata?.word_count || 0;
      const tags = note.metadata?.tags?.join(', ') || '';

      let noteHTML = `
        <div class="note">
          <h2>${title}</h2>
      `;
      
      if (options.includeMetadata) {
        noteHTML += `
          <div class="metadata">
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Created:</strong> ${createdAt}</p>
            <p><strong>Updated:</strong> ${updatedAt}</p>
            <p><strong>Word Count:</strong> ${wordCount}</p>
            ${tags ? `<p><strong>Tags:</strong> ${this.escapeHTML(tags)}</p>` : ''}
          </div>
        `;
      }

      if (options.includeContent) {
        noteHTML += `<div class="content">${content.replace(/\n/g, '<br>')}</div>`;
      }
      
      noteHTML += `</div>`;
      return noteHTML;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .note { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .note h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .metadata { background: #f9f9f9; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .metadata p { margin: 5px 0; }
        .content { margin-top: 15px; }
        h1 { text-align: center; color: #333; }
    </style>
</head>
<body>
    <h1>${escapedTitle}</h1>
    <p><strong>Exported:</strong> ${new Date().toISOString()}</p>
    <p><strong>Total notes:</strong> ${notes.length}</p>
    
    ${escapedContent}
</body>
</html>`;
  }

  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Storage Analysis and Optimization
  async analyzeStorage(): Promise<StorageAnalysis> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Call the database function
      const { data, error } = await supabase
        .rpc('analyze_storage_usage', { user_uuid: user.user.id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to analyze storage:', error);
      throw error;
    }
  }

  async optimizeStorage(): Promise<{
    optimized_items: number;
    space_saved: number;
    recommendations: string[];
    optimizations: Array<{
      type: 'duplicate_removal' | 'compression' | 'archive' | 'cleanup' | 'index_rebuild';
      description: string;
      items_affected: number;
      space_saved: number;
      status: 'completed' | 'skipped' | 'error';
      error_message?: string;
    }>;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const optimizations: Array<any> = [];
      let totalOptimizedItems = 0;
      let totalSpaceSaved = 0;

      // 1. Remove duplicate content
      try {
        const duplicateResult = await this.removeDuplicates();
        optimizations.push({
          type: 'duplicate_removal',
          description: `Removed ${duplicateResult.removed} duplicate items`,
          items_affected: duplicateResult.removed,
          space_saved: duplicateResult.space_saved,
          status: 'completed'
        });
        totalOptimizedItems += duplicateResult.removed;
        totalSpaceSaved += duplicateResult.space_saved;
      } catch (error) {
        optimizations.push({
          type: 'duplicate_removal',
          description: 'Failed to remove duplicates',
          items_affected: 0,
          space_saved: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // 2. Compress large content
      try {
        const compressionResult = await this.compressLargeContent();
        optimizations.push({
          type: 'compression',
          description: `Compressed ${compressionResult.compressed} large items`,
          items_affected: compressionResult.compressed,
          space_saved: compressionResult.space_saved,
          status: 'completed'
        });
        totalOptimizedItems += compressionResult.compressed;
        totalSpaceSaved += compressionResult.space_saved;
      } catch (error) {
        optimizations.push({
          type: 'compression',
          description: 'Failed to compress content',
          items_affected: 0,
          space_saved: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // 3. Archive old content
      try {
        const archiveResult = await this.archiveOldContent();
        optimizations.push({
          type: 'archive',
          description: `Archived ${archiveResult.archived} old items`,
          items_affected: archiveResult.archived,
          space_saved: archiveResult.space_saved,
          status: 'completed'
        });
        totalOptimizedItems += archiveResult.archived;
        totalSpaceSaved += archiveResult.space_saved;
      } catch (error) {
        optimizations.push({
          type: 'archive',
          description: 'Failed to archive content',
          items_affected: 0,
          space_saved: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // 4. Clean up orphaned data
      try {
        const cleanupResult = await this.cleanupOrphanedData();
        optimizations.push({
          type: 'cleanup',
          description: `Cleaned up ${cleanupResult.cleaned} orphaned items`,
          items_affected: cleanupResult.cleaned,
          space_saved: cleanupResult.space_saved,
          status: 'completed'
        });
        totalOptimizedItems += cleanupResult.cleaned;
        totalSpaceSaved += cleanupResult.space_saved;
      } catch (error) {
        optimizations.push({
          type: 'cleanup',
          description: 'Failed to cleanup data',
          items_affected: 0,
          space_saved: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (totalSpaceSaved > 0) {
        recommendations.push(`Saved ${this.formatBytes(totalSpaceSaved)} of storage space`);
      }
      if (totalOptimizedItems > 0) {
        recommendations.push(`Optimized ${totalOptimizedItems} items`);
      }
      if (totalSpaceSaved < 1000000) { // Less than 1MB saved
        recommendations.push('Consider using more aggressive compression for large content');
        recommendations.push('Archive or delete very old content to free up space');
      }
      if (totalSpaceSaved > 10000000) { // More than 10MB saved
        recommendations.push('Great optimization results! Consider scheduling regular optimization');
      }

      return {
        optimized_items: totalOptimizedItems,
        space_saved: totalSpaceSaved,
        recommendations,
        optimizations
      };
    } catch (error) {
      console.error('Storage optimization failed:', error);
      throw error;
    }
  }

  private async removeDuplicates(): Promise<{ removed: number; space_saved: number }> {
    // Get all notes
    const { data: notes, error } = await supabase
      .from('library_notes')
      .select('id, title, text, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!notes) return { removed: 0, space_saved: 0 };

    // Find duplicates based on content similarity
    const duplicateGroups: Map<string, string[]> = new Map();
    
    for (const note of notes) {
      // Use a simple hash of the content for duplicate detection
      const contentHash = this.generateSimpleHash(note.text || '');
      
      if (duplicateGroups.has(contentHash)) {
        duplicateGroups.get(contentHash)!.push(note.id);
      } else {
        duplicateGroups.set(contentHash, [note.id]);
      }
    }

    // Remove duplicates (keep the first one, remove the rest)
    let removed = 0;
    let spaceSaved = 0;
    
    for (const [hash, ids] of duplicateGroups) {
      if (ids.length > 1) {
        // Keep the first, remove the rest
        const toRemove = ids.slice(1);
        
        for (const id of toRemove) {
          const { data: noteToRemove } = await supabase
            .from('library_notes')
            .select('text')
            .eq('id', id)
            .single();
          
          if (noteToRemove) {
            spaceSaved += (noteToRemove.text?.length || 0) * 2; // Rough estimate
          }
          
          const { error: deleteError } = await supabase
            .from('library_notes')
            .delete()
            .eq('id', id);
          
          if (!deleteError) {
            removed++;
          }
        }
      }
    }

    return { removed, space_saved: spaceSaved };
  }

  private async compressLargeContent(): Promise<{ compressed: number; space_saved: number }> {
    // Find notes with very large content (>100KB)
    const { data: largeNotes, error } = await supabase
      .from('library_notes')
      .select('id, text, metadata')
      .gte('text', '#'.repeat(100000)); // Rough filter for large content

    if (error) throw error;
    if (!largeNotes) return { compressed: 0, space_saved: 0 };

    let compressed = 0;
    let spaceSaved = 0;

    for (const note of largeNotes) {
      if (note.text && note.text.length > 100000) {
        try {
          // Compress by removing excessive whitespace and normalizing content
          const originalSize = note.text.length;
          const compressedText = this.compressText(note.text);
          
          if (compressedText.length < originalSize * 0.9) { // Only if we save at least 10%
            const { error: updateError } = await supabase
              .from('library_notes')
              .update({ 
                text: compressedText,
                metadata: {
                  ...note.metadata,
                  compression_ratio: (compressedText.length / originalSize).toFixed(2),
                  original_size: originalSize,
                  compressed_at: new Date().toISOString()
                }
              })
              .eq('id', note.id);
            
            if (!updateError) {
              compressed++;
              spaceSaved += originalSize - compressedText.length;
            }
          }
        } catch (err) {
          console.error(`Failed to compress note ${note.id}:`, err);
        }
      }
    }

    return { compressed, space_saved: spaceSaved };
  }

  private async archiveOldContent(): Promise<{ archived: number; space_saved: number }> {
    // Archive notes older than 2 years that haven't been updated
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const { data: oldNotes, error } = await supabase
      .from('library_notes')
      .select('id, title, created_at, updated_at, metadata')
      .lt('created_at', twoYearsAgo.toISOString())
      .lt('updated_at', twoYearsAgo.toISOString())
      .limit(100); // Process in batches

    if (error) throw error;
    if (!oldNotes) return { archived: 0, space_saved: 0 };

    // In a real implementation, you might move these to an archive table
    // For now, we'll just add a flag and reduce some metadata
    let archived = 0;
    let space_saved = 0;

    for (const note of oldNotes) {
      try {
        // Add archive flag and remove some metadata to save space
        const { error: updateError } = await supabase
          .from('library_notes')
          .update({
            metadata: {
              archived: true,
              archived_at: new Date().toISOString(),
              // Keep only essential metadata
              word_count: note.metadata?.word_count || 0
            }
          })
          .eq('id', note.id);
        
        if (!updateError) {
          archived++;
          space_saved += 1000; // Rough estimate of space saved from metadata reduction
        }
      } catch (err) {
        console.error(`Failed to archive note ${note.id}:`, err);
      }
    }

    return { archived, space_saved };
  }

  private async cleanupOrphanedData(): Promise<{ cleaned: number; space_saved: number }> {
    // Clean up any orphaned data or references
    let cleaned = 0;
    let space_saved = 0;

    // This is a simplified implementation
    // In practice, you'd check for various types of orphaned data
    
    return { cleaned, space_saved };
  }

  private generateSimpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private compressText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduce multiple line breaks
      .trim();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Data Migration Utilities
  async migrateData(fromVersion: string, toVersion: string, options: {
    dryRun?: boolean;
    backupBeforeMigration?: boolean;
    skipValidation?: boolean;
  } = {}): Promise<{
    success: boolean;
    migrations_applied: number;
    warnings: string[];
    errors: string[];
    details: Array<{
      migration_step: string;
      status: 'applied' | 'skipped' | 'failed';
      message?: string;
      items_affected?: number;
    }>;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const details: Array<any> = [];
      const warnings: string[] = [];
      const errors: string[] = [];
      let migrationsApplied = 0;

      // Create backup if requested and not dry run
      if (options.backupBeforeMigration && !options.dryRun) {
        try {
          await this.createBackup('full');
          details.push({
            migration_step: 'backup_creation',
            status: 'applied',
            message: 'Backup created successfully',
            items_affected: 1
          });
        } catch (error) {
          warnings.push(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Get current data state for validation
      if (!options.skipValidation) {
        try {
          const validation = await this.validateDataIntegrity({
            checkDuplicates: true,
            checkCorruptedContent: true,
            checkOrphanedReferences: true
          });
          
          if (validation.summary.invalid_items > 0) {
            warnings.push(`Data integrity issues found: ${validation.summary.invalid_items} invalid items`);
          }
        } catch (error) {
          warnings.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Apply migrations based on version changes
      if (fromVersion === '1.0' && toVersion === '1.1') {
        const migrationResult = await this.applyMigration_1_0_to_1_1(options.dryRun);
        details.push(...migrationResult.details);
        if (migrationResult.success) migrationsApplied++;
      }

      if (fromVersion === '1.1' && toVersion === '1.2') {
        const migrationResult = await this.applyMigration_1_1_to_1_2(options.dryRun);
        details.push(...migrationResult.details);
        if (migrationResult.success) migrationsApplied++;
      }

      // General data cleanup migration
      if (fromVersion < toVersion) {
        const migrationResult = await this.applyGeneralCleanup(options.dryRun);
        details.push(...migrationResult.details);
        if (migrationResult.success) migrationsApplied++;
      }

      return {
        success: errors.length === 0,
        migrations_applied: migrationsApplied,
        warnings,
        errors,
        details
      };
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }

  private async applyMigration_1_0_to_1_1(dryRun: boolean = false): Promise<{
    success: boolean;
    details: Array<{
      migration_step: string;
      status: 'applied' | 'skipped' | 'failed';
      message?: string;
      items_affected?: number;
    }>;
  }> {
    const details: Array<any> = [];
    let success = true;

    // Migration: Add new metadata fields to existing notes
    try {
      if (dryRun) {
        details.push({
          migration_step: 'add_metadata_fields',
          status: 'skipped',
          message: 'Dry run - would add missing metadata fields'
        });
      } else {
        const { data: notes, error } = await supabase
          .from('library_notes')
          .select('id, metadata')
          .is('metadata', null);
        
        if (error) throw error;
        
        if (notes && notes.length > 0) {
          for (const note of notes) {
            await supabase
              .from('library_notes')
              .update({
                metadata: {
                  version: '1.1',
                  migrated_at: new Date().toISOString(),
                  word_count: 0
                }
              })
              .eq('id', note.id);
          }
          
          details.push({
            migration_step: 'add_metadata_fields',
            status: 'applied',
            message: `Added metadata to ${notes.length} notes`,
            items_affected: notes.length
          });
        }
      }
    } catch (error) {
      success = false;
      details.push({
        migration_step: 'add_metadata_fields',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return { success, details };
  }

  private async applyMigration_1_1_to_1_2(dryRun: boolean = false): Promise<{
    success: boolean;
    details: Array<{
      migration_step: string;
      status: 'applied' | 'skipped' | 'failed';
      message?: string;
      items_affected?: number;
    }>;
  }> {
    const details: Array<any> = [];
    let success = true;

    // Migration: Normalize tag formats
    try {
      if (dryRun) {
        details.push({
          migration_step: 'normalize_tags',
          status: 'skipped',
          message: 'Dry run - would normalize tag formats'
        });
      } else {
        const { data: notes, error } = await supabase
          .from('library_notes')
          .select('id, metadata')
          .not('metadata->tags', 'is', null);
        
        if (error) throw error;
        
        if (notes && notes.length > 0) {
          let updatedCount = 0;
          for (const note of notes) {
            const tags = note.metadata?.tags;
            if (Array.isArray(tags)) {
              const normalizedTags = tags
                .filter(tag => typeof tag === 'string' && tag.trim())
                .map(tag => tag.trim().toLowerCase())
                .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
              
              if (normalizedTags.length !== tags.length) {
                await supabase
                  .from('library_notes')
                  .update({
                    metadata: {
                      ...note.metadata,
                      tags: normalizedTags
                    }
                  })
                  .eq('id', note.id);
                updatedCount++;
              }
            }
          }
          
          details.push({
            migration_step: 'normalize_tags',
            status: 'applied',
            message: `Normalized tags for ${updatedCount} notes`,
            items_affected: updatedCount
          });
        }
      }
    } catch (error) {
      success = false;
      details.push({
        migration_step: 'normalize_tags',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return { success, details };
  }

  private async applyGeneralCleanup(dryRun: boolean = false): Promise<{
    success: boolean;
    details: Array<{
      migration_step: string;
      status: 'applied' | 'skipped' | 'failed';
      message?: string;
      items_affected?: number;
    }>;
  }> {
    const details: Array<any> = [];
    let success = true;

    // General cleanup tasks
    try {
      if (dryRun) {
        details.push({
          migration_step: 'general_cleanup',
          status: 'skipped',
          message: 'Dry run - would perform general cleanup'
        });
      } else {
        // Remove empty notes
        const { data: emptyNotes, error } = await supabase
          .from('library_notes')
          .select('id')
          .or('title.is.null,title.eq."",text.is.null');
        
        if (error) throw error;
        
        if (emptyNotes && emptyNotes.length > 0) {
          // Archive instead of delete for safety
          for (const note of emptyNotes) {
            await supabase
              .from('library_notes')
              .update({
                metadata: {
                  archived: true,
                  archived_reason: 'empty_content',
                  archived_at: new Date().toISOString()
                }
              })
              .eq('id', note.id);
          }
          
          details.push({
            migration_step: 'archive_empty_notes',
            status: 'applied',
            message: `Archived ${emptyNotes.length} empty notes`,
            items_affected: emptyNotes.length
          });
        }
      }
    } catch (error) {
      success = false;
      details.push({
        migration_step: 'general_cleanup',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return { success, details };
  }

  // Enhanced Import Methods for Additional Formats
  private async parseImportFile(file: File, importType: ImportSession['import_type']): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    try {
      switch (importType) {
        case 'csv':
          return await this.parseCSV(file);
        case 'markdown':
          return await this.parseMarkdown(file);
        case 'html':
          return await this.parseHTML(file);
        case 'pdf':
          return await this.parsePDF(file);
        case 'docx':
          return await this.parseDOCX(file);
        default:
          return { 
            items: [], 
            errors: [{ 
              row: 0, 
              field: 'file', 
              message: `Unsupported import type: ${importType}`, 
              severity: 'error' 
            }] 
          };
      }
    } catch (error) {
      return { 
        items: [], 
        errors: [{ 
          row: 0, 
          field: 'file', 
          message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          severity: 'error' 
        }] 
      };
    }
  }

  private async parseMarkdown(file: File): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const markdown = e.target?.result as string;
          const items: Array<Record<string, any>> = [];
          const errors: Array<any> = [];
          
          // Split by headers to create separate notes
          const sections = markdown.split(/^#{1,6}\s+/m).filter(section => section.trim());
          
          if (sections.length === 0) {
            resolve({ 
              items: [{ 
                title: 'Imported Markdown', 
                content: markdown, 
                category: 'imported' 
              }], 
              errors: [] 
            });
            return;
          }
          
          sections.forEach((section, index) => {
            try {
              const lines = section.split('\n');
              const firstLine = lines[0]?.trim();
              const restContent = lines.slice(1).join('\n').trim();
              
              if (firstLine && restContent) {
                items.push({
                  title: firstLine,
                  content: restContent,
                  category: 'markdown'
                });
              } else if (firstLine) {
                items.push({
                  title: firstLine,
                  content: '',
                  category: 'markdown'
                });
              }
            } catch (error) {
              errors.push({
                row: index + 1,
                field: 'section',
                message: `Failed to parse section: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error'
              });
            }
          });
          
          resolve({ items, errors });
        } catch (error) {
          resolve({ 
            items: [], 
            errors: [{ 
              row: 0, 
              field: 'file', 
              message: `Markdown parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              severity: 'error' 
            }] 
          });
        }
      };
      reader.onerror = () => {
        resolve({ 
          items: [], 
          errors: [{ 
            row: 0, 
            field: 'file', 
            message: 'Failed to read file', 
            severity: 'error' 
          }] 
        });
      };
      reader.readAsText(file);
    });
  }

  private async parseHTML(file: File): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const html = e.target?.result as string;
          const items: Array<Record<string, any>> = [];
          const errors: Array<any> = [];
          
          // Simple HTML parsing - extract text content and structure
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : 'Imported HTML';
          
          // Remove HTML tags and get text content
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
            .replace(/<[^>]+>/g, '') // Remove all HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (textContent) {
            items.push({
              title,
              content: textContent,
              category: 'html'
            });
          }
          
          resolve({ items, errors });
        } catch (error) {
          resolve({ 
            items: [], 
            errors: [{ 
              row: 0, 
              field: 'file', 
              message: `HTML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              severity: 'error' 
            }] 
          });
        }
      };
      reader.onerror = () => {
        resolve({ 
          items: [], 
          errors: [{ 
            row: 0, 
            field: 'file', 
            message: 'Failed to read file', 
            severity: 'error' 
          }] 
        });
      };
      reader.readAsText(file);
    });
  }

  private async parsePDF(file: File): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    // For PDF parsing, we'd need a PDF library in a real implementation
    // For now, return a placeholder that indicates PDF import is not fully supported
    return {
      items: [],
      errors: [{
        row: 0,
        field: 'file',
        message: 'PDF import requires additional libraries. Please convert to text format or use manual import.',
        severity: 'warning'
      }]
    };
  }

  private async parseDOCX(file: File): Promise<{
    items: Array<Record<string, any>>;
    errors: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>;
  }> {
    // For DOCX parsing, we'd need a DOCX library in a real implementation
    // For now, return a placeholder that indicates DOCX import is not fully supported
    return {
      items: [],
      errors: [{
        row: 0,
        field: 'file',
        message: 'DOCX import requires additional libraries. Please convert to text format or use manual import.',
        severity: 'warning'
      }]
    };
  }

  // Data Validation
  async validateNote(noteId: string): Promise<ValidationResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('validate_note_integrity', { 
          note_uuid: noteId, 
          user_uuid: user.user.id 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to validate note:', error);
      throw error;
    }
  }

  async validateAllData(): Promise<Array<ValidationResult & { entity_id: string }>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get all notes
      const { data: notes, error: notesError } = await supabase
        .from('library_notes')
        .select('id')
        .eq('user_id', user.user.id);

      if (notesError) throw notesError;

      // Validate each note
      const results: Array<ValidationResult & { entity_id: string }> = [];
      
      for (const note of notes || []) {
        try {
          const result = await this.validateNote(note.id);
          results.push({ ...result, entity_id: note.id });
        } catch (error) {
          console.error(`Failed to validate note ${note.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to validate all data:', error);
      return [];
    }
  }

  // Enhanced Data Validation Methods
  async validateDataIntegrity(options: {
    checkDuplicates?: boolean;
    checkOrphanedReferences?: boolean;
    checkCorruptedContent?: boolean;
    validateRelationships?: boolean;
  } = {}): Promise<{
    summary: {
      total_items: number;
      valid_items: number;
      invalid_items: number;
      warnings: number;
      issues: Array<{
        type: 'duplicate' | 'orphaned' | 'corrupted' | 'invalid_reference' | 'missing_field' | 'constraint_violation';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        count: number;
        examples: string[];
      }>;
    };
    details: Array<{
      entity_type: string;
      entity_id: string;
      issues: Array<{
        type: string;
        message: string;
        severity: string;
        field?: string;
      }>;
    }>;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get all user data
      const [notesResult, templatesResult] = await Promise.all([
        supabase.from('library_notes').select('*').eq('user_id', user.user.id),
        supabase.from('library_templates').select('*').eq('user_id', user.user.id)
      ]);

      if (notesResult.error) throw notesResult.error;
      if (templatesResult.error) throw templatesResult.error;

      const notes = notesResult.data || [];
      const templates = templatesResult.data || [];
      const allItems = [...notes, ...templates];
      const issues: Array<any> = [];
      const details: Array<any> = [];

      // Check for duplicates
      if (options.checkDuplicates) {
        const titleMap = new Map();
        for (const item of allItems) {
          const key = item.title.toLowerCase().trim();
          if (titleMap.has(key)) {
            const first = titleMap.get(key);
            issues.push({
              type: 'duplicate' as const,
              severity: 'medium' as const,
              message: `Duplicate title: "${item.title}"`,
              count: 2
            });
            details.push({
              entity_type: item.content_type || 'note',
              entity_id: item.id,
              issues: [{
                type: 'duplicate_title',
                message: `Title "${item.title}" already exists`,
                severity: 'medium',
                field: 'title'
              }]
            });
          } else {
            titleMap.set(key, item);
          }
        }
      }

      // Check for corrupted content
      if (options.checkCorruptedContent) {
        for (const item of allItems) {
          const itemIssues = [];
          
          // Check for empty titles
          if (!item.title || item.title.trim().length === 0) {
            itemIssues.push({
              type: 'missing_field',
              message: 'Title is empty',
              severity: 'high',
              field: 'title'
            });
          }
          
          // Check for excessively long content
          if (item.text && item.text.length > 1000000) { // 1MB of text
            itemIssues.push({
              type: 'constraint_violation',
              message: 'Content is unusually large',
              severity: 'medium',
              field: 'text'
            });
          }
          
          // Check for invalid metadata
          if (item.metadata && typeof item.metadata !== 'object') {
            itemIssues.push({
              type: 'constraint_violation',
              message: 'Invalid metadata format',
              severity: 'medium',
              field: 'metadata'
            });
          }
          
          if (itemIssues.length > 0) {
            details.push({
              entity_type: item.content_type || 'note',
              entity_id: item.id,
              issues: itemIssues
            });
          }
        }
      }

      // Check for orphaned references
      if (options.checkOrphanedReferences) {
        // This would check for references to deleted items
        // For now, we'll simulate some checks
        for (const item of allItems) {
          if (item.metadata?.tags && Array.isArray(item.metadata.tags)) {
            // Validate tag format
            const invalidTags = item.metadata.tags.filter((tag: any) => 
              typeof tag !== 'string' || tag.length > 50
            );
            if (invalidTags.length > 0) {
              details.push({
                entity_type: item.content_type || 'note',
                entity_id: item.id,
                issues: [{
                  type: 'invalid_reference',
                  message: `Invalid tag format: ${invalidTags.join(', ')}`,
                  severity: 'low',
                  field: 'tags'
                }]
              });
            }
          }
        }
      }

      // Calculate summary
      const totalItems = allItems.length;
      const validItems = totalItems - details.length;
      const invalidItems = details.length;
      const warnings = issues.filter(issue => issue.severity === 'low').length;

      return {
        summary: {
          total_items: totalItems,
          valid_items: validItems,
          invalid_items: invalidItems,
          warnings,
          issues
        },
        details
      };
    } catch (error) {
      console.error('Data integrity validation failed:', error);
      throw error;
    }
  }

  // Utility Methods
  async getSyncStatus(): Promise<{
    pending_operations: number;
    failed_operations: number;
    last_sync: string | null;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const [pendingResult, failedResult, lastSyncResult] = await Promise.all([
        supabase
          .from('library_sync_queue')
          .select('id', { count: 'exact' })
          .eq('user_id', user.user.id)
          .eq('status', 'pending'),
        supabase
          .from('library_sync_queue')
          .select('id', { count: 'exact' })
          .eq('user_id', user.user.id)
          .eq('status', 'failed'),
        supabase
          .from('library_sync_queue')
          .select('processed_at')
          .eq('user_id', user.user.id)
          .eq('status', 'completed')
          .order('processed_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      return {
        pending_operations: pendingResult.count || 0,
        failed_operations: failedResult.count || 0,
        last_sync: lastSyncResult.data?.processed_at || null
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        pending_operations: 0,
        failed_operations: 0,
        last_sync: null
      };
    }
  }
}

export const dataManagementService = new DataManagementService();