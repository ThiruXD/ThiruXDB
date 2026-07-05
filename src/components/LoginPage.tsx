/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Database, Github } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm shadow-gray-900/10 dark:shadow-white/10">
              <Database className="w-8 h-8 text-white dark:text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome To ThiruXDB</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-11 pr-4 text-gray-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-11 pr-4 text-gray-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
            lets make fun with ThiruXDB!
          </p>
        </div>

        {/* Copyright Strip */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
          <p>&copy; {new Date().getFullYear()} ThiruXD. All rights reserved.</p>
          <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition">
            <Github className="w-4 h-4" />
            <span>ThiruXDB on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
