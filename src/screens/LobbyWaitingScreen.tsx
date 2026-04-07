import { useState, useEffect } from 'react';
import { LogOut, Zap, Wifi, Shield, Swords } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

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

export function LobbyWaitingScreen({ onNavigateTo }: { onNavigateTo: (screen: string) => void }) {
  const { currentRoom, leaveRoom, selectCharacter, startRoom } = useGame();
  const { user, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectingPlayerId, setSelectingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleLeave = async () => {
    await leaveRoom();
    onNavigateTo('lobby-join');
  };

  const handleSelectCharacter = (playerId: string) => {
    setSelectingPlayerId(playerId);
    setShowCharacterModal(true);
  };

  const handleCharacterSelect = async (characterClass: CharacterClass) => {
    if (!selectingPlayerId || !token) return;

    setError(null);
    try {
      await selectCharacter(selectingPlayerId, characterClass, token);
      setShowCharacterModal(false);
      setSelectingPlayerId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select character';
      setError(message);
    }
  };

  const handleStartGame = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }

    // Check if all players have selected characters
    if (!currentRoom.players.every((p) => p.characterClass)) {
      setError('All players must select a character before starting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await startRoom(token);
      // Navigation will happen through context update
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const allPlayersReady = currentRoom.players.every((p) => p.characterClass);

  const renderPlayerCard = (slot: number) => {
    const player = currentRoom.players[slot];
    const isCurrentPlayer = player?.playerId === user?.id;
    const teamColor = slot < 2 ? 'blue' : 'red';

    if (!player) {
      return (
        <div
          key={`empty-${slot}`}
          className={`relative h-80 border-2 border-dashed border-slate-700/40 bg-slate-900/20 flex flex-col items-center justify-center gap-3 rounded-sm transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${slot * 80}ms` }}
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

    const charData = player.characterClass ? CHARACTERS[player.characterClass] : null;
    const classTheme = player.characterClass ? CLASS_COLORS[player.characterClass] : null;
    const isHovered = hoveredPlayer === player.playerId;

    return (
      <div
        key={player.playerId}
        className={`relative transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: `${slot * 80}ms` }}
        onMouseEnter={() => setHoveredPlayer(player.playerId)}
        onMouseLeave={() => setHoveredPlayer(null)}
      >
        {/* Ready badge */}
        {player.characterClass && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-lime-400 text-black text-[10px] font-black tracking-widest px-3 py-0.5 skew-x-[-8deg]">
              <span className="skew-x-[8deg] inline-block">✓ READY</span>
            </div>
          </div>
        )}

        {/* Card */}
        <div
          onClick={() => isCurrentPlayer && handleSelectCharacter(player.playerId)}
          className={`
            relative overflow-hidden ${isCurrentPlayer && !charData ? 'cursor-pointer' : ''} h-80 border-2 rounded-sm transition-all duration-300
            ${classTheme
              ? `bg-gradient-to-b ${classTheme.bg} ${classTheme.border} ${isHovered ? classTheme.glow : ''}`
              : teamColor === 'blue'
              ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border-cyan-600/40 hover:border-cyan-400/60'
              : 'bg-gradient-to-b from-red-950/40 to-slate-900/60 border-red-600/40 hover:border-red-400/60'
            }
            ${isHovered && (isCurrentPlayer && !charData) ? 'scale-[1.02] -translate-y-1' : ''}
          `}
        >
          {/* Scan line overlay */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none z-10" />

          {/* Corner accent */}
          <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${teamColor === 'blue' ? 'border-cyan-400' : 'border-red-400'}`} />
          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${teamColor === 'blue' ? 'border-cyan-400' : 'border-red-400'}`} />

          {charData ? (
            <div className="h-full flex flex-col">
              {/* Character image */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/20">
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10`} />

                {/* Glow behind character */}
                <div
                  className={`absolute inset-0 opacity-20 transition-opacity duration-500 ${isHovered ? 'opacity-40' : ''}`}
                  style={{
                    background: `radial-gradient(ellipse at center, ${
                      player.characterClass === 'wizard' ? '#a855f7' :
                      player.characterClass === 'barbarian' ? '#f97316' :
                      player.characterClass === 'knight' ? '#60a5fa' : '#4ade80'
                    } 0%, transparent 70%)`,
                  }}
                />

                <img
                  src={charData.image}
                  alt={charData.name}
                  className={`h-48 w-auto object-contain relative z-10 transition-all duration-500 drop-shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                />

                {/* Class icon badge */}
                <div className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 border ${teamColor === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50'} flex items-center justify-center text-base`}>
                  {CLASS_ICONS[player.characterClass!]}
                </div>
              </div>

              {/* Info panel */}
              <div className="bg-black/60 backdrop-blur-sm px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-black text-sm tracking-wider uppercase italic ${classTheme?.text}`}>
                      {charData.name}
                    </div>
                    <div className="text-slate-400 text-[10px] font-semibold tracking-widest">
                      {isCurrentPlayer ? `${player.username.toUpperCase()} (YOU)` : player.username.toUpperCase()}
                    </div>
                  </div>
                  <div className={`text-xs font-black px-2 py-0.5 rounded ${teamColor === 'blue' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}`}>
                    P{slot + 1}
                  </div>
                </div>

                {/* Stat bars */}
                <div className="space-y-1.5 pt-1">
                  <STAT_BAR label="HP" value={charData.maxHp} max={210} color={teamColor === 'blue' ? 'bg-cyan-400' : 'bg-red-400'} />
                  <STAT_BAR label="MANA" value={charData.maxMana} max={130} color="bg-lime-400" />
                </div>

                {/* Abilities preview */}
                <div className="flex gap-1 pt-1">
                  {charData.abilities.slice(0, 3).map((ab) => (
                    <div
                      key={ab.id}
                      title={ab.name}
                      className={`flex-1 h-1 rounded-full ${
                        ab.type === 'attack' ? 'bg-red-500/60' : 'bg-blue-500/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty slot – waiting for class pick */
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
              <div className={`w-16 h-16 border-2 border-dashed ${teamColor === 'blue' ? 'border-cyan-600/50' : 'border-red-600/50'} flex items-center justify-center`}>
                <Swords className={`w-7 h-7 ${teamColor === 'blue' ? 'text-cyan-700' : 'text-red-700'} opacity-60`} />
              </div>
              <div className="text-center space-y-1">
                <div className="text-white text-xs font-black tracking-widest">PLAYER {slot + 1}</div>
                {isCurrentPlayer && (
                  <div className={`text-[10px] font-semibold ${teamColor === 'blue' ? 'text-cyan-500' : 'text-red-500'} animate-pulse`}>
                    CLICK TO SELECT CLASS
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
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 font-black text-sm tracking-widest italic">KINETIC VOID</span>
            </div>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-slate-300 font-bold tracking-widest text-sm">CHARACTER SELECTION</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 px-3 py-1.5 rounded-sm">
              <Wifi className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-slate-400 text-[10px] tracking-widest">CONNECTED</span>
            </div>

            {/* Room code */}
            <div className="flex items-center gap-3 bg-slate-900/80 border border-lime-400/20 px-4 py-2 rounded-sm">
              <Shield className="w-3.5 h-3.5 text-lime-400" />
              <div>
                <div className="text-lime-400 font-black text-[10px] tracking-widest">ROOM</div>
                <div className="text-white text-sm font-mono font-bold">{currentRoom.roomCode}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-8 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black tracking-widest text-white">SELECT YOUR CLASS</h1>
              <p className="text-slate-400 text-sm tracking-wide">Click your card to choose a character class</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-red-400 text-xs text-center font-bold tracking-wide">
                {error}
              </div>
            )}

            {/* Players grid */}
            <div className="grid grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((slot) => renderPlayerCard(slot))}
            </div>

            {/* Ready status and action buttons */}
            <div className="max-w-3xl mx-auto space-y-6">
              {/* All ready status */}
              <div className={`rounded-sm p-6 border transition-all ${
                allPlayersReady
                  ? 'bg-lime-500/10 border-lime-500/30'
                  : 'bg-slate-900/60 border-slate-700/50'
              }`}>
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

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleLeave}
                  className="flex-1 group flex items-center justify-center gap-2 border border-red-600/50 hover:border-red-500 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-6 py-3 transition-all text-xs font-bold tracking-widest rounded-sm"
                >
                  <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  LEAVE LOBBY
                </button>

                <button
                  onClick={handleStartGame}
                  disabled={!allPlayersReady || loading}
                  className={`flex-1 px-6 py-3 rounded-sm text-xs font-bold tracking-widest transition-all ${
                    allPlayersReady
                      ? 'bg-lime-500 hover:bg-lime-400 text-black'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'STARTING...' : 'START GAME'}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-slate-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between">
          <div className="text-slate-600 text-xs font-bold tracking-widest">
            {allPlayersReady ? 'ALL PLAYERS READY' : 'WAITING FOR PLAYERS TO SELECT CLASS'}
          </div>
          <div className="text-slate-500 text-xs">Room: {currentRoom.roomCode}</div>
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
                    onClick={() => handleCharacterSelect(classId)}
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
              onClick={() => {
                setShowCharacterModal(false);
                setSelectingPlayerId(null);
              }}
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
