import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  loading: boolean;
  enableAutoLogout: () => void;
  disableAutoLogout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(false);

  // Auth-Status prüfen
  const checkAuth = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      
      if (!storedToken) {
        setLoading(false);
        return false;
      }

      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setToken(storedToken);
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ Auth-Status: Angemeldet als', data.user.username);
        setLoading(false);
        return true;
      } else {
        // Token ungültig - aufräumen
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ Auth-Status: Nicht angemeldet oder Token ungültig');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Auth-Check Fehler:', error);
      // Bei Fehler ausloggen
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  };

  // Login
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    console.log('✅ AuthContext: Login erfolgreich');
  };

  // Logout
  const logout = async () => {
    try {
      // Server-seitigen Logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('❌ Logout-Fehler:', error);
    } finally {
      // Lokale Daten löschen
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAutoLogoutEnabled(false); // Auto-Logout deaktivieren
      console.log('✅ AuthContext: Logout erfolgreich');
    }
  };

  // Auto-Logout aktivieren (beim Betreten der Admin-Seite)
  const enableAutoLogout = () => {
    setAutoLogoutEnabled(true);
    console.log('🔒 Auto-Logout aktiviert - wird beim Verlassen der Admin-Seite ausgeloggt');
  };

  // Auto-Logout deaktivieren (beim Verlassen der Admin-Seite)
  const disableAutoLogout = () => {
    if (autoLogoutEnabled && isAuthenticated) {
      console.log('🔒 Auto-Logout ausgeführt - Admin-Seite verlassen');
      logout();
    } else {
      setAutoLogoutEnabled(false);
    }
  };

  // Initial auth check beim Laden
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    checkAuth,
    loading,
    enableAutoLogout,
    disableAutoLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
