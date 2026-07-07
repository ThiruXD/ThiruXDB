/**
 * Project: ThiruXDB
 * Author: ThiruXD
 * Description: A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/database';

interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  restricted_pages?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: SessionUser | null;
  login: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'thiruxdb_jwt';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ id: data.id, username: data.username, role: data.role, restricted_pages: data.restricted_pages });
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{success: boolean, error?: string}> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        return { success: false, error: `Failed to parse response: ${res.status} ${res.statusText}` };
      }

      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser({ id: data.user.id, username: data.user.username, role: data.user.role, restricted_pages: data.user.restricted_pages });
        return { success: true };
      }
      return { success: false, error: data?.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
