import React, { useState } from 'react';
import { Info, X, Database } from 'lucide-react';

export default function MockModeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Database className="w-5 h-5 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">DEMO MODE</span>
            <span className="hidden sm:inline text-white/90">•</span>
            <span className="text-sm text-white/90">
              Using mock data with local storage persistence. All features fully functional.
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
