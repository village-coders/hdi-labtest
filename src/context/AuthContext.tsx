import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole, labIdentifier?: string) => Promise<void>;
  isSuperAdminAsLab: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hdi_portal_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuperAdminAsLab, setIsSuperAdminAsLab] = useState<boolean>(() => {
    return localStorage.getItem('hdi_is_superadmin_as_lab') === 'true';
  });

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hdi_portal_token');
      if (savedToken) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
          // If user role is not LAB_USER, clear the impersonation flag
          if (profile?.role !== 'LAB_USER') {
            localStorage.removeItem('hdi_is_superadmin_as_lab');
            setIsSuperAdminAsLab(false);
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('hdi_portal_token');
          localStorage.removeItem('hdi_is_superadmin_as_lab');
          setIsSuperAdminAsLab(false);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    localStorage.removeItem('hdi_is_superadmin_as_lab');
    localStorage.removeItem('hdi_superadmin_original_token');
    setIsSuperAdminAsLab(false);
    const data = await api.login(email, password);
    localStorage.setItem('hdi_portal_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('hdi_portal_token');
    localStorage.removeItem('hdi_is_superadmin_as_lab');
    localStorage.removeItem('hdi_superadmin_original_token');
    setIsSuperAdminAsLab(false);
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: UserRole, labIdentifier?: string) => {
    setIsLoading(true);
    try {
      if (role === 'SUPER_ADMIN') {
        // 1. Try restoring via saved original Super Admin token
        const originalToken = localStorage.getItem('hdi_superadmin_original_token');
        if (originalToken) {
          localStorage.setItem('hdi_portal_token', originalToken);
          localStorage.removeItem('hdi_superadmin_original_token');
          localStorage.removeItem('hdi_is_superadmin_as_lab');
          setToken(originalToken);
          try {
            const me = await api.getCurrentUser();
            setUser(me);
            setIsSuperAdminAsLab(false);
            return;
          } catch {
            // Fallback if token expired
          }
        }

        // 2. Direct server-side revert
        const data = await api.revertToSuperAdmin();
        localStorage.setItem('hdi_portal_token', data.token);
        localStorage.removeItem('hdi_superadmin_original_token');
        localStorage.removeItem('hdi_is_superadmin_as_lab');
        setToken(data.token);
        setUser(data.user);
        setIsSuperAdminAsLab(false);
        return;
      }

      // Switching to a lab session
      if (role === 'LAB_USER') {
        const currentToken = localStorage.getItem('hdi_portal_token');
        if (user?.role === 'SUPER_ADMIN' && currentToken) {
          localStorage.setItem('hdi_superadmin_original_token', currentToken);
        }
        localStorage.setItem('hdi_is_superadmin_as_lab', 'true');
        setIsSuperAdminAsLab(true);

        const data = await api.switchLab(labIdentifier || '');
        localStorage.setItem('hdi_portal_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } catch (err: any) {
      console.error('Error switching session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, isSuperAdminAsLab }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
