/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { DashboardPage } from './components/DashboardPage';
import { EndpointsPage } from './components/EndpointsPage';
import { FetchPage } from './components/FetchPage';
import { DataBrowserPage } from './components/DataBrowserPage';
import { LogsPage } from './components/LogsPage';
import { UsersPage } from './components/UsersPage';
import LiveLogsPage from './components/LiveLogsPage';
import { LandingPage } from './pages/LandingPage';
import { DocsPage } from './pages/DocsPage';

function DashboardWrapper() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderPage = () => {
    if (user?.restricted_pages?.includes(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">You do not have permission to view this page.</p>
        </div>
      );
    }
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'endpoints':
        return <EndpointsPage />;
      case 'fetch':
        return <FetchPage />;
      case 'data':
        return <DataBrowserPage />;
      case 'logs':
        return <LogsPage />;
      case 'livelogs':
        return <LiveLogsPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}


function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs/*" element={<DocsPage />} />
            <Route path="/dashboard" element={<DashboardWrapper />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
