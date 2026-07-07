import { Link } from 'react-router-dom';
import { Database, ArrowRight, Server, Shield, Zap, Code, Github, Moon, Sun, Terminal, Key, DatabaseBackup, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans selection:bg-gray-300 dark:selection:bg-gray-700 flex flex-col">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTU2LCAxNjMsIDE3NSwgMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center shadow-sm">
              <Database className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">ThiruXDB</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition hidden sm:block">Documentation</Link>
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/dashboard" className="text-sm font-medium px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-sm ml-2">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col">
        {/* Hero Section */}
        <main className="pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium mb-8 shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>v0.1.0 is now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
            The Utilitarian API <br className="hidden md:block" />
            <span className="text-gray-900 dark:text-white">
              Data Aggregation Hub
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Self-host your own data engine. Configure external REST endpoints, automate data fetching into MongoDB, and serve everything through an ultra-fast, rate-limited public API gateway.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/login" className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium flex items-center justify-center gap-2 transition shadow-sm">
              Live Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/docs" className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium flex items-center justify-center transition shadow-sm">
              Read Documentation
            </Link>
          </div>

          <div className="inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-6 py-3 rounded-lg text-sm text-left shadow-sm">
            <p className="font-semibold mb-1">Live Demo Credentials:</p>
            <p>Username: <code className="bg-white dark:bg-zinc-900 px-1 py-0.5 rounded font-mono border border-blue-100 dark:border-blue-700">demo</code></p>
            <p>Password: <code className="bg-white dark:bg-zinc-900 px-1 py-0.5 rounded font-mono border border-blue-100 dark:border-blue-700">demo@123</code></p>
          </div>
        </main>

        {/* Feature Grid */}
        <section className="py-16 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Core Features</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to orchestrate data between your external providers and your internal applications.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <DatabaseBackup className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Automated Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Automatically batch and insert thousands of records simultaneously from external APIs into your MongoDB database at maximum wire speed.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <Code className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Public Gateway</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Expose your aggregated data safely using dynamic API keys with strict short-term rate limits and persistent long-term quota enforcement.</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Robust Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Built-in Role-Based Access Control, session hijacking prevention, dynamic zero-config JWT management via Web Crypto, and granular permissions.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Use ThiruXDB?</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">ThiruXDB is built to solve complex data aggregation workflows across modern applications.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex gap-4 items-start p-4">
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shrink-0">
                <Server className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">API Rate Limit Evasion</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stop hitting rate limits from expensive third-party APIs. Fetch their data once incrementally, store it in ThiruXDB, and serve it directly to your users infinitely.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4">
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shrink-0">
                <Terminal className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Microservice Backend</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use ThiruXDB as a headless CMS or direct database proxy for your frontend. It provides secure pagination, filtering, and querying out of the box.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4">
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shrink-0">
                <Key className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Data Monetization</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Easily package your gathered data and sell access to it by generating API keys with strict time expirations and quota limits.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4">
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shrink-0">
                <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Internal Tooling</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Give your non-technical team a clean UI to browse, filter, and export data without needing direct MongoDB database access.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contributing & Credits */}
        <section className="py-16 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contributing</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              ThiruXDB is an open-source project. We welcome contributions from the community! Whether it's reporting a bug, proposing a feature, or submitting a Pull Request, your input is highly valued.
            </p>
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:underline">
              <Github className="w-4 h-4" /> View Repository
            </a>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Credits</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              ThiruXDB was conceptualized and developed by ThiruXD. It leverages incredible open-source tools including React, TailwindCSS, Express.js, MongoDB, and the Bun runtime. The UI is deeply inspired by the utilitarian aesthetics of Frappe UI.
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-900 dark:text-white" />
            <span className="font-semibold text-gray-900 dark:text-white">ThiruXDB</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} ThiruXD. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Docs</Link>
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
