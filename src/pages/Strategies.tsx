import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStrategies, getNotes, createStrategy, createNote } from '../utils/api';
import { Plus, ChevronDown, ChevronRight, FileText, Mic } from 'lucide-react';

export default function Strategies() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewStrategyForm, setShowNewStrategyForm] = useState(false);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const [newStrategy, setNewStrategy] = useState({
    name: '',
    category: 'Day Trading',
    description: ''
  });

  const [newNote, setNewNote] = useState({
    text: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [strategiesData, notesData] = await Promise.all([
        getStrategies(user.id),
        getNotes(user.id)
      ]);
      setStrategies(strategiesData);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createStrategy({
        ...newStrategy,
        user_id: user.id
      });
      setNewStrategy({ name: '', category: 'Day Trading', description: '' });
      setShowNewStrategyForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating strategy:', error);
      alert('Failed to create strategy');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStrategy) return;

    try {
      await createNote({
        strategy_id: selectedStrategy,
        user_id: user.id,
        text: newNote.text,
        image_urls: [],
        voice_urls: []
      });
      setNewNote({ text: '' });
      setShowNewNoteForm(false);
      setSelectedStrategy(null);
      loadData();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const toggleStrategy = (id: string) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };

  const getStrategyNotes = (strategyId: string) => {
    return notes.filter(note => note.strategy_id === strategyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-normal text-gray-900 dark:text-white">Library</h1>
        <button
          onClick={() => setShowNewStrategyForm(true)}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-normal shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Strategy
        </button>
      </div>

      {/* New Strategy Form */}
      {showNewStrategyForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-normal text-gray-900 dark:text-white mb-4">Create New Strategy</h2>
          <form onSubmit={handleCreateStrategy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy Name
              </label>
              <input
                type="text"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                required
                placeholder="e.g., Momentum Breakout"
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={newStrategy.category}
                onChange={(e) => setNewStrategy({ ...newStrategy, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Scalping">Scalping</option>
                <option value="Day Trading">Day Trading</option>
                <option value="Swing Trading">Swing Trading</option>
                <option value="Position Trading">Position Trading</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newStrategy.description}
                onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                rows={4}
                placeholder="Describe your strategy..."
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowNewStrategyForm(false)}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-normal shadow-sm"
              >
                Create Strategy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Strategies List */}
      <div className="space-y-4">
        {strategies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No strategies yet. Create your first strategy to get started.
            </p>
          </div>
        ) : (
          strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Strategy Header */}
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => toggleStrategy(strategy.id)}
              >
                <div className="flex items-center gap-4">
                  {expandedStrategy === strategy.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="text-base font-normal text-gray-900 dark:text-white">
                      {strategy.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{strategy.category}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStrategy(strategy.id);
                    setShowNewNoteForm(true);
                  }}
                  className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </button>
              </div>

              {/* Strategy Details */}
              {expandedStrategy === strategy.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{strategy.description}</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Notes ({getStrategyNotes(strategy.id).length})
                    </h4>
                    <div className="space-y-3">
                      {getStrategyNotes(strategy.id).map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {note.text}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {new Date(note.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Note Modal */}
      {showNewNoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-lg font-normal text-gray-900 dark:text-white mb-4">Add Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note Content
                </label>
                <textarea
                  value={newNote.text}
                  onChange={(e) => setNewNote({ text: e.target.value })}
                  required
                  rows={6}
                  placeholder="Write your note here..."
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewNoteForm(false);
                    setSelectedStrategy(null);
                    setNewNote({ text: '' });
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-normal shadow-sm"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
