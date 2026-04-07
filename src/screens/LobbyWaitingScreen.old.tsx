import { useState, useEffect } from 'react';
import { LogOut, Zap, Users, Clock } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

export function LobbyWaitingScreen({ onNavigateTo }: { onNavigateTo: (screen: string) => void }) {
  const { currentRoom, leaveRoom } = useGame();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLeave = async () => {
    await leaveRoom();
    onNavigateTo('lobby-join');
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg font-bold">No room loaded</div>
          <button
            onClick={() => onNavigateTo('lobby-join')}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-sm"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

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
            <span className="text-slate-300 font-bold tracking-widest text-sm">WAITING ROOM</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Player count */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 px-3 py-1.5 rounded-sm">
              <Users className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-slate-400 text-[10px] tracking-widest font-bold">
                {currentRoom.players.length}/4 PLAYERS
              </span>
            </div>

            {/* Room code */}
            <div className="flex items-center gap-3 bg-slate-900/80 border border-lime-400/20 px-4 py-2 rounded-sm">
              <Clock className="w-3.5 h-3.5 text-lime-400" />
              <div>
                <div className="text-lime-400 font-black text-[10px] tracking-widest">ROOM</div>
                <div className="text-white text-sm font-mono font-bold">{currentRoom.roomCode}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-8 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black tracking-widest text-white">ASSEMBLING PARTY</h1>
              <p className="text-slate-400 text-sm tracking-wide">Waiting for all adventurers to arrive...</p>
            </div>

            {/* Players grid */}
            <div className="grid grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((index) => {
                const player = currentRoom.players[index];
                const delay = `${index * 100}ms`;

                return (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: delay }}
                  >
                    {player ? (
                      <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 border-2 border-lime-500/50 rounded-sm p-6 text-center space-y-4 h-full">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-lime-400/20 border border-lime-400/50 rounded-full mx-auto flex items-center justify-center">
                          <span className="text-3xl font-black">{player.username[0].toUpperCase()}</span>
                        </div>

                        {/* Player info */}
                        <div className="space-y-2">
                          <div className="text-sm font-black text-white tracking-widest">{player.username}</div>
                          <div className="text-[10px] font-bold text-lime-400 tracking-widest uppercase">
                            Player {index + 1}
                          </div>
                          <div className="text-xs text-slate-400 font-bold tracking-wide capitalize">
                            {player.characterClass || 'Selecting...'}
                          </div>
                        </div>

                        {/* Ready indicator */}
                        {player.characterClass && (
                          <div className="pt-2 border-t border-lime-500/30">
                            <div className="text-[10px] font-bold text-lime-400 tracking-widest">
                              ✓ READY
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-2 border-dashed border-slate-600/50 rounded-sm p-6 text-center space-y-4 h-full flex flex-col items-center justify-center">
                        {/* Empty slot */}
                        <div className="w-16 h-16 border-2 border-dashed border-slate-600/50 rounded-full flex items-center justify-center">
                          <span className="text-2xl text-slate-700">?</span>
                        </div>

                        {/* Waiting animation */}
                        <div className="space-y-2">
                          <div className="text-sm font-black text-slate-500 tracking-widest">WAITING</div>
                          <div className="flex gap-1 justify-center">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"
                                style={{ animationDelay: `${i * 200}ms` }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-600 font-bold tracking-widest pt-2 border-t border-slate-700/50">
                          Player {index + 1}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ready status */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Party Status</div>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full transition-all ${
                            currentRoom.players[i]?.characterClass
                              ? 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]'
                              : 'bg-slate-700 animate-pulse'
                          }`}
                        />
                        {i < 3 && <div className="w-px h-3 bg-slate-700" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center text-sm text-slate-400">
                  {currentRoom.players.filter((p) => p.characterClass).length}/4 players ready
                </div>
              </div>
            </div>

            {/* Progress info */}
            {currentRoom.players.length < 4 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4 text-center text-blue-300 text-xs font-bold tracking-wide">
                Waiting for {4 - currentRoom.players.length} more {4 - currentRoom.players.length === 1 ? 'player' : 'players'}...
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-slate-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={handleLeave}
            className="group flex items-center gap-2 border border-red-600/50 hover:border-red-500 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-5 py-2.5 transition-all text-xs font-bold tracking-widest rounded-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            LEAVE LOBBY
          </button>

          <div className="text-slate-600 text-xs font-bold tracking-widest">
            {currentRoom.status === 'PLAYING' ? 'GAME STARTED' : 'WAITING FOR PARTY ASSEMBLY'}
          </div>
        </footer>
      </div>
    </div>
  );
}
