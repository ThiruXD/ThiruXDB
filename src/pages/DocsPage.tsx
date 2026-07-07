import { useState } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Database, Search, ChevronRight, Menu, X, Github, BookOpen, Key, Terminal, Shield, Moon, Sun, Code, Cpu, LayoutTemplate } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const location = useLocation();

  const currentPath = location.pathname.split('/').pop() || 'getting-started';

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
                placeholder="Search documentation..."
                className="w-full bg-gray-100 dark:bg-zinc-900 border-none rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
              />
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
              const isActive = currentPath === page.id || (currentPath === 'docs' && page.id === 'getting-started');
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
          <Routes>
            <Route path="/" element={<GettingStartedContent />} />
            <Route path="/getting-started" element={<GettingStartedContent />} />
            <Route path="/architecture" element={<ArchitectureContent />} />
            <Route path="/api-gateway" element={<ApiGatewayContent />} />
            <Route path="/sync-engine" element={<SyncEngineContent />} />
            <Route path="/security" element={<SecurityContent />} />
            <Route path="/development" element={<DevelopmentContent />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Sub-pages content

function GettingStartedContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Getting Started</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        ThiruXDB is a powerful, self-hosted API data aggregation hub. It allows you to consume data from any REST API, structure it into MongoDB, and serve it blazingly fast through a public gateway.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-10 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">What does it solve?</h2>
      <p>Modern applications frequently rely on third-party APIs (e.g., weather data, stock prices, anime databases, ecommerce product catalogs). However, fetching directly from these APIs in production introduces significant issues:</p>
      <ul>
        <li><strong>Strict Rate Limits:</strong> You might be limited to 60 requests per minute.</li>
        <li><strong>High Latency:</strong> Waiting for the 3rd party API delays your own app's response.</li>
        <li><strong>No Querying:</strong> Many APIs don't offer advanced filtering, sorting, or pagination.</li>
      </ul>
      <p><strong>ThiruXDB solves this.</strong> You configure the endpoint in ThiruXDB. ThiruXDB runs a sync job to pull the data into your own MongoDB. You then serve this data to your users instantly, with built-in querying, and without ever hitting the 3rd party API limits.</p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-10 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Quick Setup</h2>
      <pre className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 p-4 rounded-lg overflow-x-auto text-sm my-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <code className="language-bash">
          # Clone the repository{'\n'}
          git clone https://github.com/ThiruXD/ThiruXDB.git{'\n'}
          cd ThiruXDB{'\n'}
          {'\n'}
          # Install dependencies using Bun{'\n'}
          bun install{'\n'}
          {'\n'}
          # Setup Environment Variables{'\n'}
          cp .env.example .env{'\n'}
          # Edit .env with your MongoDB URI{'\n'}
          {'\n'}
          # Start the development server{'\n'}
          bun run dev
        </code>
      </pre>

      <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
        <div />
        <Link to="/docs/architecture" className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 font-medium border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-md transition-colors shadow-sm bg-white dark:bg-slate-900">
          Next: Architecture & Stack <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}

function ArchitectureContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Architecture & Stack</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Understanding how ThiruXDB is built end-to-end to ensure high performance and maintainability.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Technology Stack</h2>
      <ul className="list-disc pl-5">
        <li><strong>Frontend:</strong> React 18, TypeScript, Vite.</li>
        <li><strong>Styling:</strong> Tailwind CSS (Frappe UI design principles), Lucide Icons.</li>
        <li><strong>Backend:</strong> Node.js, Express.js.</li>
        <li><strong>Database:</strong> MongoDB (native Node driver for maximum performance).</li>
        <li><strong>Security:</strong> `jose` (Web Crypto JWTs), `bcryptjs` (Hashing), `express-rate-limit`.</li>
        <li><strong>Package Manager & Runtime:</strong> Bun (for ultra-fast local development and package resolution).</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Monolithic Architecture</h2>
      <p>ThiruXDB operates as a seamless monolith to simplify deployment across serverless platforms like Netlify and Render.</p>

      <div className="my-6 border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-slate-50 dark:bg-slate-900 text-sm overflow-x-auto font-mono text-slate-800 dark:text-slate-300">
        <pre className="m-0">
          ├── /src                # React Frontend (Dashboard, Docs, Landing){'\n'}
          │   ├── /components     # UI components (Frappe aesthetic){'\n'}
          │   ├── /pages          # Top level public routing pages{'\n'}
          │   └── /context        # Global state (Theme, Auth){'\n'}
          ├── /server             # Express Backend API{'\n'}
          │   ├── /routes         # API endpoints (auth, endpoints, fetch, gateway){'\n'}
          │   ├── app.js          # Core Express application{'\n'}
          │   └── index.js        # Serverless / Local entry point{'\n'}
          └── netlify.toml        # Serverless function configuration{'\n'}
        </pre>
      </div>

      <p>During a build, Vite compiles the `/src` React app into static assets in `/dist`. The Express backend serves these static files on the root `/` route, while all `/api/*` routes are handled by the backend logic. This ensures that the application can be hosted entirely on a single domain without CORS issues.</p>
    </article>
  );
}

function ApiGatewayContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Public API Gateway</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Once your data is synced into MongoDB, you can serve it to your frontend applications using the Public API Gateway.
      </p>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">Generating API Keys</h2>
      <p className="text-slate-600 dark:text-slate-400">
        Navigate to the <strong>System Security</strong> tab in the Dashboard. Here you can generate new API keys with specific:
      </p>
      <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1 mb-6">
        <li><strong>Rate Limits:</strong> Limit requests per second, minute, or hour.</li>
        <li><strong>Quotas:</strong> Limit total requests per day, week, or month.</li>
        <li><strong>Expirations:</strong> Auto-expire keys after a set duration.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">Using the Gateway</h2>
      <p className="text-slate-600 dark:text-slate-400">Make a GET request to the gateway endpoint, passing your API key in the headers:</p>
      <pre className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 p-4 rounded-lg overflow-x-auto text-sm my-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <code>
          GET /api/v1/public/thiruxdb_data_records?_page=1&_limit=20{'\n'}
          Authorization: Bearer txdb_key_XXXXXXXXXXXXXXXXXXXX
        </code>
      </pre>

      <div className="bg-slate-100 dark:bg-slate-800 border-l-4 border-slate-500 p-4 my-6 rounded-r-md">
        <p className="text-sm text-slate-800 dark:text-slate-300 m-0"><strong>Pro Tip:</strong> You can pass dynamic MongoDB filters directly in the URL! For example, `?status=active&category=shoes` automatically translates to a MongoDB query.</p>
      </div>
    </article>
  );
}

function SyncEngineContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Sync Engine</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        The Sync Engine is responsible for pulling data from your endpoints and intelligently upserting it into your database.
      </p>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">How it works</h2>
      <p className="text-slate-600 dark:text-slate-400">
        When a sync is triggered:
      </p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>The backend queries the endpoint configuration, including HTTP headers and JSON extraction paths.</li>
        <li>An asynchronous `fetch` request is made to the external provider.</li>
        <li>The engine parses the response array and prepares a massive MongoDB `bulkWrite` operation.</li>
        <li>Records are `upserted` (Insert if new, Update if exists) matching on a unique identifier defined in your configuration. This prevents duplicates.</li>
      </ol>
    </article>
  );
}

function SecurityContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Security Overview</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Security is a first-class citizen in ThiruXDB.
      </p>
      <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2 mb-6">
        <li><strong>Zero-Config JWTs:</strong> ThiruXDB uses the Node `jose` library to automatically generate, encrypt, and manage a secure JWT Secret Key using the Web Crypto API. No `.env` secrets required for JWT signing.</li>
        <li><strong>Session Hijacking Prevention:</strong> Every JWT is cryptographically bound to the user's browser `User-Agent`. If a token is stolen and used on another device, it is instantly rejected.</li>
        <li><strong>Role-Based Access Control:</strong> Native support for `admin`, `editor`, and `viewer` roles, with page-level restrictions available per user.</li>
      </ul>
    </article>
  );
}

function DevelopmentContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Development & Contributing</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Whether you are a developer looking to extend ThiruXDB or just looking to understand the codebase, this guide covers the core workflow.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Local Development Workflow</h2>
      <p>ThiruXDB uses `bun` to run both the React frontend and the Express backend simultaneously during development.</p>

      <pre className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 p-4 rounded-lg overflow-x-auto text-sm my-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <code className="language-bash">
          bun run dev
        </code>
      </pre>
      <p>This command runs `bun run dev:server & bun run dev:client`. The frontend runs on `localhost:5173` and the API runs on `localhost:3000`. The Vite config automatically proxies `/api` requests to the backend.</p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Modifying the Database Schema</h2>
      <p>ThiruXDB uses the native `mongodb` driver. Because there are no rigid ORMs (like Mongoose or Prisma), modifying collections is as simple as inserting new fields. All collections use the `thiruxdb_` prefix.</p>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Contributing Guidelines</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li><strong>Fork the repository</strong> and create your feature branch (`git checkout -b feature/AmazingFeature`).</li>
        <li><strong>Adhere to Frappe UI design principles.</strong> Use neutral grays, subtle borders (`border-gray-200`), and minimalist elements. Avoid vibrant colors or heavy drop-shadows.</li>
        <li><strong>Keep the bundle small.</strong> Do not install heavy dependencies unless strictly necessary.</li>
        <li><strong>Commit your changes</strong> (`git commit -m 'Add some AmazingFeature'`).</li>
        <li><strong>Push to the branch</strong> and open a Pull Request!</li>
      </ol>
    </article>
  );
}

// Icons for the content
function SettingsIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function RefreshIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
}
