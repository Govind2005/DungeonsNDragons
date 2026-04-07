import { useState } from 'react';
import { Wifi, LogOut, Zap, Copy, Check } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

export function LobbyJoinScreen({ onNavigateTo }: { onNavigateTo: (screen: string) => void }) {
  const { createRoom, joinRoom, currentRoom, connectionError, isConnected } = useGame();
  const { user, token } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createRoom(token);
      setMode('choose');
      onNavigateTo('lobby-waiting');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!token || !user || !joinCode.trim()) {
      setError('Please enter a party code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinRoom(joinCode.toUpperCase(), user.id, user.user_metadata?.username || 'Player', null, token);
      setMode('choose');
      onNavigateTo('lobby-waiting');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    if (currentRoom?.roomCode) {
      navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] relative overflow-hidden font-mono">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,150,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Atmospheric glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-lime-400/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 font-black text-sm tracking-widest italic">KINETIC VOID</span>
            </div>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-slate-300 font-bold tracking-widest text-sm">LOBBY ENTRY</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${
              isConnected
                ? 'bg-lime-500/10 border-lime-400/30'
                : 'bg-red-500/10 border-red-400/30'
            }`}>
              <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-lime-400' : 'text-red-400'}`} />
              <span className={`text-[10px] tracking-widest font-bold ${isConnected ? 'text-lime-400' : 'text-red-400'}`}>
                {isConnected ? 'CONNECTED' : 'CONNECTING...'}
              </span>
            </div>

            {/* User badge */}
            <div className="flex items-center gap-3 bg-slate-900/80 border border-lime-400/20 px-4 py-2 rounded-sm">
              <div className="w-8 h-8 bg-slate-700 border border-lime-400/40 flex items-center justify-center text-white font-bold text-xs">
                {user?.user_metadata?.username?.[0].toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-lime-400 font-black text-[10px] tracking-widest">PLAYER</div>
                <div className="text-white text-xs font-bold">{user?.user_metadata?.username || 'Player'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-8 py-12">
          {mode === 'choose' && !currentRoom && (
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-3 mb-12">
                <h1 className="text-4xl font-black tracking-widest text-white">ENTER THE DUNGEON</h1>
                <p className="text-slate-400 text-sm tracking-wide">Choose to create a private party or join existing adventurers</p>
              </div>

              {connectionError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-red-400 text-xs text-center font-bold tracking-wide">
                  {connectionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Create Room */}
                <button
                  onClick={() => setMode('create')}
                  className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/50 hover:border-cyan-400 rounded-sm p-8 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative text-center space-y-4">
                    <div className="text-5xl">🔐</div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-cyan-400 tracking-widest">CREATE PARTY</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Start a private room and invite your friends with a unique code
                      </p>
                    </div>
                  </div>
                </button>

                {/* Join Room */}
                <button
                  onClick={() => setMode('join')}
                  className="group relative overflow-hidden bg-gradient-to-br from-lime-500/20 to-lime-600/10 border border-lime-500/50 hover:border-lime-400 rounded-sm p-8 transition-all hover:shadow-[0_0_30px_rgba(132,204,22,0.2)] hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative text-center space-y-4">
                    <div className="text-5xl">🗝️</div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-lime-400 tracking-widest">JOIN PARTY</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enter a room code to join friends in an existing party
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {mode === 'create' && !currentRoom && (
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-widest text-cyan-400">CREATE PARTY</h2>
                <p className="text-slate-400 text-xs tracking-widest">Create a new dungeon party and select your character in the lobby</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setMode('choose')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-sm transition-all text-xs font-bold tracking-widest disabled:opacity-50"
                >
                  BACK
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-black disabled:text-slate-500 rounded-sm transition-all text-xs font-bold tracking-widest disabled:cursor-not-allowed"
                >
                  {loading ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </div>
          )}

          {mode === 'join' && !currentRoom && (
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-widest text-lime-400">JOIN PARTY</h2>
                <p className="text-slate-400 text-xs tracking-widest">Enter the party code and select your character in the lobby</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Room code input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block">Party Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="E.g., X7K9PQ"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-sm focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/50 text-center text-lg font-mono tracking-widest"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setMode('choose')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-sm transition-all text-xs font-bold tracking-widest disabled:opacity-50"
                >
                  BACK
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={!joinCode || loading}
                  className="flex-1 px-4 py-3 bg-lime-400 hover:bg-lime-300 disabled:bg-slate-700 text-black disabled:text-slate-500 rounded-sm transition-all text-xs font-bold tracking-widest disabled:cursor-not-allowed"
                >
                  {loading ? 'JOINING...' : 'JOIN'}
                </button>
              </div>
            </div>
          )}

          {currentRoom && (
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-widest text-lime-400">PARTY CREATED!</h2>
                <p className="text-slate-400 text-sm">Share this code with your friends</p>
              </div>

              {/* Room code display */}
              <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 border-2 border-lime-500/50 rounded-sm p-8 space-y-4">
                <div className="text-sm text-slate-400 tracking-widest uppercase">Your Party Code</div>
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-4xl font-black font-mono text-lime-400 tracking-[0.5em]">
                    {currentRoom.roomCode}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="p-3 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/50 rounded-sm transition-all"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-lime-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400 hover:text-lime-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="text-center space-y-2">
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">Waiting for players...</div>
                <div className="text-sm text-slate-500">{currentRoom.players.length}/4 players joined</div>
              </div>

              {/* Continue button */}
              <button
                onClick={() => onNavigateTo('lobby-waiting')}
                className="w-full px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black rounded-sm font-bold tracking-widest transition-all text-xs"
              >
                CONTINUE TO LOBBY
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-slate-800/80 bg-black/40 backdrop-blur-md flex items-center justify-end">
          <button className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-xs font-bold tracking-widest" onClick={() => onNavigateTo('home')}>
            <LogOut className="w-4 h-4" />
            LEAVE
          </button>
        </footer>
      </div>
    </div>
  );
}
