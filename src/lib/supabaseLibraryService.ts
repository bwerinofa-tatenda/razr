import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jtxuxessjppnlhpvjuah.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eHV4ZXNzanBwbmxocHZqdWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODY1OTYsImV4cCI6MjA3NzU2MjU5Nn0.oLlVjdm8gfZYVDttHOwZ0t7n4FKmvUGz5InaNAqPO8s"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Advanced Library Database Types
export interface SupabaseNote {
  id: string
  user_id: string
  title?: string
  text: string
  content_type: 'plain-text' | 'rich-text' | 'code' | 'syntax-highlight' | 'mind-map' | 'mermaid' | 'math'
  content_data?: any
  category?: string
  folder_id?: string
  tags?: string[]
  is_favorite: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface NoteVersion {
  id: string
  note_id: string
  user_id: string
  version_number: number
  content_snapshot: string
  content_data_snapshot?: any
  metadata_snapshot?: any
  change_summary?: string
  change_type: 'create' | 'edit' | 'delete' | 'restore'
  is_auto_save: boolean
  created_at: string
}

export interface NoteLink {
  id: string
  source_note_id: string
  target_note_id: string
  link_type: 'reference' | 'citation' | 'trades' | 'pattern'
  context_data?: any
  created_at: string
}

export interface SmartSuggestion {
  id: string
  note_id?: string
  user_id: string
  suggestion_type: 'content' | 'template' | 'tag' | 'reference' | 'completion'
  suggestion_data: any
  context_data?: any
  status: 'pending' | 'applied' | 'dismissed'
  confidence_score: number
  created_at: string
  applied_at?: string
}

export interface Reminder {
  id: string
  note_id: string
  user_id: string
  reminder_type: 'deadline' | 'followup' | 'review' | 'action'
  reminder_date: string
  message: string
  is_completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  repeat_pattern?: string
  created_at: string
  completed_at?: string
}

export interface VoiceNote {
  id: string
  note_id: string
  user_id: string
  audio_url?: string
  transcript?: string
  duration_seconds?: number
  language_code: string
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed'
  confidence_score?: number
  created_at: string
}

export interface NoteExport {
  id: string
  note_id?: string
  user_id: string
  export_type: 'pdf' | 'docx' | 'md' | 'html' | 'json'
  export_settings?: any
  file_url?: string
  file_name?: string
  file_size_bytes?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}

export interface NoteFilter {
  folder?: string
  tags?: string[]
  content_type?: string
  search?: string
  date_range?: {
    from: string
    to: string
  }
  sort_by?: 'created_at' | 'updated_at' | 'title'
  sort_order?: 'asc' | 'desc'
  favorite?: boolean
  pinned?: boolean
}

class AdvancedLibraryService {
  // Authentication
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  }

