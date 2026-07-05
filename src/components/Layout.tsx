/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { ReactNode, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  FileJson,
  Moon,
  Sun,
  Github,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'endpoints', label: 'API Endpoints', icon: Settings },
  { id: 'data', label: 'Data Browser', icon: Database },
  { id: 'fetch', label: 'Fetch Data', icon: RefreshCw },
  { id: 'logs', label: 'Fetch Logs', icon: FileJson },
];

import { Users } from 'lucide-react';

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-200">
      {/* Mobile top navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center px-4 justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <Database className="w-4 h-4 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">ThiruXDB</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 lg:inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:block p-6 border-b border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Database className="w-5 h-5 text-white dark:text-gray-900" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">ThiruXDB</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">API Manager</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('users');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'users'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Users & Activity</span>
              </button>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'viewer'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="hidden lg:block p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition mr-1"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Copyright Strip */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              &copy; {new Date().getFullYear()} 
              <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1 ml-1">
                <Github className="w-3.5 h-3.5" /> By ThiruXD
              </a>
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 flex flex-col">
        <div className="p-4 lg:p-8 flex-1">{children}</div>
        
        {/* Mobile Copyright Strip */}
        <div className="lg:hidden p-4 border-t border-gray-200 dark:border-gray-800 text-center mt-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            &copy; {new Date().getFullYear()} 
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-gray-900 dark:hover:text-white transition flex items-center gap-1 ml-1">
              <Github className="w-3.5 h-3.5" /> By ThiruXD
            </a>
          </p>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
