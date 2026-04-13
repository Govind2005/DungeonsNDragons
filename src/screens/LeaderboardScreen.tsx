import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Trophy, Swords, Shield, ChevronDown, ChevronUp, Activity, Zap } from 'lucide-react';

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

const CLASS_COLOR: Record<string, string> = {
  Barbarian: '#fb923c',
  Knight:    '#60a5fa',
  Ranger:    '#4ade80',
  Wizard:    '#c084fc',
};
const CLASS_BG: Record<string, string> = {
  Barbarian: 'rgba(251,146,60,0.12)',
  Knight:    'rgba(96,165,250,0.12)',
  Ranger:    'rgba(74,222,128,0.12)',
  Wizard:    'rgba(192,132,252,0.12)',
};
const CLASS_SHORT: Record<string, string> = {
  Barbarian: 'BARB', Knight: 'KNGT', Ranger: 'RNGR', Wizard: 'WIZD',
};
const CLASSES = ['Barbarian', 'Knight', 'Ranger', 'Wizard'];

function generateMatches(entries: LeaderboardEntry[]) {
  const players = entries.length >= 4 ? entries : [
    { username: 'Player1', wins: 3, losses: 1, xp: 750 },
    { username: 'Player2', wins: 1, losses: 3, xp: 300 },
    { username: 'Player3', wins: 2, losses: 2, xp: 500 },
    { username: 'Player4', wins: 2, losses: 2, xp: 500 },
  ];

  const total = Math.min(Math.max(players[0].wins + players[0].losses, 4), 8);
  return Array.from({ length: total }, (_, i) => {
    const blueWon = i % 2 === 0;
    const id = `DND-${Math.random().toString(36).slice(2,6).toUpperCase()}-${1000 + Math.floor(Math.random() * 9000)}`;
    const minsAgo = (i + 1) * 47 + Math.floor(Math.random() * 30);
    const dur = `${12 + Math.floor(Math.random() * 18)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const blue = [
      { username: players[0].username, cls: CLASSES[i % 4],       dmg: 350 + Math.floor(Math.random() * 180), heal: blueWon ? 80 + Math.floor(Math.random() * 80) : 10, xp: blueWon ? 250 : 100 },
      { username: players[2]?.username || 'Player3', cls: CLASSES[(i+2) % 4], dmg: 280 + Math.floor(Math.random() * 160), heal: blueWon ? 40 + Math.floor(Math.random() * 60) : 5,  xp: blueWon ? 250 : 100 },
    ];
    const red = [
      { username: players[1].username, cls: CLASSES[(i+1) % 4],   dmg: 300 + Math.floor(Math.random() * 160), heal: !blueWon ? 70 + Math.floor(Math.random() * 80) : 8,  xp: !blueWon ? 250 : 100 },
      { username: players[3]?.username || 'Player4', cls: CLASSES[(i+3) % 4], dmg: 260 + Math.floor(Math.random() * 140), heal: !blueWon ? 50 + Math.floor(Math.random() * 60) : 6,  xp: !blueWon ? 250 : 100 },
    ];
    return { id, minsAgo, dur, blueWon, blue, red };
  });
}

function timeAgo(mins: number) {
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function LeaderboardScreen({ leaderboard, currentUserId, onBack }: LeaderboardScreenProps) {
  const [mounted, setMounted]     = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [filter, setFilter]       = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');
  const matches                   = generateMatches(leaderboard);
  const wins    = matches.filter(m => m.blueWon).length;
  const losses  = matches.length - wins;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
  const shown   = filter === 'ALL' ? matches : filter === 'WINS' ? matches.filter(m => m.blueWon) : matches.filter(m => !m.blueWon);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#04080f] relative overflow-hidden" style={{ fontFamily: 'ui-monospace, monospace' }}>

      {/* â”€â”€ BG â”€â”€ */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,40,20,0.9) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,255,100,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,100,0.025) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.9) 50%, transparent)' }} />
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(163,230,53,0.05), transparent)' }} />
      {['top-4 left-4 border-t border-l','top-4 right-4 border-t border-r','bottom-4 left-4 border-b border-l','bottom-4 right-4 border-b border-r'].map((c,i) => (
        <div key={i} className={`absolute w-8 h-8 border-slate-700/30 pointer-events-none ${c}`} />
      ))}

      <div className="relative z-10 pb-12">

        {/* â”€â”€ HEADER â”€â”€ */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800/50 bg-black/40 backdrop-blur-md">
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-500 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[11px] font-black tracking-widest">BACK</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-lime-400/40 bg-lime-400/8 flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(163,230,53,0.15)' }}>
              <Activity className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-widest">BATTLE  LOGS</h1>
              <div className="text-lime-400/40 text-[10px] tracking-widest">Season 01: Kinetic Hero &nbsp;&bull;&nbsp; All Matches</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-slate-700/50 bg-slate-900/40">
            <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.9)' }} />
            <span className="text-lime-400 text-[11px] font-black tracking-widest">LIVE</span>
            <span className="text-slate-700 mx-1">&bull;</span>
            <span className="text-slate-400 text-[11px] tracking-widest">{matches.length} MATCHES</span>
          </div>
        </div>

        <div className="px-8 py-8 max-w-5xl mx-auto space-y-5">

          {/* â”€â”€ STATS â”€â”€ */}
          <div className={`grid grid-cols-4 overflow-hidden border border-slate-800/50 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {[
              { v: matches.length, l: 'TOTAL MATCHES', c: '#d9f99d' },
              { v: wins,           l: 'WINS',          c: '#4ade80' },
              { v: losses,         l: 'LOSSES',        c: '#f87171' },
              { v: `${winRate}%`,  l: 'WIN RATE',      c: winRate >= 60 ? '#4ade80' : winRate >= 40 ? '#facc15' : '#f87171' },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center py-6 bg-slate-900/25 hover:bg-slate-900/50 transition-colors border-r border-slate-800/50 last:border-r-0">
                <span className="font-black text-4xl font-mono leading-none" style={{ color: s.c, textShadow: `0 0 30px ${s.c}50` }}>{s.v}</span>
                <span className="text-slate-600 text-[9px] tracking-[0.2em] mt-2">{s.l}</span>
                <div className="absolute bottom-0 left-8 right-8 h-px" style={{ background: `linear-gradient(to right, transparent, ${s.c}50, transparent)` }} />
              </div>
            ))}
          </div>

          {/* â”€â”€ FILTERS â”€â”€ */}
          <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '150ms' }}>
            {(['ALL', 'WINS', 'LOSSES'] as const).map(f => {
              const active = filter === f;
              const ac = f === 'WINS' ? '#4ade80' : f === 'LOSSES' ? '#f87171' : '#a3e635';
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-5 py-2.5 text-[11px] font-black tracking-widest border transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    color: active ? ac : '#475569',
                    borderColor: active ? `${ac}60` : 'rgba(51,65,85,0.4)',
                    background: active ? `${ac}12` : 'rgba(8,12,20,0.5)',
                    boxShadow: active ? `0 0 15px ${ac}20` : 'none',
                  }}>
                  {f === 'ALL' ? 'ALL MATCHES' : f === 'WINS' ? 'WINS' : 'LOSSES'}
                </button>
              );
            })}
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(163,230,53,0.15), transparent)' }} />
            <div className="flex items-center gap-1.5 text-slate-700 text-[10px] tracking-widest">
              <Swords className="w-3 h-3" /><span>RECENT BATTLES</span>
            </div>
          </div>

          {/* â”€â”€ MATCH CARDS â”€â”€ */}
          <div className="space-y-4">
            {shown.map((m, idx) => {
              const isOpen = expanded === m.id;
              const winColor = m.blueWon ? '#60a5fa' : '#f87171';
              const winBg    = m.blueWon ? 'rgba(96,165,250,0.08)' : 'rgba(248,113,113,0.08)';
              const winBorder= m.blueWon ? 'rgba(96,165,250,0.35)' : 'rgba(248,113,113,0.35)';

              return (
                <div key={m.id}
                  className={`transition-all duration-500 overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{
                    transitionDelay: `${200 + idx * 70}ms`,
                    border: `1px solid ${isOpen ? winBorder : 'rgba(30,41,59,0.7)'}`,
                    background: isOpen ? winBg : 'rgba(6,10,18,0.7)',
                    boxShadow: isOpen ? `0 0 40px ${winColor}10, inset 0 0 30px ${winColor}04` : 'none',
                  }}>

                  {/* â”€â”€ COLLAPSED: full team preview â”€â”€ */}
                  <div className="px-5 py-4">

                    {/* Top row: match meta */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="shrink-0">
                        <div className="text-[8px] text-slate-700 tracking-widest mb-1">MATCH ID</div>
                        <div className="text-[11px] font-black tracking-wider px-2.5 py-1"
                          style={{ color: '#a3e635', border: '1px solid rgba(163,230,53,0.3)', background: 'rgba(163,230,53,0.07)', fontFamily: 'monospace' }}>
                          {m.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-500 text-[10px] tracking-widest">{timeAgo(m.minsAgo)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-500 text-[10px] tracking-widest">{m.dur} duration</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-500 text-[10px] tracking-widest">4 PLAYERS</span>
                      </div>
                      <div className="flex-1" />
                      {/* Result */}
                      <div className="flex items-center gap-2 px-4 py-2 font-black text-[11px] tracking-widest"
                        style={{ color: winColor, border: `1px solid ${winBorder}`, background: winBg, boxShadow: `0 0 15px ${winColor}20` }}>
                        <Trophy className="w-3.5 h-3.5" />
                        {m.blueWon ? 'BLUE WIN' : 'RED WIN'}
                      </div>
                      <button onClick={() => setExpanded(isOpen ? null : m.id)}
                        className="w-8 h-8 flex items-center justify-center border border-slate-700/50 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-800/50 transition-all text-slate-500 hover:text-white">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Teams preview row â€” always visible */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">

                      {/* Team Blue */}
                      <div className="border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                        style={{ borderLeft: `3px solid rgba(96,165,250,${m.blueWon ? '0.8' : '0.3'})` }}>
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/40">
                          <div className="w-2 h-2 rounded-full" style={{ background: '#60a5fa', boxShadow: m.blueWon ? '0 0 8px rgba(96,165,250,0.8)' : 'none', opacity: m.blueWon ? 1 : 0.4 }} />
                          <span className="text-[10px] font-black tracking-widest" style={{ color: m.blueWon ? '#60a5fa' : '#475569' }}>TEAM BLUE</span>
                          {m.blueWon && <Trophy className="w-3 h-3 text-yellow-400 ml-auto" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.8))' }} />}
                        </div>
                        {m.blue.map((p, pi) => (
                          <div key={pi} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-800/20 last:border-0">
                            <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[9px] font-black"
                              style={{ color: CLASS_COLOR[p.cls], background: CLASS_BG[p.cls], border: `1px solid ${CLASS_COLOR[p.cls]}40` }}>
                              {CLASS_SHORT[p.cls]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-[11px] font-black tracking-wide truncate">{p.username}</div>
                              <div className="text-[9px] tracking-widest" style={{ color: CLASS_COLOR[p.cls] }}>{p.cls.toUpperCase()}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-right">
                              <div>
                                <div className="text-red-400 font-mono font-black text-[11px]">{p.dmg}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest">DMG</div>
                              </div>
                              <div>
                                <div className="text-emerald-400 font-mono font-black text-[11px]">{p.heal}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest">HEAL</div>
                              </div>
                              <div className="px-1.5 py-1" style={{ background: 'rgba(163,230,53,0.07)', border: '1px solid rgba(163,230,53,0.2)' }}>
                                <div className="text-[11px] font-black font-mono" style={{ color: '#a3e635' }}>+{p.xp}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest text-center">XP</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Center VS */}
                      <div className="flex flex-col items-center justify-center px-4 gap-2">
                        <div className="font-black text-lg font-mono" style={{ color: '#60a5fa', textShadow: '0 0 15px rgba(96,165,250,0.6)' }}>
                          {m.blueWon ? 'W' : 'L'}
                        </div>
                        <div className="w-px flex-1 bg-slate-800/60" />
                        <div className="text-slate-600 text-[9px] font-black tracking-widest px-2 py-1 border border-slate-800/60">VS</div>
                        <div className="w-px flex-1 bg-slate-800/60" />
                        <div className="font-black text-lg font-mono" style={{ color: '#f87171', textShadow: '0 0 15px rgba(248,113,113,0.6)' }}>
                          {m.blueWon ? 'L' : 'W'}
                        </div>
                      </div>

                      {/* Team Red */}
                      <div className="border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                        style={{ borderRight: `3px solid rgba(248,113,113,${!m.blueWon ? '0.8' : '0.3'})` }}>
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/40">
                          {!m.blueWon && <Trophy className="w-3 h-3 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.8))' }} />}
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ background: '#f87171', boxShadow: !m.blueWon ? '0 0 8px rgba(248,113,113,0.8)' : 'none', opacity: !m.blueWon ? 1 : 0.4 }} />
                          <span className="text-[10px] font-black tracking-widest" style={{ color: !m.blueWon ? '#f87171' : '#475569' }}>TEAM RED</span>
                        </div>
                        {m.red.map((p, pi) => (
                          <div key={pi} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-800/20 last:border-0 flex-row-reverse">
                            <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[9px] font-black"
                              style={{ color: CLASS_COLOR[p.cls], background: CLASS_BG[p.cls], border: `1px solid ${CLASS_COLOR[p.cls]}40` }}>
                              {CLASS_SHORT[p.cls]}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <div className="text-white text-[11px] font-black tracking-wide truncate">{p.username}</div>
                              <div className="text-[9px] tracking-widest" style={{ color: CLASS_COLOR[p.cls] }}>{p.cls.toUpperCase()}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-row-reverse">
                              <div className="text-left">
                                <div className="text-red-400 font-mono font-black text-[11px]">{p.dmg}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest">DMG</div>
                              </div>
                              <div className="text-left">
                                <div className="text-emerald-400 font-mono font-black text-[11px]">{p.heal}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest">HEAL</div>
                              </div>
                              <div className="px-1.5 py-1" style={{ background: 'rgba(163,230,53,0.07)', border: '1px solid rgba(163,230,53,0.2)' }}>
                                <div className="text-[11px] font-black font-mono" style={{ color: '#a3e635' }}>+{p.xp}</div>
                                <div className="text-[8px] text-slate-700 tracking-widest text-center">XP</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* â”€â”€ EXPANDED: extra detail â”€â”€ */}
                  {isOpen && (
                    <div className="border-t border-slate-800/50 bg-black/20">
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-5">
                          {[
                            { icon: Zap,    label: 'MAP',      val: 'DUNGEON DEPTHS' },
                            { icon: Clock,  label: 'DURATION', val: m.dur            },
                            { icon: Users,  label: 'PLAYERS',  val: '4'              },
                            { icon: Shield, label: 'FORMAT',   val: '2v2 RANKED'     },
                          ].map(({ icon: Icon, label, val }, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <Icon className="w-3 h-3 text-slate-600" />
                              <span className="text-slate-600 text-[9px] tracking-widest">{label}:</span>
                              <span className="text-slate-400 text-[9px] font-black tracking-widest">{val}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5" style={{ color: winColor }} />
                          <span className="font-black text-[10px] tracking-widest" style={{ color: winColor }}>
                            {m.blueWon ? 'TEAM BLUE VICTORIOUS' : 'TEAM RED VICTORIOUS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {shown.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <Swords className="w-10 h-10 text-slate-700 mx-auto" />
              <div className="text-slate-600 text-xs tracking-widest">No matches found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}