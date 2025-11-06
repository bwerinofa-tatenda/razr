// Reminders Component
// Manages note reminders and follow-up tasks

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  X,
  Calendar,
  CheckCircle,
  Circle,
  AlertTriangle,
  Flag,
  Bell,
  RotateCcw,
  Edit3,
  Trash2,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Reminder, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface RemindersProps {
  noteId?: string;
  isOpen: boolean;
  onClose: () => void;
  onReminderCreate: (reminder: Reminder) => void;
}

interface ReminderFormData {
  message: string;
  reminderDate: string;
  reminderTime: string;
  reminderType: 'deadline' | 'followup' | 'review' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  repeatPattern?: string;
}

const Reminders: React.FC<RemindersProps> = ({
  noteId,
  isOpen,
  onClose,
  onReminderCreate
}) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ReminderFormData>({
    message: '',
    reminderDate: '',
    reminderTime: '',
    reminderType: 'followup',
    priority: 'medium',
    repeatPattern: 'none'
  });

  useEffect(() => {
    if (isOpen && user) {
      loadReminders();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Update form with editing reminder data
    if (editingReminder) {
      const date = new Date(editingReminder.reminderDate);
      setFormData({
        message: editingReminder.message,
        reminderDate: date.toISOString().split('T')[0],
        reminderTime: date.toTimeString().slice(0, 5),
        reminderType: editingReminder.reminderType,
        priority: editingReminder.priority,
        repeatPattern: editingReminder.repeatPattern || 'none'
      });
    }
  }, [editingReminder]);

  const loadReminders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userReminders = await advancedLibraryService.getReminders(user.id, false);
      setReminders(userReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.message.trim() || !formData.reminderDate || !formData.reminderTime) {
      return;
    }

    try {
      const reminderDateTime = new Date(`${formData.reminderDate}T${formData.reminderTime}`);
      
      const reminder = await advancedLibraryService.createReminder(
        noteId || 'general',
        user.id,
        formData.message,
        reminderDateTime.toISOString(),
        formData.reminderType,
        formData.priority
      );

      setReminders(prev => [reminder, ...prev]);
      onReminderCreate(reminder);
      
      // Reset form
      setFormData({
        message: '',
        reminderDate: '',
        reminderTime: '',
        reminderType: 'followup',
        priority: 'medium',
        repeatPattern: 'none'
      });
      setIsCreating(false);
      
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await advancedLibraryService.completeReminder(reminderId);
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, isCompleted: true, completedAt: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getFilteredReminders = () => {
    let filtered = reminders;

    // Apply filter
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(r => !r.isCompleted);
        break;
      case 'completed':
        filtered = filtered.filter(r => r.isCompleted);
        break;
      case 'overdue':
        const now = new Date();
        filtered = filtered.filter(r => 
          !r.isCompleted && new Date(r.reminderDate) < now
        );
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reminderType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      // Sort by completion status, then by date
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-3 h-3" />;
      case 'high':
        return <Flag className="w-3 h-3" />;
      case 'medium':
        return <Circle className="w-3 h-3" />;
      case 'low':
        return <Circle className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Calendar className="w-4 h-4" />;
      case 'followup':
        return <RotateCcw className="w-4 h-4" />;
      case 'review':
        return <Edit3 className="w-4 h-4" />;
      case 'action':
        return <Bell className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverdue
    };
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reminders
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reminders.filter(r => !r.isCompleted).length} pending
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reminders..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter
              </h3>
              {[
                { key: 'pending', label: 'Pending', count: reminders.filter(r => !r.isCompleted).length },
                { key: 'completed', label: 'Completed', count: reminders.filter(r => r.isCompleted).length },
                { key: 'overdue', label: 'Overdue', count: reminders.filter(r => !r.isCompleted && new Date(r.reminderDate) < new Date()).length },
                { key: 'all', label: 'All', count: reminders.length }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{filterOption.label}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                      {filterOption.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {isCreating ? (
              <ReminderForm
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={handleCreateReminder}
                onCancel={() => setIsCreating(false)}
                noteId={noteId}
              />
            ) : (
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : getFilteredReminders().length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchQuery ? 'No reminders found' : 'No reminders yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search or filter'
                        : 'Create your first reminder to stay on track'
                      }
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Create Reminder
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredReminders().map(reminder => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={() => handleCompleteReminder(reminder.id)}
                        onDelete={() => handleDeleteReminder(reminder.id)}
                        onEdit={() => setEditingReminder(reminder)}
                        formatDateTime={formatDateTime}
                        getRelativeTime={getRelativeTime}
                        getPriorityColor={getPriorityColor}
                        getPriorityIcon={getPriorityIcon}
                        getReminderTypeIcon={getReminderTypeIcon}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReminderFormProps {
  formData: ReminderFormData;
  onFormDataChange: (data: ReminderFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  noteId?: string;
}

const ReminderForm: React.FC<ReminderFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  noteId
}) => {
  const handleInputChange = (field: keyof ReminderFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // Set default date/time to current time + 1 hour
  useEffect(() => {
    if (!formData.reminderDate && !formData.reminderTime) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      onFormDataChange({
        ...formData,
        reminderDate: now.toISOString().split('T')[0],
        reminderTime: now.toTimeString().slice(0, 5)
      });
    }
  }, []);

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Create Reminder
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="What do you need to remember?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.reminderDate}
              onChange={(e) => handleInputChange('reminderDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time *
            </label>
            <input
              type="time"
              value={formData.reminderTime}
              onChange={(e) => handleInputChange('reminderTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Type and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.reminderType}
              onChange={(e) => handleInputChange('reminderType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="followup">Follow-up</option>
              <option value="deadline">Deadline</option>
              <option value="review">Review</option>
              <option value="action">Action Required</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Repeat Pattern */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Repeat
          </label>
          <select
            value={formData.repeatPattern}
            onChange={(e) => handleInputChange('repeatPattern', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Reminder
        </button>
      </div>
    </form>
  );
};

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  formatDateTime: (date: string) => { date: string; time: string; isOverdue: boolean };
  getRelativeTime: (date: string) => string;
  getPriorityColor: (priority: string) => string;
  getPriorityIcon: (priority: string) => React.ReactNode;
  getReminderTypeIcon: (type: string) => React.ReactNode;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onComplete,
  onDelete,
  onEdit,
  formatDateTime,
  getRelativeTime,
  getPriorityColor,
  getPriorityIcon,
  getReminderTypeIcon
}) => {
  const { date, time, isOverdue } = formatDateTime(reminder.reminderDate);
  
  return (
    <div className={`p-4 border rounded-lg transition-colors ${
      reminder.isCompleted 
        ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
        : isOverdue
        ? 'border-red-200 bg-red-50 dark:bg-red-900/20'
        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={onComplete}
              className={`p-1 rounded transition-colors ${
                reminder.isCompleted
                  ? 'text-green-600 hover:text-green-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {reminder.isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="text-gray-600 dark:text-gray-400">
                {getReminderTypeIcon(reminder.reminderType)}
              </div>
              <span className="text-sm text-gray-500 capitalize">
                {reminder.reminderType}
              </span>
            </div>
            
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getPriorityColor(reminder.priority)}`}>
              {getPriorityIcon(reminder.priority)}
              <span className="capitalize">{reminder.priority}</span>
            </div>
          </div>
          
          <p className={`text-sm mb-2 ${
            reminder.isCompleted 
              ? 'line-through text-gray-500' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {reminder.message}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{date} at {time}</span>
            </div>
            <span>{getRelativeTime(reminder.reminderDate)}</span>
            {reminder.completedAt && (
              <span className="text-green-600">Completed</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
