import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Search, ChevronRight, Menu, X, Github, BookOpen, Key, Terminal, Shield, Moon, Sun, Code, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';

// Load all markdown files as raw strings
const markdownFiles = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });

const DOCS_PAGES = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'architecture', title: 'Architecture & Stack', icon: Cpu },
  { id: 'api-gateway', title: 'API Gateway', icon: Key },
  { id: 'sync-engine', title: 'Sync Engine', icon: Terminal },
  { id: 'security', title: 'Security', icon: Shield },
  { id: 'development', title: 'Development & Contributing', icon: Code },
];

export function DocsPage() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { id: string; title: string; snippet: string }[] = [];

    DOCS_PAGES.forEach(page => {
      const content = markdownFiles[`../docs/${page.id}.md`] as string || '';
      
      if (page.title.toLowerCase().includes(query)) {
        results.push({ id: page.id, title: page.title, snippet: 'Matches title' });
        return;
      }
      
      const index = content.toLowerCase().indexOf(query);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + query.length + 30);
        const snippet = content.substring(start, end).replace(/\n/g, ' ');
        results.push({ id: page.id, title: page.title, snippet: `...${snippet}...` });
      }
    });
    
    return results;
  }, [searchQuery]);

  const currentPath = location.pathname.split('/').pop() || 'getting-started';
  const validPath = DOCS_PAGES.find(p => p.id === currentPath) ? currentPath : 'getting-started';

  // Find the content
  const markdownContent = (markdownFiles[`../docs/${validPath}.md`] as string) || '# 404 Not Found\n\nThe requested documentation page could not be found.';

  // Extract headings for Table of Contents
  const headings = useMemo(() => {
    const slugger = new GithubSlugger();
    const result: { id: string; text: string; level: number }[] = [];
    const lines = markdownContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const text = match[2].trim();
        const level = match[1].length;
        const id = slugger.slug(text);
        result.push({ id, text, level });
      }
    }
    return result;
  }, [markdownContent]);

  // Track active heading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66% 0px' }
    );

    const elements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [headings, location.pathname]);

  // Next page for footer navigation
  const currentIndex = DOCS_PAGES.findIndex(p => p.id === validPath);
  const nextPage = currentIndex >= 0 && currentIndex < DOCS_PAGES.length - 1 ? DOCS_PAGES[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-gray-200 dark:selection:bg-gray-800 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 md:px-6">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden mr-4 text-gray-600 dark:text-gray-400">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2 mr-6 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded flex items-center justify-center shadow-sm">
              <Database className="w-3 h-3 text-white dark:text-gray-900" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">ThiruXDB</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium ml-2 hidden sm:block">Docs</span>
          </Link>

          <div className="flex-1 flex items-center justify-between">
            <div className="w-full max-w-md hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search documentation..."
                className="w-full bg-gray-100 dark:bg-zinc-900 border-none rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
              />
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(res => (
                        <Link 
                          key={res.id} 
                          to={`/docs/${res.id}`}
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                          className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{res.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{res.snippet}</div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition hidden sm:block">Live Demo</Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start w-full max-w-8xl mx-auto px-4 md:px-6 relative">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 pt-14 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] overflow-y-auto`}>
          <div className="p-4 space-y-1">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 px-2 mt-4">Overview</h4>
            {DOCS_PAGES.map(page => {
              const isActive = validPath === page.id;
              return (
                <Link
                  key={page.id}
                  to={`/docs/${page.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors ${isActive
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <page.icon className="w-4 h-4" />
                  {page.title}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 md:pl-10 md:pr-6 lg:pr-10 lg:pl-12">
          <article className="prose prose-slate dark:prose-invert max-w-3xl w-full prose-headings:font-bold prose-a:text-gray-900 dark:prose-a:text-white prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-800 prose-pre:shadow-sm prose-pre:text-gray-900 dark:prose-pre:text-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
              {markdownContent}
            </ReactMarkdown>
          </article>

          {nextPage && (
            <div className="mt-12 max-w-3xl flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-800">
              <div />
              <Link to={`/docs/${nextPage.id}`} className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 font-medium border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-md transition-colors shadow-sm bg-white dark:bg-zinc-900">
                Next: {nextPage.title} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </main>

        {/* Right Sidebar (Table of Contents - Fumadocs Style) */}
        <aside className="hidden xl:block w-56 shrink-0 pt-14 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto pl-8">
          <div className="py-8">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">On this page</h4>
            {headings.length > 0 ? (
              <div className="border-l border-gray-200 dark:border-gray-800 flex flex-col">
                <ul className="text-sm">
                  {headings.map(h => {
                    const isActive = activeId === h.id;
                    return (
                      <li key={h.id}>
                        <a 
                          href={`#${h.id}`}
                          className={`block py-1.5 pr-2 -ml-[1px] border-l transition-colors ${
                            h.level === 3 ? 'pl-8' : 'pl-4'
                          } ${
                            isActive 
                              ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium' 
                              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {h.text}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">No sections</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
