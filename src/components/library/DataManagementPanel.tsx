import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  HardDrive,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Clock,
  BarChart3,
  Archive,
  Trash2,
  Info
} from 'lucide-react';
import { dataManagementService, type BackupInfo, type ImportSession } from '../../lib/dataManagementService';

interface DataManagementPanelProps {
  onClose: () => void;
}

export const DataManagementPanel: React.FC<DataManagementPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'backup' | 'import' | 'export' | 'validation' | 'optimization' | 'migration'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [importStatus, setImportStatus] = useState<ImportSession | null>(null);
  const [storageAnalysis, setStorageAnalysis] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'markdown' | 'html'>('json');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [backups, sync] = await Promise.all([
        dataManagementService.getBackupHistory(),
        dataManagementService.getSyncStatus()
      ]);
      setBackupHistory(backups);
      setSyncStatus(sync);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (type: 'full' | 'incremental' | 'differential') => {
    setIsLoading(true);
    try {
      await dataManagementService.createBackup(type);
      await loadData();
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!importFile) return;
    
    setIsLoading(true);
    try {
      const sessionId = await dataManagementService.startImport('csv', importFile);
      // Monitor import progress
      const interval = setInterval(async () => {
        const status = await dataManagementService.getImportStatus(sessionId);
        setImportStatus(status);
        if (status?.status === 'completed' || status?.status === 'failed') {
          clearInterval(interval);
          setIsLoading(false);
          await loadData();
        }
      }, 1000);
    } catch (error) {
      console.error('Import failed:', error);
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const exportData = await dataManagementService.exportData(exportFormat, {
        includeContent: true,
        includeMetadata: true
      });
      
      // Create download link
      const blob = new Blob([exportData.data], { type: exportData.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportData.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidation = async () => {
    setIsLoading(true);
    try {
      const results = await dataManagementService.validateDataIntegrity({
        checkDuplicates: true,
        checkCorruptedContent: true,
        checkOrphanedReferences: true,
        validateRelationships: true
      });
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimization = async () => {
    setIsLoading(true);
    try {
      const results = await dataManagementService.optimizeStorage();
      console.log('Optimization results:', results);
      await loadData();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetEncryption = async () => {
    if (!encryptionPassword) return;
    
    setIsLoading(true);
    try {
      await dataManagementService.setEncryptionPassword(encryptionPassword);
      setEncryptionPassword('');
      alert('Encryption password set successfully');
    } catch (error) {
      console.error('Failed to set encryption:', error);
      alert('Failed to set encryption password');
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

  const getBackupStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in_progress': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h2>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'backup', label: 'Backup & Restore', icon: Archive },
            { id: 'import', label: 'Import', icon: Upload },
            { id: 'export', label: 'Export', icon: Download },
            { id: 'validation', label: 'Validation', icon: CheckCircle },
            { id: 'optimization', label: 'Optimization', icon: Zap },
            { id: 'migration', label: 'Migration', icon: RefreshCw }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sync Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {syncStatus ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pending:</span>
                          <Badge variant={syncStatus.pending_operations > 0 ? 'destructive' : 'secondary'}>
                            {syncStatus.pending_operations}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Failed:</span>
                          <Badge variant={syncStatus.failed_operations > 0 ? 'destructive' : 'secondary'}>
                            {syncStatus.failed_operations}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last sync: {syncStatus.last_sync ? formatDate(syncStatus.last_sync) : 'Never'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Backup History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      {backupHistory.length} backups total
                    </div>
                    {backupHistory.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Latest: {formatDate(backupHistory[0].created_at)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">Ready for analysis</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setActiveTab('optimization')}
                    >
                      Analyze Storage
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common data management operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={() => handleCreateBackup('full')}>
                      <Archive className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('import')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('export')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" onClick={handleValidation}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validate Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Backup</CardTitle>
                  <CardDescription>Choose backup type and options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => handleCreateBackup('full')}
                      disabled={isLoading}
                      className="h-20 flex flex-col"
                    >
                      <Archive className="w-6 h-6 mb-2" />
                      Full Backup
                      <span className="text-xs opacity-75">Complete data backup</span>
                    </Button>
                    <Button 
                      onClick={() => handleCreateBackup('incremental')}
                      disabled={isLoading}
                      variant="outline"
                      className="h-20 flex flex-col"
                    >
                      <Clock className="w-6 h-6 mb-2" />
                      Incremental
                      <span className="text-xs opacity-75">Changes only</span>
                    </Button>
                    <Button 
                      onClick={() => handleCreateBackup('differential')}
                      disabled={isLoading}
                      variant="outline"
                      className="h-20 flex flex-col"
                    >
                      <BarChart3 className="w-6 h-6 mb-2" />
                      Differential
                      <span className="text-xs opacity-75">Since last full</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup History</CardTitle>
                  <CardDescription>View and manage your backup history</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-4">Loading backup history...</div>
                  ) : backupHistory.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No backups found</div>
                  ) : (
                    <div className="space-y-3">
                      {backupHistory.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${getBackupStatusColor(backup.status)}`}></div>
                            <div>
                              <div className="font-medium">{backup.backup_type} Backup</div>
                              <div className="text-sm text-gray-500">
                                {formatDate(backup.created_at)} • {formatFileSize(backup.backup_size_bytes || 0)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {backup.notes_count} notes, {backup.templates_count} templates
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {backup.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                Restore
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import Data</CardTitle>
                  <CardDescription>Import data from various file formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select File</label>
                    <input
                      type="file"
                      accept=".csv,.json,.md,.html,.txt"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <Button onClick={handleImportData} disabled={!importFile || isLoading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? 'Importing...' : 'Start Import'}
                  </Button>
                  
                  {importStatus && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Import Progress</span>
                        <Badge variant={importStatus.status === 'completed' ? 'default' : 'secondary'}>
                          {importStatus.status}
                        </Badge>
                      </div>
                      <Progress value={(importStatus.processed_items / importStatus.total_items) * 100} className="mb-2" />
                      <div className="text-sm text-gray-600">
                        {importStatus.processed_items} / {importStatus.total_items} items processed
                      </div>
                      {importStatus.failed_items > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          {importStatus.failed_items} items failed to import
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Export your library data in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="block w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="json">JSON (Complete data)</option>
                      <option value="csv">CSV (Spreadsheet format)</option>
                      <option value="markdown">Markdown (Documentation)</option>
                      <option value="html">HTML (Web page)</option>
                    </select>
                  </div>
                  <Button onClick={handleExportData} disabled={isLoading}>
                    <Download className="w-4 h-4 mr-2" />
                    {isLoading ? 'Exporting...' : 'Export Data'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Validation</CardTitle>
                  <CardDescription>Validate data integrity and detect issues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleValidation} disabled={isLoading}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Run Full Validation
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('optimization')}>
                      <Zap className="w-4 h-4 mr-2" />
                      View Optimization
                    </Button>
                  </div>

                  {validationResults && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{validationResults.summary.total_items}</div>
                            <div className="text-sm text-gray-500">Total Items</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{validationResults.summary.valid_items}</div>
                            <div className="text-sm text-gray-500">Valid Items</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">{validationResults.summary.invalid_items}</div>
                            <div className="text-sm text-gray-500">Issues Found</div>
                          </CardContent>
                        </Card>
                      </div>

                      {validationResults.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Issues Summary</h4>
                          <div className="space-y-2">
                            {validationResults.issues.map((issue: any, index: number) => (
                              <Alert key={index}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  {issue.message} ({issue.count} items)
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Optimization</CardTitle>
                  <CardDescription>Optimize storage usage and improve performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleOptimization} disabled={isLoading}>
                    <Zap className="w-4 h-4 mr-2" />
                    {isLoading ? 'Optimizing...' : 'Run Optimization'}
                  </Button>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Optimization will remove duplicates, compress large content, and archive old data to free up storage space.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Migration</CardTitle>
                  <CardDescription>Migrate data between versions or formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">From Version</label>
                    <select className="block w-full p-2 border border-gray-300 rounded-md">
                      <option value="1.0">Version 1.0</option>
                      <option value="1.1">Version 1.1</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">To Version</label>
                    <select className="block w-full p-2 border border-gray-300 rounded-md">
                      <option value="1.1">Version 1.1</option>
                      <option value="1.2">Version 1.2</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Create backup before migration</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Dry run (preview changes)</span>
                    </label>
                  </div>
                  <Button>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Migration
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};