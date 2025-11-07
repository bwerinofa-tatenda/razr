import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeMockData } from './lib/mockServices';
import MockModeBanner from './components/common/MockModeBanner';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import TradeForm from './pages/TradeForm';

import ImportsConnections from './pages/ImportsConnections';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    try {
      console.log('🚀 TradeJournal AI starting...');
      // Initialize mock data for standalone mode
      initializeMockData();
      console.log('✅ Mock data initialized');
    } catch (error) {
      console.error('❌ Error initializing mock data:', error);
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  try {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mock Mode Banner */}
        <MockModeBanner />
        
        <Sidebar />
        
        {/* Main content area with responsive margin for sidebar */}
        <div className="lg:ml-60">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/trades/new" element={<TradeForm />} />
              <Route path="/trades/:id" element={<TradeForm />} />

              <Route path="/imports-connections" element={<ImportsConnections />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ AppContent render error:', error);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Application Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There was an error loading the TradeJournal AI application.
          </p>
          <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
            {error instanceof Error && error.stack && (
              <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                {error.stack}
              </pre>
            )}
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

export default App;
