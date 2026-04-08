import { useState, useEffect } from 'react';
import { Settings, LogOut, Swords, Wifi, Shield, Zap, Copy, Check } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';
import { useGame, GamePlayer } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

const CLASS_ICONS: Record<CharacterClass, string> = {
  barbarian: '⚔️',
  knight: '🛡️',
  ranger: '🏹',
  wizard: '🔮',
};

const CLASS_COLORS: Record<CharacterClass, { bg: string; border: string; glow: string; text: string }> = {
  barbarian: {
    bg: 'from-orange-950/60 to-slate-900/80',
    border: 'border-orange-500/70',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.25)]',
    text: 'text-orange-400',
  },
  knight: {
    bg: 'from-blue-950/60 to-slate-900/80',
    border: 'border-blue-400/70',
    glow: 'shadow-[0_0_30px_rgba(96,165,250,0.25)]',
    text: 'text-blue-400',
  },
  ranger: {
    bg: 'from-green-950/60 to-slate-900/80',
    border: 'border-green-500/70',
    glow: 'shadow-[0_0_30px_rgba(74,222,128,0.25)]',
    text: 'text-green-400',
  },
  wizard: {
    bg: 'from-purple-950/60 to-slate-900/80',
    border: 'border-purple-500/70',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    text: 'text-purple-400',
  },
};

const STAT_BAR = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
      <span className="text-[10px] font-mono font-bold text-white">{value}</span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

