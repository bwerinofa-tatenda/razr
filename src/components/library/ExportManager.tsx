// Export Manager Component
// Handles exporting notes to various formats (PDF, DOCX, MD, HTML, JSON)

import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  File,
  Code,
  Globe,
  Database,
  X,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader,
  Eye,
  Share
} from 'lucide-react';
import { ExportJob, advancedLibraryService } from '../../lib/advancedLibraryService';
import { useAuth } from '../../contexts/AuthContext';

interface ExportManagerProps {
  noteIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOptions {
  format: 'pdf' | 'docx' | 'md' | 'html' | 'json';
  includeMetadata: boolean;
  includeComments: boolean;
  includeLinks: boolean;
  includeVersions: boolean;
  pageSize: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  watermark?: string;
}

const ExportManager: React.FC<ExportManagerProps> = ({
  noteIds = [],
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');
  const [selectedNotes, setSelectedNotes] = useState<string[]>(noteIds);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeComments: true,
    includeLinks: true,
    includeVersions: false,
    pageSize: 'A4',
    orientation: 'portrait',
    fontSize: 12,
    includeTableOfContents: true,
    includePageNumbers: true
  });

  useEffect(() => {
    if (isOpen) {
      loadExportHistory();
    }
  }, [isOpen]);

  const loadExportHistory = () => {
    // In a real implementation, this would load from the advanced library service
    setExportJobs([]);
  };

  const handleExport = async () => {
    if (!user || selectedNotes.length === 0) return;

    setIsExporting(true);
    try {
      const job = await advancedLibraryService.createExportJob(
        selectedNotes.length === 1 ? selectedNotes[0] : undefined,
        user.id,
        exportOptions.format,
        exportOptions
      );

      setExportJobs(prev => [job, ...prev]);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to create export job:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <File className="w-5 h-5 text-blue-500" />;
      case 'md':
        return <Code className="w-5 h-5 text-gray-600" />;
      case 'html':
        return <Globe className="w-5 h-5 text-orange-500" />;
      case 'json':
        return <Database className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'PDF Document';
      case 'docx':
        return 'Word Document';
      case 'md':
        return 'Markdown';
      case 'html':
        return 'HTML Page';
      case 'json':
        return 'JSON Data';
      default:
        return format.toUpperCase();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Manager
            </h2>
            {selectedNotes.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Export Notes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Export History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'export' ? (
            <ExportTab
              selectedNotes={selectedNotes}
              onSelectedNotesChange={setSelectedNotes}
              exportOptions={exportOptions}
              onExportOptionsChange={setExportOptions}
              onExport={handleExport}
              isExporting={isExporting}
              getFormatIcon={getFormatIcon}
              getFormatName={getFormatName}
            />
          ) : (
            <HistoryTab
              exportJobs={exportJobs}
              getFormatIcon={getFormatIcon}
              getFormatName={getFormatName}
              getStatusIcon={getStatusIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface ExportTabProps {
  selectedNotes: string[];
  onSelectedNotesChange: (notes: string[]) => void;
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: ExportOptions) => void;
  onExport: () => void;
  isExporting: boolean;
  getFormatIcon: (format: string) => React.ReactNode;
  getFormatName: (format: string) => string;
}

const ExportTab: React.FC<ExportTabProps> = ({
  selectedNotes,
  onSelectedNotesChange,
  exportOptions,
  onExportOptionsChange,
  onExport,
  isExporting,
  getFormatIcon,
  getFormatName
}) => {
  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    onExportOptionsChange({ ...exportOptions, [key]: value });
  };

  const formats = [
    { value: 'pdf', description: 'Portable Document Format - Best for printing and sharing' },
    { value: 'docx', description: 'Microsoft Word Document - Editable format' },
    { value: 'md', description: 'Markdown - Lightweight markup language' },
    { value: 'html', description: 'HTML Page - Web-ready format' },
    { value: 'json', description: 'JSON Data - Structured data format' }
  ];

  return (
    <div className="flex h-full">
      {/* Format Selection */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Format
        </h3>
        
        <div className="space-y-2">
          {formats.map(format => (
            <button
              key={format.value}
              onClick={() => handleOptionChange('format', format.value)}
              className={`w-full text-left p-3 border rounded-lg transition-colors ${
                exportOptions.format === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getFormatIcon(format.value)}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getFormatName(format.value)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Format-specific options */}
        {(exportOptions.format === 'pdf' || exportOptions.format === 'docx') && (
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Layout Options
            </h4>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Page Size
                </label>
                <select
                  value={exportOptions.pageSize}
                  onChange={(e) => handleOptionChange('pageSize', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="A3">A3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Orientation
                </label>
                <select
                  value={exportOptions.orientation}
                  onChange={(e) => handleOptionChange('orientation', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Font Size
                </label>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={exportOptions.fontSize}
                  onChange={(e) => handleOptionChange('fontSize', parseInt(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Content Options */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Content to Include
          </h3>
          
          <div className="space-y-2">
            {[
              { key: 'includeMetadata', label: 'Note metadata (title, date, tags)', value: exportOptions.includeMetadata },
              { key: 'includeComments', label: 'Comments and annotations', value: exportOptions.includeComments },
              { key: 'includeLinks', label: 'Cross-references and links', value: exportOptions.includeLinks },
              { key: 'includeVersions', label: 'Version history', value: exportOptions.includeVersions }
            ].map(option => (
              <label key={option.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={option.value}
                  onChange={(e) => handleOptionChange(option.key as keyof ExportOptions, e.target.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Document Options */}
        {(exportOptions.format === 'pdf' || exportOptions.format === 'docx') && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document Options
            </h3>
            
            <div className="space-y-2">
              {[
                { key: 'includeTableOfContents', label: 'Table of contents', value: exportOptions.includeTableOfContents },
                { key: 'includePageNumbers', label: 'Page numbers', value: exportOptions.includePageNumbers }
              ].map(option => (
                <label key={option.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={option.value}
                    onChange={(e) => handleOptionChange(option.key as keyof ExportOptions, e.target.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </label>
              ))}
              
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Watermark (optional)
                </label>
                <input
                  type="text"
                  value={exportOptions.watermark || ''}
                  onChange={(e) => handleOptionChange('watermark', e.target.value)}
                  placeholder="e.g., Confidential, Draft, etc."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Export Preview */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Preview
          </h3>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Format: {getFormatName(exportOptions.format)}</p>
            <p>Notes: {selectedNotes.length} selected</p>
            <p>Content: {Object.entries(exportOptions).filter(([key, value]) => 
              key.startsWith('include') && value
            ).length} items included</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onExport}
            disabled={isExporting || selectedNotes.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Notes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface HistoryTabProps {
  exportJobs: ExportJob[];
  getFormatIcon: (format: string) => React.ReactNode;
  getFormatName: (format: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatFileSize: (bytes?: number) => string;
  formatDate: (date: string) => string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  exportJobs,
  getFormatIcon,
  getFormatName,
  getStatusIcon,
  formatFileSize,
  formatDate
}) => {
  if (exportJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No exports yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your export history will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {exportJobs.map(job => (
          <div
            key={job.id}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFormatIcon(job.exportType)}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {getFormatName(job.exportType)}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(job.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {job.status}
                    </span>
                  </div>
                  {job.fileSizeBytes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(job.fileSizeBytes)}
                    </p>
                  )}
                </div>
                
                {job.status === 'completed' && job.fileUrl && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => window.open(job.fileUrl, '_blank')}
                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = job.fileUrl!;
                        a.download = job.fileName || 'export';
                        a.click();
                      }}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {job.fileName && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {job.fileName}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExportManager;
