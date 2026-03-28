import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PREDEFINED_USERS: User[] = [
  { id: 'u1', email: 'player1@rpg.com', user_metadata: { username: 'player1' } },
  { id: 'u2', email: 'player2@rpg.com', user_metadata: { username: 'player2' } },
  { id: 'u3', email: 'player3@rpg.com', user_metadata: { username: 'player3' } },
  { id: 'u4', email: 'player4@rpg.com', user_metadata: { username: 'player4' } },
];

const PREDEFINED_PROFILES = PREDEFINED_USERS.map(u => ({
  id: u.id,
  username: u.user_metadata?.username,
  level: 1,
  xp: 0,
  total_wins: 0,
  total_losses: 0,
}));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure predefined data exists in localStorage
    if (!localStorage.getItem('rpg_users')) {
      localStorage.setItem('rpg_users', JSON.stringify(PREDEFINED_USERS));
      localStorage.setItem('rpg_profiles', JSON.stringify(PREDEFINED_PROFILES));
    }

    const savedUser = localStorage.getItem('rpg_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login player1 by default
      const player1 = PREDEFINED_USERS[0];
      setUser(player1);
      localStorage.setItem('rpg_user', JSON.stringify(player1));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, _password: string) => {
    const users = JSON.parse(localStorage.getItem('rpg_users') || '[]');
    const user = users.find((u: any) => u.user_metadata.username === username);
    
    if (!user) {
      throw new Error('User not found');
    }

    setUser(user);
    localStorage.setItem('rpg_user', JSON.stringify(user));
  };

  const signUp = async () => {
    throw new Error('Sign up is disabled');
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('rpg_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
