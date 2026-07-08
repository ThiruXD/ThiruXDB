import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { Menu, X, Sun, Moon, ArrowLeft, Github, Database, BookOpen, Layers, Network, RefreshCw, ShieldCheck, Code, Search, ChevronLeft, ChevronRight, Star, GitFork, Check, Copy, Rocket } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGithubStats } from '../hooks/useGithubStats';
import 'highlight.js/styles/atom-one-dark.css'; // Premium dark theme for syntax highlighting

const extractTextFromReactNode = (node: any): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('');
  if (node.props && node.props.children) {
    return extractTextFromReactNode(node.props.children);
  }
  return '';
};

const PreBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const textContent = extractTextFromReactNode(children);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={handleCopy} 
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors border border-zinc-700 shadow-sm"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre {...props} className={className}>
        {children}
      </pre>
    </div>
  );
};


const markdownFiles = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });

type PageDef = { id: string; title: string; icon?: any; subPages?: PageDef[] };

const DOCS_PAGES: PageDef[] = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'architecture', title: 'Architecture & Stack', icon: Layers },
  { 
    id: 'api-gateway', 
    title: 'API Gateway', 
    icon: Network,
    subPages: [
      { id: 'rate-limiting', title: 'Rate Limiting' },
      { id: 'authentication', title: 'Authentication' }
    ]
  },
  { id: 'sync-engine', title: 'Sync Engine', icon: RefreshCw },
  { id: 'security', title: 'Security', icon: ShieldCheck },
  { id: 'deployment', title: 'Deployment', icon: Rocket },
  { id: 'development', title: 'Development & Contributing', icon: Code },
];

// Helper to flatten the DOCS_PAGES for routing and next/prev pagination
const FLATTENED_PAGES = DOCS_PAGES.reduce((acc, page) => {
  acc.push(page);
  if (page.subPages) acc.push(...page.subPages);
  return acc;
}, [] as PageDef[]);

