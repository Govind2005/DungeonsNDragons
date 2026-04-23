import { useState, useEffect } from 'react';
import { ScrollText, ArrowLeft, Swords, Shield, Crosshair, Wand2, Calendar, Clock, Trophy, ChevronRight } from 'lucide-react';

interface BattleMember {
  username: string;
  characterClass: 'barbarian' | 'knight' | 'ranger' | 'wizard';
}

interface BattleLog {
  id: string;
  timestamp: string;
  duration: string;
  teamRed: BattleMember[];
  teamBlue: BattleMember[];
  winner: 'teamRed' | 'teamBlue';
}

interface BattleLogsScreenProps {
  currentUserId: string;
  onBack: () => void;
}

const CLASS_ICONS = {
  barbarian: { icon: Swords, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  knight: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  ranger: { icon: Crosshair, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  wizard: { icon: Wand2, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
};

const BATTLE_LOGS: BattleLog[] = [
  {
    id: 'm2',
    timestamp: '2026-04-22 12:15',
    duration: '12m 05s',
    teamRed: [
      { username: 'Govind', characterClass: 'wizard' },
      { username: 'Govind', characterClass: 'wizard' },
    ],
    teamBlue: [
      { username: 'Govind', characterClass: 'barbarian' },
      { username: 'Govind', characterClass: 'barbarian' },
    ],
    winner: 'teamBlue',
  },
  {
    id: 'm1',
    timestamp: '2026-04-22 14:30',
    duration: '8m 42s',
    teamRed: [
      { username: 'Govind', characterClass: 'barbarian' },
      { username: 'Achir', characterClass: 'wizard' },
    ],
    teamBlue: [
      { username: 'Om', characterClass: 'ranger' },
      { username: 'Kshitij', characterClass: 'knight' },
    ],
    winner: 'teamRed',
  },
  {
    id: 'm1',
    timestamp: '2026-04-22 14:30',
    duration: '8m 42s',
    teamRed: [
      { username: 'Govind', characterClass: 'barbarian' },
      { username: 'Achir', characterClass: 'wizard' },
    ],
    teamBlue: [
      { username: 'Om', characterClass: 'ranger' },
      { username: 'Kshitij', characterClass: 'knight' },
    ],
    winner: 'teamRed',
  },
];

export function BattleLogsScreen({ onBack }: BattleLogsScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MemberTag = ({ member }: { member: BattleMember }) => {
    const config = CLASS_ICONS[member.characterClass];
    const Icon = config.icon;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${config.bg} ${config.border} group/member transition-all hover:scale-105`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-white/90 text-[11px] font-bold tracking-wider uppercase">{member.username}</span>
        <span className={`text-[8px] font-black uppercase opacity-40 group-hover/member:opacity-100 transition-opacity ${config.color}`}>{member.characterClass}</span>
      </div>
    );
  };

  const MatchCard = ({ log, index }: { log: BattleLog; index: number }) => {
    return (
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="group relative bg-slate-900/30 border border-slate-800/60 hover:border-lime-400/30 rounded-sm overflow-hidden transition-all duration-300">
          {/* Winner highlight side glow */}
          <div className={`absolute top-0 bottom-0 w-1 ${log.winner === 'teamBlue' ? 'left-0 bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]' : 'right-0 bg-red-500 shadow-[-2px_0_10px_rgba(239,68,68,0.5)]'}`} />

          {/* Card Header Removed */}

          {/* Teams Grid */}
          <div className="px-6 py-8 flex items-center justify-between relative">
            {/* VS Overlay */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl">
                <span className="text-[10px] font-black text-slate-500 italic">VS</span>
              </div>
              <div className="absolute inset-0 bg-slate-400/5 blur-[20px] rounded-full" />
            </div>

            {/* Team Blue (Left) */}
            <div className={`flex flex-col items-center gap-3 w-[42%] ${log.winner === 'teamBlue' ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center gap-2 mb-1">
                {log.winner === 'teamBlue' && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${log.winner === 'teamBlue' ? 'text-blue-400' : 'text-slate-500'}`}>TEAM BLUE</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {log.teamBlue.map((m, i) => <MemberTag key={i} member={m} />)}
              </div>
            </div>

            {/* Middle Divider Background */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/30" />

            {/* Team Red (Right) */}
            <div className={`flex flex-col items-center gap-3 w-[42%] ${log.winner === 'teamRed' ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center gap-2 mb-1">
                {log.winner === 'teamRed' && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${log.winner === 'teamRed' ? 'text-red-400' : 'text-slate-500'}`}>TEAM RED</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {log.teamRed.map((m, i) => <MemberTag key={i} member={m} />)}
              </div>
            </div>
          </div>

          {/* Result Footer */}
          <div className={`px-6 py-2 flex items-center justify-center gap-3 transition-colors duration-300 ${log.winner === 'teamBlue' ? 'bg-blue-500/5' : 'bg-red-500/5'}`}>
            <span className="text-slate-500 text-[9px] font-black tracking-widest uppercase">MATCH RESULT:</span>
            <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${log.winner === 'teamBlue' ? 'text-blue-400' : 'text-red-400'}`}>
              {log.winner === 'teamBlue' ? 'TEAM BLUE VICTORY' : 'TEAM RED VICTORY'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060a10] relative overflow-hidden font-mono">
      {/* Background FX (Matching Home/Lobby aesthetic) */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(rgba(0,255,120,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,1) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,40,20,0.6) 0%, transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />

      {/* Scrollable Content */}
      <div className="relative z-10 flex flex-col h-screen">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 bg-black/40 backdrop-blur-xl">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black tracking-widest">BACK TO HUB</span>
          </button>

          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-lime-400" />
            <div>
              <h1 className="text-white font-black text-lg tracking-[0.3em] uppercase">Battle Logs</h1>
              <div className="text-lime-400/50 text-[8px] font-black tracking-[0.4em] text-center">ANCIENT SCROLLS OF COMBAT</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-slate-600 text-[9px] font-black tracking-widest uppercase">ACTIVE SEASON</span>
            <span className="text-lime-400 text-[10px] font-black tracking-widest uppercase">KINETIC HERO S01</span>
          </div>
        </header>

        {/* Feed Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-10">
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800" />
              <span className="text-slate-600 text-[9px] font-black tracking-[0.5em] uppercase">RECENT COMBAT DATA</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800" />
            </div>

            {/* Logs List */}
            {BATTLE_LOGS.map((log, i) => (
              <MatchCard key={log.id} log={log} index={i} />
            ))}

            {/* Footer decoration */}
            <div className="pt-10 flex flex-col items-center gap-4 opacity-20">
              <div className="w-1 h-20 bg-gradient-to-b from-lime-400 to-transparent" />
              <span className="text-[10px] font-black tracking-[1em] text-lime-400 uppercase">END OF LOGS</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(163,230,53,0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(163,230,53,0.3);
        }
      `}</style>
    </div>
  );
}