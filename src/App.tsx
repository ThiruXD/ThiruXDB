/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: Data Synchronization Engine
 */
import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { DashboardPage } from './components/DashboardPage';
import { EndpointsPage } from './components/EndpointsPage';
import { FetchPage } from './components/FetchPage';
import { DataBrowserPage } from './components/DataBrowserPage';
import { LogsPage } from './components/LogsPage';
import { UsersPage } from './components/UsersPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
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
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
