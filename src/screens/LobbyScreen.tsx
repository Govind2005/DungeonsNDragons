import { useState, useEffect } from 'react';
import { Settings, LogOut, Swords, Wifi, Shield, Zap } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface Player {
  id: string;
  username: string;
  team: 'blue' | 'red';
  characterClass: CharacterClass | null;
  isReady: boolean;
  position: number;
}

interface LobbyScreenProps {
  players: Player[];
  onSelectCharacter: (playerId: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

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

export function LobbyScreen({ players, onSelectCharacter, onStart, onLeave }: LobbyScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [pulseVs, setPulseVs] = useState(false);

  const currentPlayer = players[0];
  const teamBlue = players.filter((p) => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed  = players.filter((p) => p.team === 'red').sort((a, b) => a.position - b.position);
  const allReady = players.every((p) => p.characterClass);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setPulseVs((p) => !p), 1800);
    return () => clearInterval(interval);
  }, []);

  const renderPlayerCard = (player: Player | undefined, slotIndex: number) => {
    const slotLabel = `PLAYER ${slotIndex + 1}`;
    const isCurrentPlayer = player?.id === currentPlayer?.id;
    const delay = `${slotIndex * 80}ms`;

    if (!player) {
      return (
        <div
          key={`empty-${slotIndex}`}
          className="relative h-80 border-2 border-dashed border-slate-700/40 bg-slate-900/20 flex flex-col items-center justify-center gap-3 rounded-sm"
          style={{ animationDelay: delay }}
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

    const charData   = player.characterClass ? CHARACTERS[player.characterClass] : null;
    const classTheme = player.characterClass ? CLASS_COLORS[player.characterClass] : null;
    const teamColor  = player.team === 'blue';
    const isHovered  = hoveredPlayer === player.id;

    // ── Red-side characters face left (toward the VS divider) ───────────────
    const shouldFlip = player.team === 'red';

    return (
      <div
        key={player.id}
        className={`relative transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: delay }}
        onMouseEnter={() => setHoveredPlayer(player.id)}
        onMouseLeave={() => setHoveredPlayer(null)}
      >
        {/* Ready badge */}
        {player.isReady && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-lime-400 text-black text-[10px] font-black tracking-widest px-3 py-0.5 skew-x-[-8deg]">
              <span className="skew-x-[8deg] inline-block">✓ READY</span>
            </div>
          </div>
        )}

        {/* Card */}
        <div
          onClick={() => onSelectCharacter(player.id)}
          className={`
            relative overflow-hidden cursor-pointer h-80 border-2 rounded-sm transition-all duration-300
            ${classTheme
              ? `bg-gradient-to-b ${classTheme.bg} ${classTheme.border} ${isHovered ? classTheme.glow : ''}`
              : teamColor
              ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border-cyan-600/40 hover:border-cyan-400/60'
              : 'bg-gradient-to-b from-red-950/40 to-slate-900/60 border-red-600/40 hover:border-red-400/60'
            }
            ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}
          `}
        >
          {/* Scan line overlay */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none z-10" />

          {/* Corner accent */}
          <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${teamColor ? 'border-cyan-400' : 'border-red-400'}`} />
          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${teamColor ? 'border-cyan-400' : 'border-red-400'}`} />

          {charData ? (
            <div className="h-full flex flex-col">
              {/* Character image */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
                <div
                  className={`absolute inset-0 opacity-20 transition-opacity duration-500 ${isHovered ? 'opacity-40' : ''}`}
                  style={{
                    background: `radial-gradient(ellipse at center, ${
                      player.characterClass === 'wizard'    ? '#a855f7' :
                      player.characterClass === 'barbarian' ? '#f97316' :
                      player.characterClass === 'knight'    ? '#60a5fa' : '#4ade80'
                    } 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={charData.image}
                  alt={charData.name}
                  className={`h-48 w-auto object-contain relative z-10 transition-all duration-500 drop-shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                  style={shouldFlip ? { transform: isHovered ? 'scaleX(-1) scale(1.10)' : 'scaleX(-1)' } : undefined}
                />
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
                  <div className={`text-xs font-black px-2 py-0.5 rounded ${teamColor ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}`}>
                    P{slotIndex + 1}
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <STAT_BAR label="HP"   value={charData.maxHp}   max={210} color={teamColor ? 'bg-cyan-400' : 'bg-red-400'} />
                  <STAT_BAR label="MANA" value={charData.maxMana} max={130} color="bg-lime-400" />
                </div>
                <div className="flex gap-1 pt-1">
                  {charData.abilities.slice(0, 3).map((ab) => (
                    <div
                      key={ab.id}
                      title={ab.name}
                      className={`flex-1 h-1 rounded-full ${ab.type === 'attack' ? 'bg-red-500/60' : 'bg-blue-500/60'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
              <div className={`w-16 h-16 border-2 border-dashed ${teamColor ? 'border-cyan-600/50' : 'border-red-600/50'} flex items-center justify-center`}>
                <Swords className={`w-7 h-7 ${teamColor ? 'text-cyan-700' : 'text-red-700'} opacity-60`} />
              </div>
              <div className="text-center space-y-1">
                <div className="text-white text-xs font-black tracking-widest">{slotLabel}</div>
                {isCurrentPlayer && (
                  <div className={`text-[10px] font-semibold ${teamColor ? 'text-cyan-500' : 'text-red-500'} animate-pulse`}>
                    CLICK TO SELECT CLASS
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`h-1 mt-1 rounded-full ${teamColor ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-red-400'} ${isHovered ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#04080f] relative overflow-hidden font-mono">

      {/* ── BACKGROUND LAYER 1: Deep atmospheric gradient ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(10,20,50,0.95) 0%, rgba(4,8,15,1) 60%)',
      }} />

      {/* ── BACKGROUND LAYER 2: Team color side bleeds ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 80% at 5% 60%, rgba(0,80,180,0.14) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 80% at 95% 60%, rgba(180,20,20,0.14) 0%, transparent 60%)',
      }} />

      {/* ── BACKGROUND LAYER 3: Fine grid ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,255,100,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.035) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* ── BACKGROUND LAYER 4: Diagonal lines ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,1) 60px, rgba(255,255,255,1) 61px)',
      }} />

      {/* ── BACKGROUND LAYER 5: Center vertical divider glow ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 4% 80% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 100%)',
      }} />

      {/* ── BACKGROUND LAYER 6: Top accent line ── */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.7) 20%, rgba(163,230,53,1) 50%, rgba(163,230,53,0.7) 80%, transparent)',
      }} />
      <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(163,230,53,0.04), transparent)',
      }} />

      {/* ── BACKGROUND LAYER 7: Bottom floor line ── */}
      <div className="absolute bottom-16 left-0 right-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(to right, transparent, rgba(96,165,250,0.3) 20%, rgba(255,255,255,0.15) 50%, rgba(248,113,113,0.3) 80%, transparent)',
      }} />

      {/* ── BACKGROUND LAYER 8: Atmospheric top glow ── */}
      <div className="absolute pointer-events-none" style={{
        top: 0, left: '20%', right: '20%', height: '200px',
        background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(80,200,80,0.04) 0%, transparent 100%)',
      }} />

      {/* ── BACKGROUND LAYER 9: Vignette ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
      }} />

      {/* ── BACKGROUND LAYER 10: Corner brackets ── */}
      {['top-5 left-5 border-t border-l','top-5 right-5 border-t border-r','bottom-20 left-5 border-b border-l','bottom-20 right-5 border-b border-r'].map((cls, i) => (
        <div key={i} className={`absolute w-8 h-8 border-slate-700/40 pointer-events-none ${cls}`} />
      ))}

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── HEADER ── */}
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
                <div className="text-lime-400 font-black text-[10px] tracking-widest">VANGUARD</div>
                <div className="text-white text-xs font-bold">{currentPlayer?.username || 'PLAYER_ONE'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-8 py-8">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-start">

            {/* ── TEAM BLUE ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                <div className="bg-cyan-400 text-black font-black text-sm px-5 py-2 tracking-widest skew-x-[-6deg]">
                  <span className="skew-x-[6deg] inline-block">TEAM BLUE</span>
                </div>
                <div className="h-px w-8 bg-cyan-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderPlayerCard(teamBlue[0], 0)}
                {renderPlayerCard(teamBlue[1], 2)}
              </div>
            </div>

            {/* ── VS DIVIDER ── */}
            <div className="flex flex-col items-center justify-center pt-12 gap-3 self-stretch">
              <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              <div className={`relative transition-all duration-700 ${pulseVs ? 'scale-110' : 'scale-100'}`}>
                <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-150" />
                <div className="relative bg-black border-4 border-white/80 px-5 py-4 rotate-12 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <span className="text-white font-black text-3xl tracking-widest block -rotate-12">VS</span>
                </div>
              </div>
              <div className="w-px flex-1 bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
            </div>

            {/* ── TEAM RED ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-red-500/30" />
                <div className="bg-red-500 text-black font-black text-sm px-5 py-2 tracking-widest skew-x-[6deg]">
                  <span className="skew-x-[-6deg] inline-block">TEAM RED</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-red-500/50 to-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderPlayerCard(teamRed[0], 1)}
                {renderPlayerCard(teamRed[1], 3)}
              </div>
            </div>
          </div>
        </main>

        {/* ── FOOTER BAR ── */}
        <footer className="px-8 py-5 border-t border-slate-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between gap-6">
          <button
            onClick={onLeave}
            className="group flex items-center gap-2 border border-red-600/50 hover:border-red-500 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-5 py-2.5 transition-all text-xs font-bold tracking-widest rounded-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            LEAVE LOBBY
          </button>

          <div className="flex items-center gap-4">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${p.characterClass ? 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'bg-slate-700'}`} />
                <span className={`text-[10px] font-bold tracking-widest ${p.characterClass ? 'text-lime-400' : 'text-slate-600'}`}>
                  P{i + 1}
                </span>
              </div>
            ))}
            <span className="text-slate-600 text-[10px] ml-1">
              {players.filter((p) => p.characterClass).length}/4 READY
            </span>
          </div>

          <div className="text-slate-600 text-[10px] italic tracking-wider hidden lg:block">
            Click any card to select a champion class
          </div>

          <button
            onClick={onStart}
            disabled={!allReady}
            className={`
              group relative px-10 py-3 transition-all duration-300 text-sm font-black tracking-widest rounded-sm
              ${allReady
                ? 'bg-lime-400 hover:bg-lime-300 text-black shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              }
            `}
          >
            {allReady && (
              <span className="absolute inset-0 rounded-sm bg-lime-300/20 animate-ping opacity-0 group-hover:opacity-100" />
            )}
            <span className="relative flex items-center gap-2">
              <Swords className="w-4 h-4" />
              START BATTLE
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}