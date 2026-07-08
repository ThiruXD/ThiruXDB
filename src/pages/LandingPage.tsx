import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, ArrowRight, Server, Shield, Zap, Code, Github, Moon, Sun, Terminal, Key, DatabaseBackup, Users, Activity, RefreshCw, Webhook, Briefcase, Rocket, Laptop, Star, GitFork, Menu, X, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGithubStats } from '../hooks/useGithubStats';

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const githubStats = useGithubStats();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans selection:bg-gray-300 dark:selection:bg-gray-700 flex flex-col">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTU2LCAxNjMsIDE3NSwgMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center shadow-sm">
                <Database className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight hidden sm:block">ThiruXDB</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition flex items-center gap-1.5"><Zap className="w-4 h-4" /> Features</a>
            <a href="#use-cases" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Use Cases</a>
            <a href="#audience" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition flex items-center gap-1.5"><Users className="w-4 h-4" /> Audience</a>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/docs" className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-md transition hidden md:flex items-center gap-1.5 shadow-sm">
              <BookOpen className="w-4 h-4" /> Docs
            </Link>
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> {githubStats.stars}
                </div>
                <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700"></div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" /> {githubStats.forks}
                </div>
              </div>
              <Github className="w-5 h-5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition" />
            </a>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 pt-16 transform transition-transform duration-300 ease-in-out md:hidden bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-2 px-2 mt-2">
            Navigation
          </h4>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors"><Zap className="w-4 h-4" /> Features</a>
          <a href="#use-cases" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors"><Briefcase className="w-4 h-4" /> Use Cases</a>
          <a href="#audience" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors"><Users className="w-4 h-4" /> Audience</a>
          
          <div className="my-1"></div>
          <Link to="/docs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/40 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors shadow-sm">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Docs
          </Link>
          
          <div className="mt-4 border-t border-gray-200 dark:border-zinc-800 pt-4 px-2">
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              <Github className="w-4 h-4" /> GitHub Repository
            </a>
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-900 px-3 py-2.5 rounded-md border border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-gray-600 dark:text-zinc-300" /> 
                <span className="text-gray-700 dark:text-zinc-200">{githubStats.stars}</span> Stars
              </div>
              <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700"></div>
              <div className="flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-gray-600 dark:text-zinc-300" /> 
                <span className="text-gray-700 dark:text-zinc-200">{githubStats.forks}</span> Forks
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col pt-16">
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
        </main>

        {/* Feature Grid */}
        <section id="features" className="py-16 border-t border-gray-200 dark:border-gray-800 scroll-mt-16">
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

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <Activity className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Built-in Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Monitor all incoming and outgoing API traffic natively without needing external tracking software. Get granular logs directly from the dashboard.</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <RefreshCw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hot Reload Configs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Any changes to endpoints, API keys, or settings take effect immediately. No need to restart the server or wait for costly build steps.</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-5 border border-gray-200 dark:border-gray-700">
                <Webhook className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Flexible Integrations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Map nested JSON structures seamlessly. ThiruXDB's sync engine traverses deep into arrays to extract exactly the data you need from any provider.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="py-16 border-t border-gray-200 dark:border-gray-800 scroll-mt-16">
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

        {/* Who is this for */}
        <section id="audience" className="py-16 border-t border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/10 -mx-6 px-6 scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Who is this for?</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">ThiruXDB is crafted for developers and teams who want complete ownership of their data streams.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Laptop className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Frontend Developers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stop writing complex backend proxy logic. Let ThiruXDB fetch external data so you can just query your own fast API gateway.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Indie Hackers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build products faster without worrying about 3rd-party API rate limits crippling your app during sudden traffic spikes.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Agencies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Provide clients with a clean, restricted dashboard to view data logs without giving them raw database access.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Data Engineers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automate cron-job based polling of multiple distinct APIs and consolidate them into a single MongoDB structure reliably.</p>
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
