import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Crown, ArrowLeft, Zap, Star, ChevronUp, ChevronDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
}

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
  onBack: () => void;
}

const PODIUM_THEMES = {
  1: { height: 'h-36', bg: 'bg-gradient-to-t from-yellow-700 to-yellow-500', border: 'border-yellow-400', crown: 'text-yellow-400', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]', label: 'text-yellow-900' },
  2: { height: 'h-24', bg: 'bg-gradient-to-t from-slate-600 to-slate-400', border: 'border-slate-300', crown: 'text-slate-300', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]', label: 'text-slate-800' },
  3: { height: 'h-16', bg: 'bg-gradient-to-t from-orange-800 to-orange-600', border: 'border-orange-500', crown: 'text-orange-400', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]', label: 'text-orange-900' },
} as const;

export function LeaderboardScreen({ leaderboard, currentUserId, onBack }: LeaderboardScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [visibleRows, setVisibleRows] = useState(0);

  const topThree = leaderboard.slice(0, 3);
  const rest     = leaderboard.slice(3);

  useEffect(() => {
    setMounted(true);
    // Stagger row reveals
    const interval = setInterval(() => {
      setVisibleRows(prev => {
        if (prev >= rest.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [rest.length]);

  const winRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(0) : '0';
  };

  const PodiumCard = ({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) => {
    const theme = PODIUM_THEMES[position];
    const order = position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3';

    return (
      <div className={`${order} flex flex-col items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: `${position * 100}ms` }}>

        {/* Avatar + info */}
        <div className="flex flex-col items-center mb-3 text-center">
          <div className={`relative w-16 h-16 rounded-sm border-2 ${theme.border} bg-slate-900 flex items-center justify-center mb-2 ${theme.glow}`}>
            <Crown className={`w-8 h-8 ${theme.crown}`} />
            <div className={`absolute -top-3 -right-3 w-6 h-6 ${theme.bg} border ${theme.border} flex items-center justify-center text-[10px] font-black text-black rounded-sm`}>
              {position}
            </div>
          </div>
          <div className="text-white font-black text-sm tracking-wider">{entry.username}</div>
          <div className="text-slate-500 text-[10px] tracking-widest">LVL {entry.level}</div>
          <div className={`text-[11px] font-black font-mono mt-1 ${theme.crown}`}>{entry.xp.toLocaleString()} XP</div>
        </div>

        {/* Podium block */}
        <div className={`w-32 ${theme.height} ${theme.bg} border-t-4 border-x-2 ${theme.border} ${theme.glow} flex flex-col items-center justify-start pt-3 relative rounded-t-sm`}>
          <div className={`text-5xl font-black ${theme.label} opacity-30 leading-none`}>#{position}</div>
          <div className="text-[10px] font-black text-black/70 mt-1">{entry.wins}W â€” {entry.losses}L</div>
        </div>
      </div>
    );
  };

  const LeaderboardRow = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
    const rate     = parseInt(winRate(entry.wins, entry.losses));
    const isTop    = rate >= 60;
    const isMid    = rate >= 40 && rate < 60;
    const visible  = index < visibleRows;

    return (
      <div className={`transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
        <div className="group flex items-center gap-4 px-5 py-3 border border-transparent hover:border-slate-700/60 hover:bg-slate-900/40 rounded-sm transition-all duration-200 cursor-default">

          {/* Rank */}
          <div className="w-10 text-center shrink-0">
            <span className="text-slate-600 font-black font-mono text-lg">#{entry.rank}</span>
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 shrink-0 bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center">
            <Star className="w-5 h-5 text-slate-600" />
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm tracking-wide truncate">{entry.username}</div>
            <div className="text-slate-600 text-[10px] tracking-widest">LEVEL {entry.level}</div>
          </div>

          {/* XP */}
          <div className="text-center w-20 shrink-0">
            <div className="text-lime-400 font-black font-mono text-sm">{entry.xp.toLocaleString()}</div>
            <div className="text-slate-600 text-[9px] tracking-widest">XP</div>
          </div>

          {/* Wins */}
          <div className="text-center w-14 shrink-0">
            <div className="text-cyan-400 font-black font-mono text-sm">{entry.wins}</div>
            <div className="text-slate-600 text-[9px] tracking-widest">WINS</div>
          </div>

          {/* Losses */}
          <div className="text-center w-14 shrink-0">
            <div className="text-red-400 font-black font-mono text-sm">{entry.losses}</div>
            <div className="text-slate-600 text-[9px] tracking-widest">LOSSES</div>
          </div>

          {/* Win rate */}
          <div className={`text-center w-20 shrink-0 px-3 py-1.5 border rounded-sm ${
            isTop ? 'bg-lime-400/10 border-lime-400/30' :
            isMid ? 'bg-yellow-400/10 border-yellow-400/30' :
                    'bg-slate-800/50 border-slate-700/40'
          }`}>
            <div className={`font-black font-mono text-sm ${isTop ? 'text-lime-400' : isMid ? 'text-yellow-400' : 'text-slate-400'}`}>
              {rate}%
            </div>
            <div className="text-[9px] text-slate-600 tracking-widest">WIN RATE</div>
          </div>

          {/* Trend icon */}
          <div className="w-6 shrink-0 flex justify-center">
            {isTop ? <ChevronUp className="w-4 h-4 text-lime-400" /> :
             isMid  ? <Minus     className="w-4 h-4 text-yellow-400" /> :
                      <ChevronDown className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060a10] relative overflow-hidden font-mono">

      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(rgba(0,255,120,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,1) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,40,20,0.6) 0%, transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-lime-400/5 to-transparent" />

      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-slate-700/50" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-slate-700/50" />

      <div className="relative z-10">

        {/* â”€â”€ HEADER â”€â”€ */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 bg-black/30 backdrop-blur-md">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs font-bold tracking-widest">BACK</span>
          </button>

          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-lime-400" />
            <div>
              <h1 className="text-white font-black text-lg tracking-widest uppercase">Leaderboards</h1>
              <div className="text-lime-400/50 text-[10px] tracking-widest text-center">Season 01: Kinetic Hero</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 text-[10px] tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>TOP {leaderboard.length} PLAYERS</span>
          </div>
        </div>

        <div className="px-8 py-10 max-w-5xl mx-auto">

          {/* â”€â”€ PODIUM â”€â”€ */}
          {topThree.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-400/20" />
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-black text-xs tracking-widest">TOP CHAMPIONS</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-400/20" />
              </div>

              <div className="flex items-end justify-center gap-6">
                {topThree[1] && <PodiumCard entry={topThree[1]} position={2} />}
                {topThree[0] && <PodiumCard entry={topThree[0]} position={1} />}
                {topThree[2] && <PodiumCard entry={topThree[2]} position={3} />}
              </div>

              {/* Podium floor */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mt-0" />
            </div>
          )}

          {/* â”€â”€ RANKINGS TABLE â”€â”€ */}
          {rest.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700/50" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 font-black text-xs tracking-widest">RANKINGS</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700/50" />
              </div>

              {/* Table header */}
              <div className="flex items-center gap-4 px-5 py-2 mb-1">
                <div className="w-10 text-center text-[9px] text-slate-700 tracking-widest font-black">#</div>
                <div className="w-10 shrink-0" />
                <div className="flex-1 text-[9px] text-slate-700 tracking-widest font-black">PLAYER</div>
                <div className="w-20 text-center text-[9px] text-slate-700 tracking-widest font-black shrink-0">XP</div>
                <div className="w-14 text-center text-[9px] text-slate-700 tracking-widest font-black shrink-0">WINS</div>
                <div className="w-14 text-center text-[9px] text-slate-700 tracking-widest font-black shrink-0">LOSSES</div>
                <div className="w-20 text-center text-[9px] text-slate-700 tracking-widest font-black shrink-0">WIN RATE</div>
                <div className="w-6 shrink-0" />
              </div>

              <div className="space-y-1">
                {rest.map((entry, i) => (
                  <LeaderboardRow key={entry.rank} entry={entry} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {leaderboard.length === 0 && (
            <div className="text-center py-24 space-y-4">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="text-slate-600 text-sm tracking-widest">No rankings yet â€” be the first to play!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}