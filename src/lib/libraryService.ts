import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcode for production
const supabaseUrl = "VITE_SUPABASE_URL_HERE"; // Replace with actual URL
const supabaseAnonKey = "VITE_SUPABASE_ANON_KEY_HERE"; // Replace with actual key

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "VITE_SUPABASE_URL_HERE" && 
         supabaseAnonKey !== "VITE_SUPABASE_ANON_KEY_HERE";
};

// Types (matching database schema)
export interface LibraryFolder {
  id: string;
  user_id: string;
  name: string;
  type: 'folder' | 'tag';
  parent_id?: string;
  sort_order: number;
  expanded: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LibraryNote {
  id: string;
  user_id: string;
  title?: string;
  text?: string;
  content_type: 'plain-text' | 'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math';
  category?: string;
  tab?: string;
  folder_id?: string;
  trading_data: any;
  content_data: any;
  metadata: any;
  versions: any[];
  current_version?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LibraryTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category: 'trading' | 'psychology' | 'analysis' | 'planning' | 'review' | 'custom';
  content: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  is_system: boolean;
}

export interface LibraryRelationship {
  id: string;
  user_id: string;
  source_note_id: string;
  target_note_id: string;
  relationship_type: string;
  strength: number;
  created_at: string;
}

// Library service class
export class LibraryService {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  // Auth utilities
  private async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // Folders management
  async getFolders(): Promise<LibraryFolder[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_folders')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('type')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async createFolder(folderData: Partial<LibraryFolder>): Promise<LibraryFolder | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_folders')
        .insert({
          ...folderData,
          user_id: user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  async updateFolder(id: string, updates: Partial<LibraryFolder>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_folders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      return false;
    }
  }

  async deleteFolder(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  }

  // Notes management
  async getNotes(folderId?: string): Promise<LibraryNote[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('library_notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async getNote(id: string): Promise<LibraryNote | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }

  async createNote(noteData: Partial<LibraryNote>): Promise<LibraryNote | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .insert({
          ...noteData,
          user_id: user.id,
          trading_data: noteData.trading_data || {},
          content_data: noteData.content_data || {},
          metadata: noteData.metadata || {}
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  async updateNote(id: string, updates: Partial<LibraryNote>): Promise<LibraryNote | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async restoreNote(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_notes')
        .update({ deleted_at: null })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error restoring note:', error);
      return false;
    }
  }

  async permanentlyDeleteNote(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      return false;
    }
  }

  // Templates management
  async getTemplates(): Promise<LibraryTemplate[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_templates')
        .select('*')
        .or(`is_system.eq.true,user_id.eq.${user.id}`)
        .order('is_favorite', { ascending: false })
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async createTemplate(templateData: Partial<LibraryTemplate>): Promise<LibraryTemplate | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_templates')
        .insert({
          ...templateData,
          user_id: user.id,
          is_system: false
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  async updateTemplate(id: string, updates: Partial<LibraryTemplate>): Promise<LibraryTemplate | null> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .from('library_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_system', false); // Only allow deleting user templates

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async incrementTemplateUsage(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await this.supabase
        .rpc('increment_template_usage', { template_id: id, user_id: user.id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      return false;
    }
  }

  // Advanced operations via edge function
  async invokeEdgeFunction(action: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await this.supabase.functions.invoke('library-data-manager', {
        body: { action, data }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error invoking edge function:', error);
      throw error;
    }
  }

  async migrateFromLocalStorage(localStorageData: any): Promise<any> {
    return this.invokeEdgeFunction('migrate_from_local_storage', localStorageData);
  }

  async calculateTradingStats(trades: any[]): Promise<any> {
    return this.invokeEdgeFunction('calculate_trading_stats', { trades });
  }

  async extractTradingMetrics(content: string): Promise<any> {
    return this.invokeEdgeFunction('extract_trading_metrics', { content });
  }

  async syncWithTradesData(noteId: string, trades: any[]): Promise<any> {
    return this.invokeEdgeFunction('sync_with_trades', { noteId, trades });
  }

  async performBulkOperation(operation: string, noteIds: string[], updates?: any): Promise<any> {
    return this.invokeEdgeFunction('bulk_operations', { operation, noteIds, updates });
  }

  // Utility functions
  async searchNotes(searchTerm: string): Promise<LibraryNote[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .or(`title.ilike.%${searchTerm}%,text.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  async getNotesByTag(tag: string): Promise<LibraryNote[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .contains('metadata', { tags: [tag] })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes by tag:', error);
      return [];
    }
  }

  async getNotesByTab(tab: string): Promise<LibraryNote[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('library_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('tab', tab)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes by tab:', error);
      return [];
    }
  }
}

// Create singleton instance
export const libraryService = new LibraryService();