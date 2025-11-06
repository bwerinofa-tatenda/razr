import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock User Interface
interface User {
  id: string;
  email: string;
  aud: string;
  role: string;
  created_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for standalone mode - MUST match MOCK_USER_ID in mockServices.ts and mockData.ts
const MOCK_USER: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'demo@tradejournal.ai',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-10-01T10:00:00Z',
  app_metadata: {},
  user_metadata: {
    name: 'Demo User',
    avatar_url: ''
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login as demo user in standalone mode
    setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 500); // Small delay to simulate auth check
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - always succeeds
    setUser(MOCK_USER);
    return { data: { user: MOCK_USER }, error: null };
  };

  const signUp = async (email: string, password: string) => {
    // Mock sign up - always succeeds
    setUser(MOCK_USER);
    return { data: { user: MOCK_USER }, error: null };
  };

  const signOut = async () => {
    // Mock sign out
    setUser(null);
    // Immediately sign back in for demo mode
    setTimeout(() => {
      setUser(MOCK_USER);
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      isConfigured: false // Always false for standalone mode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
