import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Archive, 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Database,
  FileText,
  HardDrive,
  RefreshCw,
  Info,
  Lock
} from 'lucide-react';
import { dataManagementService, type BackupInfo } from '../../lib/dataManagementService';

interface BackupRestorePanelProps {
  onClose?: () => void;
  embedded?: boolean;
}

export const BackupRestorePanel: React.FC<BackupRestorePanelProps> = ({ 
  onClose, 
  embedded = false 
}) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBackup, setActiveBackup] = useState<BackupInfo | null>(null);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const backupHistory = await dataManagementService.getBackupHistory();
      setBackups(backupHistory);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (type: 'full' | 'incremental' | 'differential') => {
    setIsLoading(true);
    try {
      await dataManagementService.createBackup(type, ['notes', 'templates', 'attachments', 'metadata']);
      await loadBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupInfo) => {
    setIsRestoring(true);
    setActiveBackup(backup);
    setRestoreProgress(0);
    
    try {
      // Simulate restore progress
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await dataManagementService.restoreFromBackup(backup.id, {
        mergeStrategy: 'merge',
        validateData: true
      });

      setRestoreProgress(100);
      setTimeout(() => {
        setIsRestoring(false);
        setActiveBackup(null);
        setRestoreProgress(0);
        alert('Backup restored successfully!');
      }, 1000);

    } catch (error) {
      console.error('Failed to restore backup:', error);
      setIsRestoring(false);
      setActiveBackup(null);
      setRestoreProgress(0);
      alert('Failed to restore backup. Please try again.');
    }
  };

  const handleDeleteBackup = async (backup: BackupInfo) => {
    if (!confirm(`Are you sure you want to delete this ${backup.backup_type} backup?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await dataManagementService.deleteBackup(backup.id);
      await loadBackups();
    } catch (error) {
      console.error('Failed to delete backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-blue-100 text-blue-800';
      case 'incremental':
        return 'bg-green-100 text-green-800';
      case 'differential':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStorageStats = () => {
    const totalBackups = backups.length;
    const completedBackups = backups.filter(b => b.status === 'completed').length;
    const totalSize = backups.reduce((sum, backup) => sum + (backup.backup_size_bytes || 0), 0);
    const latestBackup = backups.length > 0 ? backups[0] : null;

    return { totalBackups, completedBackups, totalSize, latestBackup };
  };

  const stats = getStorageStats();

  const content = (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
                <p className="text-sm text-gray-600">Total Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.completedBackups}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <HardDrive className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium">
                  {stats.latestBackup ? formatDate(stats.latestBackup.created_at) : 'None'}
                </p>
                <p className="text-sm text-gray-600">Latest Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Create New Backup</span>
          </CardTitle>
          <CardDescription>
            Choose a backup type based on your needs and available storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleCreateBackup('full')}
              disabled={isLoading}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Archive className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Full Backup</div>
                <div className="text-xs opacity-75">Complete data snapshot</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleCreateBackup('incremental')}
              disabled={isLoading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Incremental</div>
                <div className="text-xs opacity-75">Changes since last backup</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleCreateBackup('differential')}
              disabled={isLoading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Clock className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Differential</div>
                <div className="text-xs opacity-75">Changes since last full backup</div>
              </div>
            </Button>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Full:</strong> Complete backup, largest size. 
              <strong>Incremental:</strong> Only changes, smallest size, requires previous backups. 
              <strong>Differential:</strong> Changes since last full, medium size, independent.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Restore Progress Modal */}
      {isRestoring && activeBackup && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Restoring Backup</h3>
                <p className="text-sm text-gray-600">{activeBackup.backup_type} backup from {formatDate(activeBackup.created_at)}</p>
              </div>
              <Progress value={restoreProgress} className="w-full" />
              <p className="text-sm text-gray-600">{restoreProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Backup History</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadBackups}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your existing backups - restore, download, or delete as needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading backup history...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">No backups found</p>
              <p className="text-sm text-gray-400">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className={`p-4 border rounded-lg transition-all ${
                    activeBackup?.id === backup.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getBackupStatusIcon(backup.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium capitalize">
                            {backup.backup_type} Backup
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={getBackupTypeColor(backup.backup_type)}
                          >
                            {backup.backup_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Created: {formatDate(backup.created_at)}</div>
                          {backup.completed_at && (
                            <div>Completed: {formatDate(backup.completed_at)}</div>
                          )}
                          <div>Size: {formatFileSize(backup.backup_size_bytes || 0)}</div>
                          <div>
                            Content: {backup.notes_count} notes, {backup.templates_count} templates
                          </div>
                        </div>
                        {backup.expires_at && (
                          <div className="text-xs text-amber-600">
                            Expires: {formatDate(backup.expires_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleRestoreBackup(backup)}
                          disabled={isRestoring}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteBackup(backup)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {backup.encryption_enabled && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                      <Lock className="w-3 h-3" />
                      <span>Encrypted</span>
                    </div>
                  )}
                  
                  {backup.compression_ratio && (
                    <div className="mt-2 text-xs text-gray-500">
                      Compression ratio: {(1 - backup.compression_ratio).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Archive className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backup & Restore</h2>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>
      </div>
    </div>
  );
};