export function LobbyScreen({ onNavigateTo }: { onNavigateTo: (screen: string) => void }) {
  const { createRoom, joinRoom, currentRoom, selectCharacter, setSelectedCharacter, selectedCharacter, playerReady, isConnected, matchId, matchPlayers } = useGame();
  const { user, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [phase, setPhase] = useState<'choose' | 'create' | 'join' | 'lobby'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [isCurrentPlayerReady, setIsCurrentPlayerReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentRoom) setPhase('lobby');
  }, [currentRoom]);

  // Navigate to battle when match starts or room status changes
  useEffect(() => {
    if (matchId && matchPlayers && matchPlayers.length > 0) {
      onNavigateTo('battle');
    } else if (currentRoom?.status === 'PLAYING') {
      onNavigateTo('battle');
    }
  }, [matchId, matchPlayers, currentRoom?.status, onNavigateTo]);

  const handleCreateRoom = async () => {
    if (!token || !user) {
      setError('No authentication token');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createRoom(user.id, token);
      setPhase('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
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
      setPhase('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = async (characterClass: CharacterClass) => {
    if (!token) return;
    try {
      await selectCharacter(characterClass, token);
      setSelectedCharacter(characterClass);
      setShowCharacterModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select character');
    }
  };

  const handleLeave = async () => {
    setPhase('choose');
    setJoinCode('');
    setError(null);
    setSelectedCharacter(null);
    setIsCurrentPlayerReady(false);
  };

  const handleReady = async () => {
    if (!token || !selectedCharacter) {
      setError('Please select a character first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Mark as ready (character already synced in handleSelectCharacter)
      await playerReady(token);
      // Lock character selection
      setIsCurrentPlayerReady(true);
      setShowCharacterModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as ready');
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

  // Check if all players are ready - use backend room status if available, otherwise check individual player isReady
  const allPlayersReady = currentRoom?.status === 'PLAYING' || 
                          (currentRoom?.players.every((p) => p.isReady) && currentRoom?.players.length === 4);
  const currentPlayer = currentRoom?.players.find((p) => p.playerId === user?.id);

  // Update current player ready state based on backend
  useEffect(() => {
    if (currentPlayer) {
      const isPlayerReadyFromBackend = currentPlayer.isReady || false;
      setIsCurrentPlayerReady(isPlayerReadyFromBackend);
      
      // If we don't have a local character selected but backend has one, sync it
      if (!selectedCharacter && currentPlayer.characterClass) {
        setSelectedCharacter(currentPlayer.characterClass);
      }
    }
  }, [currentPlayer, selectedCharacter, setSelectedCharacter]);

  const renderPlayerCard = (player: GamePlayer | undefined, slotIndex: number) => {
    const teamColor = slotIndex < 2 ? 'blue' : 'red';
    const isCurrentPlayer = player?.playerId === user?.id;
    const delay = `${slotIndex * 80}ms`;

    if (!player) {
      return (
        <div
          key={`empty-${slotIndex}`}
          className="relative h-80 border-2 border-dashed border-slate-700/40 bg-slate-900/20 flex flex-col items-center justify-center gap-3 rounded-sm"
          style={{ transitionDelay: delay }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-slate-700/50 flex items-center justify-center">
            <span className="text-slate-600 text-xl">?</span>
          </div>
          <span className="text-slate-600 font-bold tracking-widest text-xs uppercase">Waiting...</span>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      );
    }

    const isHovered = hoveredPlayer === player.playerId;
    const playerClass = player?.characterClass ? (player.characterClass.toLowerCase() as CharacterClass) : null;

    // For current player, use selectedCharacter if available, otherwise use characterClass from backend
    const displayCharacter = isCurrentPlayer && selectedCharacter ? selectedCharacter : playerClass;
    const displayCharData = displayCharacter ? CHARACTERS[displayCharacter] : null;
    const displayClassTheme = displayCharacter ? CLASS_COLORS[displayCharacter] : null;
    const isReady = player.isReady;

    return (
      <div
        key={player.playerId}
        className={`relative transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: delay }}
        onMouseEnter={() => setHoveredPlayer(player.playerId)}
        onMouseLeave={() => setHoveredPlayer(null)}
      >
        {/* Ready badge */}
        {isReady && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-lime-400 text-black text-[10px] font-black tracking-widest px-3 py-0.5 skew-x-[-8deg]">
              <span className="skew-x-[8deg] inline-block">READY</span>
            </div>
          </div>
        )}

        {/* Card */}
        <div
          onClick={() => {
            if (isCurrentPlayer && !isCurrentPlayerReady) {
              setShowCharacterModal(true);
            }
          }}
          className={`
            relative overflow-hidden ${isCurrentPlayer && !isCurrentPlayerReady ? 'cursor-pointer' : ''} h-80 border-2 rounded-sm transition-all duration-300
            ${displayClassTheme
              ? `bg-gradient-to-b ${displayClassTheme.bg} ${displayClassTheme.border} ${isHovered ? displayClassTheme.glow : ''}`
              : teamColor === 'blue'
              ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border-cyan-600/40 hover:border-cyan-400/60'
              : 'bg-gradient-to-b from-red-950/40 to-slate-900/60 border-red-600/40 hover:border-red-400/60'
            }
            ${isHovered && isCurrentPlayer && !isCurrentPlayerReady ? 'scale-[1.02] -translate-y-1' : ''}
          `}
        >
          {/* Scan line overlay */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none z-10" />

          {/* Corner accent */}
          <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${teamColor === 'blue' ? 'border-cyan-400' : 'border-red-400'}`} />
          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${teamColor === 'blue' ? 'border-cyan-400' : 'border-red-400'}`} />

          {displayCharData ? (
            <div className="h-full flex flex-col">
              {/* Character image */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/20">
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10`} />
                <div
                  className={`absolute inset-0 opacity-20 transition-opacity duration-500 ${isHovered ? 'opacity-40' : ''}`}
                  style={{
                    background: `radial-gradient(ellipse at center, ${
                      displayCharacter === 'wizard' ? '#a855f7' :
                      displayCharacter === 'barbarian' ? '#f97316' :
                      displayCharacter === 'knight' ? '#60a5fa' : '#4ade80'
                    } 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={displayCharData.image}
                  alt={displayCharData.name}
                  className={`h-48 w-auto object-contain relative z-10 transition-all duration-500 drop-shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                />
                <div className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 border ${teamColor === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50'} flex items-center justify-center text-base`}>
                  {CLASS_ICONS[displayCharacter!]}
                </div>
              </div>

              {/* Info panel */}
              <div className="bg-black/60 backdrop-blur-sm px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-black text-sm tracking-wider uppercase italic ${displayClassTheme?.text}`}>
                      {displayCharData.name}
                    </div>
                    <div className="text-slate-400 text-[10px] font-semibold tracking-widest">
                      {isCurrentPlayer ? `${player.username.toUpperCase()} (YOU)` : player.username.toUpperCase()}
                    </div>
                  </div>
                  <div className={`text-xs font-black px-2 py-0.5 rounded ${teamColor === 'blue' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}`}>
                    P{slotIndex + 1}
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <STAT_BAR label="HP" value={displayCharData.maxHp} max={210} color={teamColor === 'blue' ? 'bg-cyan-400' : 'bg-red-400'} />
                  <STAT_BAR label="MANA" value={displayCharData.maxMana} max={130} color="bg-lime-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
              <div className={`w-16 h-16 border-2 border-dashed ${teamColor === 'blue' ? 'border-cyan-600/50' : 'border-red-600/50'} flex items-center justify-center`}>
                <Swords className={`w-7 h-7 ${teamColor === 'blue' ? 'text-cyan-700' : 'text-red-700'} opacity-60`} />
              </div>
              <div className="text-center space-y-1">
                <div className="text-white text-xs font-black tracking-widest">PLAYER {slotIndex + 1}</div>
                {isCurrentPlayer && !isCurrentPlayerReady && (
                  <div className={`text-[10px] font-semibold ${teamColor === 'blue' ? 'text-cyan-500' : 'text-red-500'} animate-pulse`}>
                    CLICK TO SELECT CLASS
                  </div>
                )}
                {isCurrentPlayer && isCurrentPlayerReady && (
                  <div className={`text-[10px] font-semibold ${teamColor === 'blue' ? 'text-cyan-500' : 'text-red-500'}`}>
                    LOCKED IN
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team color bar at bottom */}
        <div className={`h-1 mt-1 rounded-full ${teamColor === 'blue' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-red-400'} ${isHovered ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
      </div>
    );
  };

  // JOINING PHASE - Create or Join Room
  if (phase !== 'lobby') {
    return (
      <div className="min-h-screen bg-[#080c14] relative overflow-hidden font-mono">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,255,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,150,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-lime-400/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen">
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

          <main className="flex-1 flex items-center justify-center px-8 py-12">
            {phase === 'choose' && (
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-3 mb-12">
                  <h1 className="text-4xl font-black tracking-widest text-white">ENTER THE DUNGEON</h1>
                  <p className="text-slate-400 text-sm tracking-wide">Choose to create a private party or join existing adventurers</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-red-400 text-xs text-center font-bold tracking-wide">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setPhase('create')}
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

                  <button
                    onClick={() => setPhase('join')}
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

            {phase === 'create' && (
              <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-widest text-cyan-400">CREATE PARTY</h2>
                  <p className="text-slate-400 text-xs tracking-widest">Select your character class in the lobby</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setPhase('choose')}
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

            {phase === 'join' && (
              <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-widest text-lime-400">JOIN PARTY</h2>
                  <p className="text-slate-400 text-xs tracking-widest">Enter party code and select character in lobby</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setPhase('choose')}
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
          </main>

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

  // LOBBY PHASE - Character Selection
  return (
    <div className="min-h-screen bg-[#080c14] relative overflow-hidden font-mono">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,150,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 font-black text-sm tracking-widest italic">KINETIC VOID</span>
            </div>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-slate-300 font-bold tracking-widest text-sm">DUNGEON LOBBY</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 px-3 py-1.5 rounded-sm">
              <Wifi className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-slate-400 text-[10px] tracking-widest">NA-WEST</span>
              <div className="w-px h-3 bg-slate-700" />
              <span className="text-lime-400 text-[10px] font-bold">24MS</span>
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            </div>

            <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors" />

            <div className="flex items-center gap-3 bg-slate-900/80 border border-lime-400/20 px-4 py-2 rounded-sm">
              <div className="w-8 h-8 bg-slate-700 border border-lime-400/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-lime-400" />
              </div>
              <div>
                <div className="text-lime-400 font-black text-[10px] tracking-widest">ROOM</div>
                <div className="text-white text-xs font-bold">{currentRoom?.roomCode}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
            {/* TEAM BLUE */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                <span className="text-cyan-400 font-black text-xs tracking-widest">TEAM BLUE</span>
                <div className="h-px w-8 bg-cyan-500/30" />
              </div>
              <div className="space-y-4">
                {[0, 1].map((i) => renderPlayerCard(currentRoom?.players[i], i))}
              </div>
            </div>

            {/* CENTER - Room code */}
            <div className="flex flex-col items-center justify-center pt-12 gap-3 self-stretch">
              <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              
              {/* Room code for copy */}
              <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 border-2 border-lime-500/50 rounded-sm p-4 space-y-2">
                <div className="text-[10px] text-slate-400 tracking-widest uppercase">Party Code</div>
                <div className="flex items-center gap-2 justify-center">
                  <div className="text-2xl font-black font-mono text-lime-400 tracking-[0.2em]">
                    {currentRoom?.roomCode}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="p-2 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/50 rounded-sm transition-all"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-lime-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-lime-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="w-px flex-1 bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
            </div>

            {/* TEAM RED */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-red-500/30" />
                <span className="text-red-400 font-black text-xs tracking-widest">TEAM RED</span>
                <div className="h-px flex-1 bg-gradient-to-l from-red-500/50 to-transparent" />
              </div>
              <div className="space-y-4">
                {[2, 3].map((i) => renderPlayerCard(currentRoom?.players[i], i))}
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="px-8 py-5 border-t border-slate-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between gap-6">
          <button
            onClick={handleLeave}
            className="group flex items-center gap-2 border border-red-600/50 hover:border-red-500 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-5 py-2.5 transition-all text-xs font-bold tracking-widest rounded-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            LEAVE LOBBY
          </button>

          <div className="flex items-center gap-4">
            {currentRoom?.players.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    p.characterClass
                      ? 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]'
                      : 'bg-slate-700 animate-pulse'
                  }`}
                />
                {i < 3 && <div className="w-px h-3 bg-slate-700" />}
              </div>
            ))}
            <span className="text-slate-600 text-[10px] ml-1">
              {currentRoom?.players.filter((p) => p.isReady).length || 0}/4 READY
            </span>
          </div>

          <div className="text-slate-600 text-[10px] italic tracking-wider hidden lg:block">
            {selectedCharacter ? `${selectedCharacter.toUpperCase()} selected` : 'Click your card to select class'}
          </div>

          {allPlayersReady ? (
            <button
              disabled={true}
              className="px-10 py-3 bg-lime-400 text-black rounded-sm transition-all text-sm font-black tracking-widest shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              <span className="flex items-center gap-2">
                <Swords className="w-4 h-4" />
                ✓ STARTING...
              </span>
            </button>
          ) : isCurrentPlayerReady ? (
            <button
              disabled={true}
              className="px-10 py-3 bg-lime-500 text-white rounded-sm transition-all text-sm font-black tracking-widest border border-lime-400"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                ✓ READY
              </span>
            </button>
          ) : selectedCharacter ? (
            <button
              onClick={handleReady}
              disabled={loading}
              className={`
                group relative px-10 py-3 transition-all duration-300 text-sm font-black tracking-widest rounded-sm
                ${!loading
                  ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                }
              `}
            >
              <span className="relative flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {loading ? 'CONFIRMING...' : 'READY UP'}
              </span>
            </button>
          ) : (
            <button
              disabled={true}
              className="px-10 py-3 bg-slate-800 text-slate-600 rounded-sm text-sm font-black tracking-widest border border-slate-700 cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                SELECT CLASS
              </span>
            </button>
          )}
        </footer>
      </div>

      {/* Character Selection Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-sm max-w-md w-full space-y-6 p-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-widest text-lime-400">SELECT CLASS</h2>
              <p className="text-slate-400 text-xs tracking-widest">Choose your character class</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['barbarian', 'knight', 'ranger', 'wizard'] as CharacterClass[]).map((classId) => {
                const charData = CHARACTERS[classId];
                return (
                  <button
                    key={classId}
                    onClick={() => handleSelectCharacter(classId)}
                    disabled={loading}
                    className="relative overflow-hidden p-4 rounded-sm border-2 border-slate-700 bg-slate-800/60 hover:border-lime-400 hover:bg-lime-500/20 transition-all text-center space-y-3 disabled:opacity-50"
                  >
                    <div className="text-4xl">{CLASS_ICONS[classId]}</div>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-white uppercase tracking-wide">{charData.name}</div>
                      <div className="text-[10px] text-slate-400">HP: {charData.maxHp} | MP: {charData.maxMana}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCharacterModal(false)}
              className="w-full px-4 py-2 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-sm transition-all text-xs font-bold tracking-widest"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
