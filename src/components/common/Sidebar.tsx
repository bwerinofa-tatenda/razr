import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  MessageSquare,
  Download,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Trades', href: '/trades', icon: TrendingUp },
    { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Advanced Library', href: '/library-advanced', icon: BookOpen, isNew: true },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Imports & Connections', href: '/imports-connections', icon: Download },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden lg:block fixed top-0 left-0 h-screen w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Sidebar Header */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <Link to="/dashboard" className="flex items-center">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          <span className="ml-3 text-lg font-normal text-gray-900 dark:text-white">
            TradeJournal AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-normal transition-colors ${
                active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className={`h-5 w-5 mr-3 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              {item.name}
              {item.isNew && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <p className="font-normal mb-1">TradeJournal AI</p>
          <p>Track & improve trading</p>
        </div>
      </div>
    </aside>
  );
}
