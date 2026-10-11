import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiRequest } from '../lib/api';

export type UserRole = 'PORTFOLIO_MANAGER' | 'DEVELOPER' | 'EXECUTIVE' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  employeeId?: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  canCreatePortfolio: boolean;
  canEditPortfolio: (ownerId?: string) => boolean;
}

const DEMO_PERSONAS: Record<UserRole, { email: string; token: string }> = {
  PORTFOLIO_MANAGER: { email: 'pm@sepms.local', token: 'test-pm-token' },
  DEVELOPER: { email: 'dev@sepms.local', token: 'test-dev-token' },
  EXECUTIVE: { email: 'exec@sepms.local', token: 'test-exec-token' },
  ADMIN: { email: 'admin@sepms.local', token: 'test-admin-token' }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sepms_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    async function loadUserSession() {
      setIsLoading(true);

      const storedToken = localStorage.getItem('sepms_auth_token');

      // 1. If real Supabase is configured and no override token exists
      if (isSupabaseConfigured && supabase && (!storedToken || !storedToken.startsWith('test-'))) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            localStorage.setItem('sepms_auth_token', session.access_token);
            setToken(session.access_token);
            const profile = await apiRequest<UserProfile>('/auth/me');
            setUser(profile);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Failed to restore Supabase session:', err);
        }
      }

      // 2. If stored token exists (e.g. test persona token or saved session)
      if (storedToken) {
        try {
          const profile = await apiRequest<UserProfile>('/auth/me');
          setUser(profile);
          setToken(storedToken);
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn('Session expired or backend offline:', err);
          localStorage.removeItem('sepms_auth_token');
          setToken(null);
          setUser(null);
        }
      }

      // Default initial state: logged in as Portfolio Manager for seamless demonstration
      try {
        const defaultPersona = DEMO_PERSONAS.PORTFOLIO_MANAGER;
        localStorage.setItem('sepms_auth_token', defaultPersona.token);
        setToken(defaultPersona.token);
        const profile = await apiRequest<UserProfile>('/auth/me');
        setUser(profile);
      } catch (err) {
        console.warn('Could not connect to backend API for initial profile load:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    // Check if matching a demo persona
    const personaEntry = Object.values(DEMO_PERSONAS).find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (personaEntry) {
      localStorage.setItem('sepms_auth_token', personaEntry.token);
      setToken(personaEntry.token);
      const profile = await apiRequest<UserProfile>('/auth/me');
      setUser(profile);
      setIsLoading(false);
      return;
    }

    // Try live Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        throw new Error(error.message);
      }
      if (data.session) {
        localStorage.setItem('sepms_auth_token', data.session.access_token);
        setToken(data.session.access_token);
        const profile = await apiRequest<UserProfile>('/auth/me');
        setUser(profile);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    throw new Error('Invalid email or password. For demo personas, use: pm@sepms.local, dev@sepms.local, exec@sepms.local, or admin@sepms.local');
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('sepms_auth_token');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (role: UserRole) => {
    setIsLoading(true);
    const persona = DEMO_PERSONAS[role];
    localStorage.setItem('sepms_auth_token', persona.token);
    setToken(persona.token);
    try {
      const profile = await apiRequest<UserProfile>('/auth/me');
      setUser(profile);
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePortfolio = user?.role === 'PORTFOLIO_MANAGER' || user?.role === 'ADMIN';

  const canEditPortfolio = (ownerId?: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (ownerId && user.id === ownerId) return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchPersona,
        canCreatePortfolio,
        canEditPortfolio
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