  // Notes CRUD Operations
  async getNotes(filter: NoteFilter = {}): Promise<SupabaseNote[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('library_notes')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Apply filters
    if (filter.folder) {
      query = query.eq('folder_id', filter.folder)
    }

    if (filter.content_type) {
      query = query.eq('content_type', filter.content_type)
    }

    if (filter.favorite !== undefined) {
      query = query.eq('is_favorite', filter.favorite)
    }

    if (filter.pinned !== undefined) {
      query = query.eq('is_pinned', filter.pinned)
    }

    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,text.ilike.%${filter.search}%`)
    }

    if (filter.tags && filter.tags.length > 0) {
      query = query.contains('tags', filter.tags)
    }

    // Sorting
    const sortBy = filter.sort_by || 'updated_at'
    const sortOrder = filter.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notes:', error)
      throw error
    }

    return data || []
  }

  async getNote(id: string): Promise<SupabaseNote | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      console.error('Error fetching note:', error)
      throw error
    }

    return data
  }

  async createNote(noteData: Partial<SupabaseNote>): Promise<SupabaseNote> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_notes')
      .insert({
        ...noteData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating note:', error)
      throw error
    }

    // Create initial version
    if (data) {
      await this.createVersion({
        note_id: data.id,
        content_snapshot: data.text,
        content_data_snapshot: data.content_data,
        change_type: 'create',
        change_summary: 'Initial version'
      })
    }

    return data
  }

  async updateNote(id: string, updates: Partial<SupabaseNote>): Promise<SupabaseNote> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get current note for version tracking
    const currentNote = await this.getNote(id)
    if (!currentNote) throw new Error('Note not found')

    const { data, error } = await supabase
      .from('library_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating note:', error)
      throw error
    }

    // Create version for changes
    if (data && (updates.text !== currentNote.text || updates.content_data !== currentNote.content_data)) {
      await this.createVersion({
        note_id: data.id,
        content_snapshot: data.text,
        content_data_snapshot: data.content_data,
        change_type: 'edit',
        change_summary: 'Content updated'
      })
    }

    return data
  }

  async deleteNote(id: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('library_notes')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  // Version History
  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_note_versions')
      .select('*')
      .eq('note_id', noteId)
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching note versions:', error)
      throw error
    }

    return data || []
  }

  async createVersion(versionData: Partial<NoteVersion>): Promise<NoteVersion> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('library_note_versions')
      .select('version_number')
      .eq('note_id', versionData.note_id)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1

    const { data, error } = await supabase
      .from('library_note_versions')
      .insert({
        ...versionData,
        user_id: user.id,
        version_number: nextVersion,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating version:', error)
      throw error
    }

    return data
  }

  async restoreVersion(noteId: string, versionId: string): Promise<SupabaseNote> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get version data
    const { data: version, error: versionError } = await supabase
      .from('library_note_versions')
      .select('*')
      .eq('id', versionId)
      .eq('note_id', noteId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (versionError || !version) {
      throw new Error('Version not found')
    }

    // Restore the note
    const { data, error } = await supabase
      .from('library_notes')
      .update({
        text: version.content_snapshot,
        content_data: version.content_data_snapshot,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error restoring version:', error)
      throw error
    }

    // Create a new version for the restore operation
    await this.createVersion({
      note_id: noteId,
      content_snapshot: version.content_snapshot,
      content_data_snapshot: version.content_data_snapshot,
      change_type: 'restore',
      change_summary: `Restored to version ${version.version_number}`
    })

    return data
  }

  // Note Links
  async getNoteLinks(noteId?: string): Promise<NoteLink[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('library_note_links')
      .select(`
        *,
        source_note:source_note_id(id, title, user_id),
        target_note:target_note_id(id, title, user_id)
      `)

    if (noteId) {
      query = query.or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`)
    }

    // Only show links for user's notes
    query = query.or(`source_note.user_id.eq.${user.id},target_note.user_id.eq.${user.id}`)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching note links:', error)
      throw error
    }

    return data || []
  }

  async createLink(linkData: Partial<NoteLink>): Promise<NoteLink> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Verify user owns at least one of the notes
    const { data: sourceNote } = await supabase
      .from('library_notes')
      .select('user_id')
      .eq('id', linkData.source_note_id)
      .maybeSingle()

    const { data: targetNote } = await supabase
      .from('library_notes')
      .select('user_id')
      .eq('id', linkData.target_note_id)
      .maybeSingle()

    if (!sourceNote || !targetNote || (sourceNote.user_id !== user.id && targetNote.user_id !== user.id)) {
      throw new Error('You can only create links between your own notes')
    }

    const { data, error } = await supabase
      .from('library_note_links')
      .insert({
        ...linkData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating note link:', error)
      throw error
    }

    return data
  }

  async deleteLink(linkId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user owns the link
    const { data: link } = await supabase
      .from('library_note_links')
      .select(`
        *,
        source_note:source_note_id(user_id),
        target_note:target_note_id(user_id)
      `)
      .eq('id', linkId)
      .maybeSingle()

    if (!link || (link.source_note?.user_id !== user.id && link.target_note?.user_id !== user.id)) {
      throw new Error('You can only delete links for your own notes')
    }

    const { error } = await supabase
      .from('library_note_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('Error deleting note link:', error)
      throw error
    }
  }

  // Smart Suggestions
  async getSmartSuggestions(noteId?: string): Promise<SmartSuggestion[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('library_suggestions')
      .select('*')
      .eq('user_id', user.id)

    if (noteId) {
      query = query.eq('note_id', noteId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suggestions:', error)
      throw error
    }

    return data || []
  }

  async applySuggestion(suggestionId: string, content: any): Promise<SmartSuggestion> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_suggestions')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        suggestion_data: content
      })
      .eq('id', suggestionId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error applying suggestion:', error)
      throw error
    }

    return data
  }

  async dismissSuggestion(suggestionId: string): Promise<SmartSuggestion> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_suggestions')
      .update({
        status: 'dismissed'
      })
      .eq('id', suggestionId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error dismissing suggestion:', error)
      throw error
    }

    return data
  }

  // Reminders
  async getReminders(includeCompleted = false): Promise<Reminder[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('library_reminders')
      .select('*')
      .eq('user_id', user.id)

    if (!includeCompleted) {
      query = query.eq('is_completed', false)
    }

    const { data, error } = await query
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching reminders:', error)
      throw error
    }

    return data || []
  }

  async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_reminders')
      .insert({
        ...reminderData,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating reminder:', error)
      throw error
    }

    return data
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const updateData = {
      ...updates,
      completed_at: updates.is_completed ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('library_reminders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating reminder:', error)
      throw error
    }

    return data
  }

  async deleteReminder(id: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('library_reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting reminder:', error)
      throw error
    }
  }

  // Voice Notes
  async getVoiceNotes(noteId?: string): Promise<VoiceNote[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('library_voice_notes')
      .select('*')
      .eq('user_id', user.id)

    if (noteId) {
      query = query.eq('note_id', noteId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching voice notes:', error)
      throw error
    }

    return data || []
  }

  async createVoiceNote(voiceData: Partial<VoiceNote>): Promise<VoiceNote> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_voice_notes')
      .insert({
        ...voiceData,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating voice note:', error)
      throw error
    }

    return data
  }

  // Export/Import
  async createExport(exportData: Partial<NoteExport>): Promise<NoteExport> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_exports')
      .insert({
        ...exportData,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating export:', error)
      throw error
    }

    return data
  }

  async getExports(): Promise<NoteExport[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('library_exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exports:', error)
      throw error
    }

    return data || []
  }

  // Folder Management
  async getFolders(): Promise<any[]> {
    // For now, return static folders. In a real implementation, 
    // this would query a folders table
    return [
      { id: '1', name: 'Trade Notes', type: 'folder', expanded: true },
      { id: '2', name: 'Daily Journal', type: 'folder', expanded: true },
      { id: '3', name: 'Strategy', type: 'folder', expanded: false }
    ]
  }

  // Smart Analysis
  async analyzeNoteContent(content: string): Promise<{
    suggestedTags: string[]
    confidence: number
    relatedNotes: string[]
  }> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Simple keyword-based analysis (in production, this would use AI)
    const tradingKeywords = ['trading', 'trade', 'buy', 'sell', 'profit', 'loss', 'strategy']
    const analysisKeywords = ['analysis', 'chart', 'technical', 'fundamental']
    const psychologyKeywords = ['emotion', 'psychology', 'fear', 'greed', 'discipline']

    const suggestedTags: string[] = []
    const lowerContent = content.toLowerCase()

    tradingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        suggestedTags.push('trading')
      }
    })

    analysisKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        suggestedTags.push('analysis')
      }
    })

    psychologyKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        suggestedTags.push('psychology')
      }
    })

    // Get related notes (simple text similarity)
    const { data: relatedNotes } = await supabase
      .from('library_notes')
      .select('id, text')
      .eq('user_id', user.id)
      .textSearch('text', content.split(' ').slice(0, 5).join(' '))
      .limit(3)

    return {
      suggestedTags: [...new Set(suggestedTags)],
      confidence: 0.8,
      relatedNotes: relatedNotes?.map(note => note.id) || []
    }
  }
}

export const advancedLibraryService = new AdvancedLibraryService()
export default advancedLibraryService