export function DocsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const githubStats = useGithubStats();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentPath = location.pathname.split('/').pop() || 'getting-started';
  const page = FLATTENED_PAGES.find((p) => p.id === currentPath) || FLATTENED_PAGES[0];

  const markdownContent =
    (markdownFiles[`../docs/${page.id}.md`] as string) || '# 404 Not Found\n\nThe requested documentation page could not be found.';

  // Remove H1 since we render it separately as the page title
  const contentWithoutH1 = markdownContent.replace(/^#\s+.*$/m, '');

  const toc = useMemo(() => {
    const matches = Array.from(contentWithoutH1.matchAll(/^(##|###)\s+(.+)$/gm));
    return matches.map((match) => {
      const depth = match[1].length;
      const title = match[2].trim();
      const url = '#' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return { title, url, depth };
    });
  }, [contentWithoutH1]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // ScrollSpy for TOC
  useEffect(() => {
    const handleScroll = () => {
      const headings = Array.from(document.querySelectorAll('main h2, main h3'));
      if (headings.length === 0) return;
      
      let currentActiveId = '';
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top < 150) {
          currentActiveId = heading.id;
        }
      }
      setActiveHeadingId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [markdownContent]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_PAGES;
    const query = searchQuery.toLowerCase();
    
    return DOCS_PAGES.map(p => {
      const pageMatch = p.title.toLowerCase().includes(query);
      const subPagesMatch = p.subPages?.filter(sp => sp.title.toLowerCase().includes(query));
      
      if (pageMatch || (subPagesMatch && subPagesMatch.length > 0)) {
        return {
          ...p,
          subPages: subPagesMatch || p.subPages
        };
      }
      return null;
    }).filter(Boolean) as PageDef[];
  }, [searchQuery]);

  const pageIndex = FLATTENED_PAGES.findIndex(p => p.id === page.id);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 flex flex-col font-sans">
      {/* Fixed Header */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-colors">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-zinc-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Database className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <span className="font-bold text-lg">ThiruXDB Docs</span>
            </Link>
          </div>
          <div className="flex-1" />
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors hidden sm:flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <a href="https://github.com/ThiruXD/ThiruXDB" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> {githubStats.stars}
                </div>
                <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700"></div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" /> {githubStats.forks}
                </div>
              </div>
              <Github className="w-5 h-5 text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" />
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="pt-16 flex-1 flex w-full relative">
        
        {/* Left Sidebar (Fixed Absolute) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 pt-16 transform transition-transform duration-300 ease-in-out lg:translate-x-0 bg-white dark:bg-zinc-950 lg:bg-transparent border-r border-gray-200 dark:border-zinc-800 flex flex-col ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Advanced Search */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="search"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-zinc-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-1 focus:ring-blue-500 rounded-md py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-3 px-2">
              Documentation
            </h4>
            <nav className="flex flex-col space-y-1">
              {filteredPages.map((navPage) => {
                const isActive = page.id === navPage.id;
                return (
                  <div key={navPage.id}>
                    <Link
                      to={`/docs/${navPage.id}`}
                      className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-gray-100 dark:bg-zinc-800/60 font-medium text-gray-900 dark:text-zinc-100'
                          : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {navPage.icon && <navPage.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`} />}
                      {navPage.title}
                    </Link>
                    
                    {/* Sub Pages */}
                    {navPage.subPages && navPage.subPages.length > 0 && (
                      <div className="mt-1 ml-6 flex flex-col space-y-1 border-l border-gray-200 dark:border-zinc-800 pl-2">
                        {navPage.subPages.map((subPage) => {
                          const isSubActive = page.id === subPage.id;
                          return (
                            <Link
                              key={subPage.id}
                              to={`/docs/${subPage.id}`}
                              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                isSubActive
                                  ? 'bg-gray-100 dark:bg-zinc-800/60 font-medium text-gray-900 dark:text-zinc-100'
                                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              {subPage.title}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredPages.length === 0 && (
                <div className="px-2 py-4 text-sm text-gray-500 dark:text-zinc-400">
                  No results found for "{searchQuery}"
                </div>
              )}
            </nav>
            
            {/* Mobile GitHub Stats */}
            <div className="mt-6 border-t border-gray-200 dark:border-zinc-800 pt-4 px-2 lg:hidden">
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

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area (offset by sidebars on desktop) */}
        <main className="flex-1 w-full lg:pl-64 xl:pr-64 min-w-0">
          <div className="max-w-3xl mx-auto py-8 lg:py-12 px-4 md:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-8">
              {page.title}
            </h1>
            
            {/* 
              Tailwind Typography (prose) 
              We remove bg-gray-100 styling from <pre> blocks by excluding them, 
              allowing rehype-highlight to handle the code block styling!
            */}
            <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 [&_:not(pre)>code]:bg-gray-100 dark:[&_:not(pre)>code]:bg-zinc-800/60 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:font-medium [&_:not(pre)>code]:before:content-none [&_:not(pre)>code]:after:content-none prose-pre:bg-[#282c34] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-zinc-800 max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, rehypeHighlight]}
                components={{
                  pre: PreBlock
                }}
              >
                {contentWithoutH1}
              </ReactMarkdown>
            </div>
            
            {/* Pagination / Next Steps */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-stretch">
              {pageIndex > 0 ? (
                <Link 
                  to={`/docs/${FLATTENED_PAGES[pageIndex - 1].id}`}
                  className="group flex flex-col items-start gap-1.5 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md dark:hover:shadow-blue-900/20 flex-1 bg-white dark:bg-zinc-900/30"
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-1 transition-colors group-hover:text-blue-500">
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {FLATTENED_PAGES[pageIndex - 1].title}
                  </span>
                </Link>
              ) : <div className="flex-1" />}
              
              {pageIndex < FLATTENED_PAGES.length - 1 ? (
                <Link 
                  to={`/docs/${FLATTENED_PAGES[pageIndex + 1].id}`}
                  className="group flex flex-col items-end gap-1.5 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md dark:hover:shadow-blue-900/20 flex-1 text-right bg-white dark:bg-zinc-900/30"
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-1 justify-end transition-colors group-hover:text-blue-500">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {FLATTENED_PAGES[pageIndex + 1].title}
                  </span>
                </Link>
              ) : <div className="flex-1" />}
            </div>
          </div>
        </main>

        {/* Right Sidebar (Fixed Absolute) */}
        <aside className="fixed inset-y-0 right-0 z-40 w-64 pt-16 border-l border-gray-200 dark:border-zinc-800 hidden xl:block bg-white dark:bg-zinc-950 lg:bg-transparent pointer-events-none">
          <div className="h-full overflow-y-auto py-8 pl-8 pr-4 pointer-events-auto">
            <h4 className="font-semibold text-sm tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
              On this page
            </h4>
            {toc.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {toc.map((item, index) => (
                  <li key={index} style={{ paddingLeft: `${(item.depth - 2) * 1}rem` }}>
                    <a
                      href={item.url}
                      className={`block border-l-2 py-1 pl-3 transition-all duration-200 ${
                        activeHeadingId === item.url.slice(1)
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                      }`}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-zinc-500">No headings found</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
