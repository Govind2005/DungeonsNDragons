import { useEffect, useState } from 'react';
import { Trophy, Home, RotateCcw, Zap, Swords, Heart, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface ResultPlayer {
  username: string;
  characterClass: CharacterClass;
  team: 'blue' | 'red';
  damage: number;
  healing: number;
  xpGained: number;
}

interface ResultScreenProps {
  winnerTeam: 'blue' | 'red';
  players: ResultPlayer[];
  currentUserId: string;
  onReturnHome: () => void;
  onPlayAgain: () => void;
}

const CLASS_COLOR: Record<CharacterClass, string> = {
  barbarian: 'text-orange-400',
  knight:    'text-blue-400',
  ranger:    'text-green-400',
  wizard:    'text-purple-400',
};

function useCountUp(target: number, duration: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return val;
}

function AnimatedStat({ label, value, color, active, icon: Icon }: {
  label: string; value: number; color: string; active: boolean; icon: any;
}) {
  const displayed = useCountUp(value, 1200, active);
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 text-lg font-black font-mono ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {displayed}
      </div>
      <div className="text-[9px] text-slate-600 tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

export function ResultScreen({ winnerTeam, players, currentUserId, onReturnHome, onPlayAgain }: ResultScreenProps) {
  const [phase, setPhase]             = useState<'banner' | 'cards' | 'done'>('banner');
  const [showCards, setShowCards]     = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const winners = players.filter(p => p.team === winnerTeam);
  const losers  = players.filter(p => p.team !== winnerTeam);
  const isBlue  = winnerTeam === 'blue';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('cards'),    900);
    const t2 = setTimeout(() => setShowCards(true),  1000);
    const t3 = setTimeout(() => setShowButtons(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const PlayerCard = ({ player, rank, delay }: { player: ResultPlayer; rank: number; delay: number }) => {
    const [visible, setVisible] = useState(false);
    const isWinner   = player.team === winnerTeam;
    const classColor = CLASS_COLOR[player.characterClass];
    const charData   = CHARACTERS[player.characterClass];

    useEffect(() => {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }, [delay]);

    return (
      <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : isWinner ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
        <div className={`relative overflow-hidden border rounded-sm hover:scale-[1.005] transition-all duration-300 ${
          isWinner
            ? 'bg-gradient-to-r from-lime-400/8 via-slate-900/60 to-slate-900/40 border-lime-400/30 shadow-[0_0_20px_rgba(163,230,53,0.08)]'
            : 'bg-slate-900/40 border-slate-700/40'
        }`}>
          {/* Left accent bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWinner ? 'bg-lime-400' : 'bg-slate-700'}`} />

          <div className="flex items-center gap-4 px-5 py-4 pl-6">

            {/* Rank */}
            <div className={`w-8 text-2xl font-black font-mono shrink-0 ${isWinner ? 'text-lime-400' : 'text-slate-600'}`}>
              #{rank}
            </div>

            {/* Character portrait using actual image â€” no emoji */}
            <div className={`relative w-14 h-14 shrink-0 border-2 overflow-hidden rounded-sm bg-slate-800 ${
              isWinner ? 'border-lime-400/50' : 'border-slate-700'
            }`}>
              <img
                src={charData.image}
                alt={charData.name}
                className="w-full h-full object-cover object-top scale-125"
              />
              {isWinner && (
                <div className="absolute -top-1 -right-1 z-10 bg-black/60 rounded-full p-0.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                </div>
              )}
            </div>

            {/* Name + class + team */}
            <div className="flex-1 min-w-0">
              <div className={`font-black text-sm tracking-wider uppercase ${isWinner ? 'text-white' : 'text-slate-400'}`}>
                {player.username}
              </div>
              <div className={`text-[10px] font-bold tracking-widest ${classColor}`}>
                {charData.name.toUpperCase()}
              </div>
              <div className={`text-[9px] tracking-widest mt-0.5 ${player.team === 'blue' ? 'text-cyan-600' : 'text-red-600'}`}>
                TEAM {player.team.toUpperCase()}
              </div>
            </div>

            {/* Animated stats */}
            <div className="flex items-center gap-6 shrink-0">
              <AnimatedStat label="DMG"  value={player.damage}  color="text-red-400"     active={visible} icon={Swords} />
              <AnimatedStat label="HEAL" value={player.healing} color="text-emerald-400" active={visible} icon={Heart}  />
            </div>

            {/* XP badge */}
            <div className={`shrink-0 flex flex-col items-center justify-center w-20 h-14 border rounded-sm ${
              isWinner ? 'bg-lime-400/10 border-lime-400/40' : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${isWinner ? 'text-lime-400' : 'text-slate-500'}`} />
                <span className={`text-[9px] font-black tracking-widest ${isWinner ? 'text-lime-400' : 'text-slate-500'}`}>XP</span>
              </div>
              <div className={`text-xl font-black font-mono ${isWinner ? 'text-lime-400' : 'text-slate-400'}`}>
                +{player.xpGained}
              </div>
            </div>

            {/* Win/loss chevron */}
            <div className={`shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${isWinner ? 'bg-lime-400/20' : 'bg-red-500/10'}`}>
              {isWinner
                ? <ChevronUp   className="w-5 h-5 text-lime-400" />
                : <ChevronDown className="w-5 h-5 text-red-500"  />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060a10] relative overflow-hidden font-mono">

      {/* Background */}
      <div className="absolute inset-0" style={{ background: isBlue
        ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,30,60,0.8) 0%, transparent 70%)'
        : 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(60,0,0,0.8) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(rgba(0,255,120,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,1) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${isBlue ? 'via-cyan-400' : 'via-red-400'} to-transparent`} />
      <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${isBlue ? 'from-cyan-500/10' : 'from-red-500/10'} to-transparent`} />

      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-slate-700/50" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-slate-700/50" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-slate-700/50" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-slate-700/50" />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-8 py-10">

        {/* â”€â”€ VICTORY BANNER â”€â”€ */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${phase !== 'banner' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="relative inline-block mb-4">
            <div className={`absolute -inset-1 blur-xl opacity-40 ${isBlue ? 'bg-cyan-400' : 'bg-red-400'}`} />
            <div className={`relative px-12 py-4 skew-x-[-6deg] border-2 ${isBlue ? 'bg-cyan-500 border-cyan-400' : 'bg-red-500 border-red-400'}`}>
              <div className="skew-x-[6deg] flex items-center gap-4">
                <Trophy className="w-8 h-8 text-white" />
                <span className="text-white font-black text-2xl tracking-widest">TEAM {winnerTeam.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <h1
            className="text-[clamp(3rem,10vw,7rem)] font-black tracking-widest text-white leading-none"
            style={{ textShadow: isBlue
              ? '0 0 60px rgba(96,165,250,0.5), 0 0 120px rgba(96,165,250,0.2)'
              : '0 0 60px rgba(248,113,113,0.5), 0 0 120px rgba(248,113,113,0.2)' }}
          >
            VICTORY
          </h1>
          <div className={`h-1 mt-2 mx-auto w-2/3 rounded-full bg-gradient-to-r from-transparent ${isBlue ? 'via-cyan-400' : 'via-red-400'} to-transparent`} />
          <div className="text-slate-500 text-xs tracking-[0.3em] mt-3 uppercase">Match Complete</div>
        </div>

        {/* â”€â”€ PLAYER CARDS â”€â”€ */}
        <div className={`w-full max-w-3xl space-y-8 transition-all duration-500 ${showCards ? 'opacity-100' : 'opacity-0'}`}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 font-black text-xs tracking-widest">VICTORS</span>
              <div className="flex-1 h-px bg-gradient-to-r from-lime-400/30 to-transparent" />
            </div>
            <div className="space-y-2">
              {winners.map((p, i) => <PlayerCard key={p.username} player={p} rank={i + 1} delay={i * 150} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <ChevronDown className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500 font-black text-xs tracking-widest">DEFEATED</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
            </div>
            <div className="space-y-2">
              {losers.map((p, i) => <PlayerCard key={p.username} player={p} rank={winners.length + i + 1} delay={300 + i * 150} />)}
            </div>
          </div>
        </div>

        {/* â”€â”€ BUTTONS â”€â”€ */}
        <div className={`mt-10 flex flex-col items-center gap-4 w-full max-w-sm transition-all duration-700 ${showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className={`w-full text-center py-2.5 border rounded-sm border-lime-400/30 bg-lime-400/5`}>
            <span className="text-lime-400 font-black text-sm tracking-widest">
              +{winners[0]?.xpGained ?? 0} XP EARNED THIS MATCH
            </span>
          </div>
          <div className="flex gap-4 w-full">
            <button onClick={onReturnHome} className="group flex-1 relative overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 rounded-sm" />
              <div className="relative bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-sm px-6 py-4 flex items-center justify-center gap-2 transition-colors">
                <Home className="w-4 h-4 text-slate-300" />
                <span className="text-slate-300 font-black text-sm tracking-widest">MAIN MENU</span>
              </div>
            </button>
            <button onClick={onPlayAgain} className="group flex-1 relative overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 rounded-sm" />
              <div className="relative bg-lime-400 hover:bg-lime-300 border-2 border-black rounded-sm px-6 py-4 flex items-center justify-center gap-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <RotateCcw className="w-4 h-4 text-black" />
                <span className="text-black font-black text-sm tracking-widest">PLAY AGAIN</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}