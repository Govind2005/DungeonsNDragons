import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (credential: string) => Promise<void>;
  signUp: () => Promise<void>;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure predefined data exists in localStorage for match testing
    if (!localStorage.getItem('rpg_users')) {
      localStorage.setItem('rpg_users', JSON.stringify(PREDEFINED_USERS));
      localStorage.setItem('rpg_profiles', JSON.stringify(PREDEFINED_PROFILES));
    }

    const savedUser = localStorage.getItem('rpg_user');
    const savedToken = localStorage.getItem('rpg_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else {
      // Clear out any old mock user data from previous implementation
      localStorage.removeItem('rpg_user');
      localStorage.removeItem('rpg_token');
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, []);

  const signIn = async (credential: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credential }),
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      const loggedInUser: User = {
        id: data.playerId,
        email: data.email,
        user_metadata: {
          username: data.username
        }
      };

      setUser(loggedInUser);
      localStorage.setItem('rpg_user', JSON.stringify(loggedInUser));
      localStorage.setItem('rpg_token', data.token);
      setToken(data.token);

      // Ensure a profile exists for this new user so the game doesn't crash when loading leaderboards/profiles
      const profiles = JSON.parse(localStorage.getItem('rpg_profiles') || '[]');
      if (!profiles.find((p: any) => p.id === loggedInUser.id)) {
        profiles.push({
          id: loggedInUser.id,
          username: loggedInUser.user_metadata?.username,
          level: 1,
          xp: 0,
          total_wins: 0,
          total_losses: 0,
        });
        localStorage.setItem('rpg_profiles', JSON.stringify(profiles));
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Could not connect to the authentication server. Please ensure the backend is running at http://localhost:8080.');
      }
      throw error;
    }
  };

  const signUp = async () => {
    throw new Error('Sign up is disabled');
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rpg_user');
    localStorage.removeItem('rpg_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
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
