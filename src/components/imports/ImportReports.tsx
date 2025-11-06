import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { importTrades } from '@/utils/api';
import toast from 'react-hot-toast';

interface ParsedTrade {
  position_id: string;
  account_number: string;
  symbol: string;
  trade_type: string;
  volume: number;
  entry_price: number;
  entry_time: string;
  exit_price: number;
  exit_time: string;
  stop_loss: number;
  take_profit: number;
  costs: number;
  pnl: number;
}

interface FileItem {
  file: File;
  status: 'pending' | 'parsing' | 'parsed' | 'error' | 'importing' | 'imported';
  error?: string;
  trades?: ParsedTrade[];
}

export default function ImportReports() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    } else {
      toast.error('Please upload CSV or Excel files only');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map(file => ({
      file,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...fileItems]);
    
    // Start parsing automatically
    fileItems.forEach((item, idx) => {
      parseFile(files.length + idx, item.file);
    });
  };

  const parseFile = async (index: number, file: File) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'parsing' } : f
    ));

    try {
      let trades: ParsedTrade[] = [];

      if (file.name.endsWith('.csv')) {
        trades = await parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        trades = await parseExcel(file);
      }

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'parsed', trades } : f
      ));
      toast.success(`Parsed ${trades.length} trades from ${file.name}`);
    } catch (error: any) {
      console.error('Parse error:', error);
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: error.message } : f
      ));
      toast.error(`Failed to parse ${file.name}: ${error.message}`);
    }
  };

  const parseCSV = (file: File): Promise<ParsedTrade[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const trades = results.data.map((row: any) => mapRowToTrade(row));
            resolve(trades);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(error.message));
        }
      });
    });
  };

  const parseExcel = async (file: File): Promise<ParsedTrade[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          const trades = jsonData.map((row: any) => mapRowToTrade(row));
          resolve(trades);
        } catch (error: any) {
          reject(new Error(error.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const mapRowToTrade = (row: any): ParsedTrade => {
    return {
      position_id: String(row['Position ID'] || row.position_id || `POS-${Date.now()}-${Math.random()}`),
      account_number: String(row['Account Number'] || row.account_number || '12345678'),
      symbol: String(row.Symbol || row.symbol || ''),
      trade_type: String(row.Type || row.type || '').toLowerCase(),
      volume: parseFloat(row.Volume || row.volume || 0),
      entry_price: parseFloat(row['Entry Price'] || row.entry_price || 0),
      entry_time: String(row['Entry Time'] || row.entry_time || new Date().toISOString()),
      exit_price: parseFloat(row['Exit Price'] || row.exit_price || 0),
      exit_time: String(row['Exit Time'] || row.exit_time || new Date().toISOString()),
      stop_loss: parseFloat(row['Stop Loss'] || row.stop_loss || 0),
      take_profit: parseFloat(row['Take Profit'] || row.take_profit || 0),
      costs: parseFloat(row.Costs || row.costs || 0),
      pnl: parseFloat(row['Profit/Loss'] || row.pnl || row.profit_loss || 0)
    };
  };

  const handleImport = async () => {
    const parsedFiles = files.filter(f => f.status === 'parsed' && f.trades);
    
    if (parsedFiles.length === 0) {
      toast.error('No files ready to import');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const allTrades = parsedFiles.flatMap(f => f.trades || []);
    
    // Remove duplicates by position_id
    const uniqueTrades = Array.from(
      new Map(allTrades.map(t => [t.position_id, t])).values()
    );

    // Mark files as importing
    setFiles(prev => prev.map(f => 
      f.status === 'parsed' ? { ...f, status: 'importing' } : f
    ));

    try {
      // Transform parsed trades to database format
      const tradesData = uniqueTrades.map(t => ({
        user_id: user.id,
        account_number: t.account_number,
        position_id: t.position_id,
        asset: t.symbol,
        asset_type: 'FX', // Default to FX, could be enhanced to detect type
        trade_type: t.trade_type,
        size: t.volume,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        time: t.entry_time,
        duration: calculateDuration(t.entry_time, t.exit_time),
        outcome: t.pnl > 0 ? 'win' : 'loss',
        pnl: t.pnl
      }));

      // Import using mock service
      const result = await importTrades(tradesData);

      if (result.success) {
        toast.success(
          `Successfully imported ${result.count} trades${result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}`
        );
        
        // Mark files as imported
        setFiles(prev => prev.map(f => 
          f.status === 'importing' ? { ...f, status: 'imported' } : f
        ));
      } else {
        throw new Error('Import failed');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
      
      // Revert status
      setFiles(prev => prev.map(f => 
        f.status === 'importing' ? { ...f, status: 'parsed' } : f
      ));
    }
  };

  const calculateDuration = (start: string, end: string): string => {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const diffMs = endTime - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} minutes`;
      } else {
        const hours = Math.floor(diffMins / 60);
        return `${hours} hours`;
      }
    } catch {
      return '0 minutes';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const downloadSample = (format: 'csv' | 'xlsx') => {
    const url = format === 'csv' ? '/samples/mt5-sample-trades.csv' : '/samples/mt5-sample-trades.xlsx';
    const link = document.createElement('a');
    link.href = url;
    link.download = `mt5-sample-trades.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'importing':
      case 'parsing':
        return <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
      case 'imported':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'parsing': return 'Parsing...';
      case 'parsed': return 'Ready to import';
      case 'error': return 'Error';
      case 'importing': return 'Importing...';
      case 'imported': return 'Imported';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Files */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Download Sample Files
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Use these templates to format your MT5 trade reports correctly
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadSample('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV Sample
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadSample('xlsx')}>
            <Download className="h-4 w-4 mr-2" />
            Excel Sample
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-normal text-gray-900 dark:text-white">
          Drop files here or click to browse
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Supports CSV and Excel (.xlsx, .xls) files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-normal text-gray-900 dark:text-white">
              Files ({files.length})
            </h3>
            <Button size="sm" variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((item, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getStatusText(item.status)}
                      {item.trades && ` • ${item.trades.length} trades`}
                      {item.error && ` • ${item.error}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  disabled={item.status === 'importing'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Import Button */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleImport}
              disabled={!files.some(f => f.status === 'parsed')}
              className="w-full sm:w-auto"
            >
              Import {files.filter(f => f.status === 'parsed').length > 0 && 
                `(${files.filter(f => f.status === 'parsed').reduce((sum, f) => sum + (f.trades?.length || 0), 0)} trades)`
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
