import { useState } from 'react';
import { User, Lock, Zap } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

export function LoginScreen({ onLogin, onSignUp }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        await onSignUp(email, password, username);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 blur-3xl rounded-full"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-lime-300 italic mb-2">
            DUNGEONS &
          </h1>
          <h1 className="text-5xl font-black text-lime-300 italic">
            DRAGONS
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 mx-auto mt-4"></div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-500/20 via-cyan-500/20 to-red-500/20 blur-xl"></div>

          <div className="relative bg-slate-900/90 backdrop-blur-sm border-l-4 border-lime-400 p-8">
            <div className="flex items-center gap-3 mb-8">
              <User className="w-6 h-6 text-lime-400" />
              <h2 className="text-white font-bold text-xl tracking-wider italic">
                PLAYER ACCESS
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-lime-400 text-xs font-bold tracking-widest mb-2">
                    USERNAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ENTER IDENTITY"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-800/50 border-2 border-slate-700 focus:border-lime-400 text-white px-4 py-3 outline-none transition-colors placeholder:text-slate-600 placeholder:italic"
                      required={isSignUp}
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-lime-400 text-xs font-bold tracking-widest mb-2">
                  {isSignUp ? 'EMAIL' : 'USERNAME'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="ENTER IDENTITY"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border-2 border-slate-700 focus:border-lime-400 text-white px-4 py-3 outline-none transition-colors placeholder:text-slate-600 placeholder:italic"
                    required
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-lime-400 text-xs font-bold tracking-widest mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border-2 border-slate-700 focus:border-lime-400 text-white px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lime-400 hover:bg-lime-300 text-black font-black text-lg py-4 flex items-center justify-center gap-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Zap className="w-5 h-5" />
                <span className="tracking-wider">{loading ? 'LOADING...' : isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-cyan-400 hover:text-cyan-300 text-sm font-semibold tracking-wide transition-colors"
              >
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-500 text-xs tracking-widest font-mono">
            ESTABLISHED MCMLXXIV
          </p>
        </div>
      </div>
    </div>
  );
}
