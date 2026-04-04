import { useState, useEffect, useRef, useCallback } from 'react';
import { Swords, Shield, Clock, Zap, Eye, EyeOff, Anchor, TrendingDown } from 'lucide-react';
import { CharacterClass, CHARACTERS, Ability } from '../lib/gameData';

interface BattlePlayer {
  id: string;
  username: string;
  team: 'blue' | 'red';
  characterClass: CharacterClass;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  position: number;
  attackPowerBuff: number;
  isBound: boolean;
  isWeakened: boolean;
  isInvisible: boolean;
}

interface FloatingNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'miss' | 'mana';
}

interface BattleLogEntry {
  id: string;
  text: string;
  type: 'attack' | 'defense' | 'effect' | 'system';
  timestamp: number;
}

interface BattleScreenProps {
  players: BattlePlayer[];
  currentTurn: number;
  onAttack: (abilityId: string, targetIds: string[]) => void;
  onDefense: (abilityId: string) => void;
  lastAction?: {
    playerName: string;
    abilityName: string;
    damage: number;
    description: string;
  };
}

const TURN_TIME = 30;

const STATUS_CONFIG = {
  isBound:     { label: 'BOUND',     icon: Anchor,     color: 'text-orange-400 border-orange-500/60 bg-orange-500/10' },
  isInvisible: { label: 'INVISIBLE', icon: EyeOff,     color: 'text-purple-400 border-purple-500/60 bg-purple-500/10' },
  isWeakened:  { label: 'WEAKENED',  icon: TrendingDown,color: 'text-red-400    border-red-500/60    bg-red-500/10'    },
};

const CLASS_GLOW: Record<CharacterClass, string> = {
  barbarian: 'rgba(249,115,22,0.4)',
  knight:    'rgba(96,165,250,0.4)',
  ranger:    'rgba(74,222,128,0.4)',
  wizard:    'rgba(168,85,247,0.4)',
};

export function BattleScreen({ players, currentTurn, onAttack, onDefense, lastAction }: BattleScreenProps) {
  const [selectedTab, setSelectedTab]       = useState<'attack' | 'defense' | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [timeLeft, setTimeLeft]             = useState(TURN_TIME);
  const [floatingNums, setFloatingNums]     = useState<FloatingNumber[]>([]);
  const [battleLog, setBattleLog]           = useState<BattleLogEntry[]>([]);
  const [shakingId, setShakingId]           = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPlayer = players.find(p => p.position === currentTurn);
  const isMyTurn      = true; // will be: currentPlayer?.id === loggedInUserId
  const myPlayer      = currentPlayer;
  const teamBlue      = players.filter(p => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed       = players.filter(p => p.team === 'red').sort((a, b)  => a.position - b.position);
  const abilities     = myPlayer ? CHARACTERS[myPlayer.characterClass].abilities : [];
  const attackAbilities  = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');

  // â”€â”€ Turn timer â”€â”€
  useEffect(() => {
    setTimeLeft(TURN_TIME);
    setSelectedTab(null);
    setSelectedTargets([]);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentTurn]);

  // â”€â”€ Battle log from lastAction â”€â”€
  useEffect(() => {
    if (!lastAction) return;
    const entry: BattleLogEntry = {
      id: Math.random().toString(36).slice(2),
      text: lastAction.description,
      type: lastAction.damage > 0 ? 'attack' : 'defense',
      timestamp: Date.now(),
    };
    setBattleLog(prev => [...prev.slice(-19), entry]);
    if (lastAction.damage > 0) spawnFloat(lastAction.damage, 'damage');
    if (lastAction.abilityName.toLowerCase().includes('heal') || lastAction.abilityName.toLowerCase().includes('rest') || lastAction.abilityName.toLowerCase().includes('aura')) {
      spawnFloat(35, 'heal');
    }
  }, [lastAction]);

  // â”€â”€ Auto-scroll log â”€â”€
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  const spawnFloat = useCallback((value: number, type: FloatingNumber['type']) => {
    const id = Math.random().toString(36).slice(2);
    const x  = 30 + Math.random() * 40;
    const y  = 30 + Math.random() * 20;
    setFloatingNums(prev => [...prev, { id, value, x, y, type }]);
    setTimeout(() => setFloatingNums(prev => prev.filter(f => f.id !== id)), 1200);
  }, []);

  const triggerShake = useCallback((playerId: string) => {
    setShakingId(playerId);
    setTimeout(() => setShakingId(null), 500);
  }, []);

  const handleAbilityClick = (ability: Ability) => {
    if (!isMyTurn || !myPlayer || myPlayer.currentMana < ability.manaCost) return;
    if (ability.type === 'attack') {
      if (ability.target === 'aoe') {
        const enemies = (currentPlayer?.team === 'blue' ? teamRed : teamBlue).filter(p => p.currentHp > 0);
        enemies.forEach(e => triggerShake(e.id));
        onAttack(ability.id, enemies.map(p => p.id));
        setSelectedTab(null);
        setSelectedTargets([]);
      } else {
        if (selectedTargets.length === 1) {
          triggerShake(selectedTargets[0]);
          onAttack(ability.id, selectedTargets);
          setSelectedTargets([]);
          setSelectedTab(null);
        } else {
          const entry: BattleLogEntry = {
            id: Math.random().toString(36).slice(2),
            text: 'âš  Select an enemy target first, then click the ability.',
            type: 'system',
            timestamp: Date.now(),
          };
          setBattleLog(prev => [...prev.slice(-19), entry]);
        }
      }
    } else {
      onDefense(ability.id);
      setSelectedTab(null);
      setSelectedTargets([]);
    }
  };

  // â”€â”€ Helpers â”€â”€
  const hpColor = (pct: number) =>
    pct > 60 ? 'from-emerald-500 to-emerald-400' :
    pct > 30 ? 'from-yellow-500 to-yellow-400' : 'from-red-600 to-red-400';

  const timerColor = timeLeft > 15 ? 'text-lime-400' : timeLeft > 7 ? 'text-yellow-400' : 'text-red-400';
  const timerBg    = timeLeft > 15 ? 'bg-lime-400'   : timeLeft > 7 ? 'bg-yellow-400'   : 'bg-red-500 animate-pulse';

  // â”€â”€ Sub-components â”€â”€

  const StatusBadges = ({ player }: { player: BattlePlayer }) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(key => {
        if (!player[key]) return null;
        const cfg  = STATUS_CONFIG[key];
        const Icon = cfg.icon;
        return (
          <span key={key} className={`inline-flex items-center gap-0.5 text-[9px] font-black tracking-widest px-1.5 py-0.5 border rounded-sm ${cfg.color}`}>
            <Icon className="w-2.5 h-2.5" />{cfg.label}
          </span>
        );
      })}
      {player.attackPowerBuff > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-black tracking-widest px-1.5 py-0.5 border rounded-sm text-lime-400 border-lime-500/60 bg-lime-500/10">
          <Zap className="w-2.5 h-2.5" />+{player.attackPowerBuff}% ATK
        </span>
      )}
    </div>
  );

  const TeamSummaryBar = ({ team, label }: { team: BattlePlayer[]; label: string }) => {
    const totalHp    = team.reduce((s, p) => s + p.currentHp, 0);
    const totalMaxHp = team.reduce((s, p) => s + p.maxHp, 0);
    const pct        = totalMaxHp > 0 ? (totalHp / totalMaxHp) * 100 : 0;
    const isBlue     = label === 'BLUE';
    return (
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-black tracking-widest ${isBlue ? 'text-cyan-400' : 'text-red-400'}`}>{label}</span>
          <span className="text-[10px] font-mono text-slate-400">{totalHp}/{totalMaxHp}</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isBlue ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const PlayerHUD = ({ player }: { player: BattlePlayer }) => {
    const hpPct  = (player.currentHp / player.maxHp) * 100;
    const mpPct  = (player.currentMana / player.maxMana) * 100;
    const isDead = player.currentHp <= 0;
    const isCur  = player.position === currentTurn;
    const isShaking = shakingId === player.id;

    return (
      <div className={`
        flex items-start gap-2 p-2 rounded-sm border transition-all duration-300
        ${isDead ? 'opacity-30 grayscale' : ''}
        ${isCur  ? 'border-yellow-400/60 bg-yellow-400/5 shadow-[0_0_12px_rgba(250,204,21,0.15)]' : 'border-slate-700/40 bg-slate-900/30'}
        ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}
      `}>
        {/* Portrait */}
        <div className={`relative w-12 h-12 shrink-0 border-2 overflow-hidden ${player.team === 'blue' ? 'border-cyan-600' : 'border-red-600'}`}
          style={{ clipPath: 'polygon(10% 0%,100% 0%,90% 100%,0% 100%)' }}>
          <img src={CHARACTERS[player.characterClass].image} className="w-full h-full object-cover scale-150" alt="" />
          {isCur && <div className="absolute inset-0 border-2 border-yellow-400 animate-pulse" />}
        </div>
        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-black text-white tracking-wider truncate uppercase">{player.username}</span>
            <span className="text-[9px] font-mono text-slate-500">{player.currentHp}/{player.maxHp}</span>
          </div>
          {/* HP bar */}
          <div className="h-2 bg-slate-900 border border-slate-700/50 overflow-hidden mb-1" style={{ clipPath: 'polygon(0 0,100% 0,97% 100%,0 100%)' }}>
            <div className={`h-full bg-gradient-to-r ${hpColor(hpPct)} transition-all duration-700`} style={{ width: `${hpPct}%` }} />
          </div>
          {/* Mana bar */}
          <div className="h-1.5 bg-slate-900 border border-slate-700/30 overflow-hidden" style={{ clipPath: 'polygon(0 0,100% 0,97% 100%,0 100%)' }}>
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" style={{ width: `${mpPct}%` }} />
          </div>
          <StatusBadges player={player} />
        </div>
      </div>
    );
  };

  const AbilityButton = ({ ability }: { ability: Ability }) => {
    const canAfford = myPlayer ? myPlayer.currentMana >= ability.manaCost : false;
    const needsTarget = ability.type === 'attack' && ability.target === 'single';
    const isReady = canAfford && (!needsTarget || selectedTargets.length === 1);

    return (
      <button
        onClick={() => handleAbilityClick(ability)}
        disabled={!isMyTurn || !canAfford}
        className={`
          group w-full flex items-center gap-3 px-4 py-3 rounded-sm border transition-all duration-200
          ${!canAfford ? 'opacity-40 cursor-not-allowed border-slate-700/30 bg-slate-900/20' :
            isReady    ? 'border-lime-400/50 bg-lime-400/5 hover:bg-lime-400/10 hover:border-lime-400 hover:shadow-[0_0_12px_rgba(163,230,53,0.2)] cursor-pointer' :
                         'border-slate-600/40 bg-slate-900/30 hover:border-slate-500 cursor-pointer'
          }
        `}
      >
        {/* Icon */}
        <div className={`w-8 h-8 shrink-0 rounded-sm flex items-center justify-center border ${
          ability.type === 'attack' ? 'bg-red-500/20 border-red-500/40' : 'bg-blue-500/20 border-blue-500/40'
        }`}>
          {ability.type === 'attack'
            ? <Swords className="w-4 h-4 text-red-400" />
            : <Shield className="w-4 h-4 text-blue-400" />}
        </div>
        {/* Name + desc */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-xs font-black tracking-wider text-white uppercase truncate">{ability.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{ability.description}</div>
          {needsTarget && selectedTargets.length === 0 && canAfford && (
            <div className="text-[9px] text-yellow-400 font-bold animate-pulse">SELECT TARGET FIRST</div>
          )}
        </div>
        {/* Mana cost */}
        <div className="text-right shrink-0">
          <div className={`text-sm font-black font-mono ${canAfford ? 'text-blue-400' : 'text-slate-600'}`}>{ability.manaCost}</div>
          <div className="text-[9px] text-slate-600 tracking-widest">MANA</div>
        </div>
        {/* Damage badge */}
        {ability.damage && (
          <div className="shrink-0 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-sm">
            <span className="text-[10px] font-black text-red-400">{ability.damage} DMG</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col relative overflow-hidden font-mono">

      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,255,150,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,150,1) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Floating damage numbers */}
      {floatingNums.map(fn => (
        <div
          key={fn.id}
          className="absolute pointer-events-none z-50 font-black text-2xl animate-[floatUp_1.2s_ease-out_forwards]"
          style={{
            left: `${fn.x}%`,
            top:  `${fn.y}%`,
            color: fn.type === 'damage' ? '#f87171' : fn.type === 'heal' ? '#4ade80' : fn.type === 'mana' ? '#60a5fa' : '#fbbf24',
            textShadow: `0 0 20px currentColor`,
          }}
        >
          {fn.type === 'damage' ? `-${fn.value}` : fn.type === 'heal' ? `+${fn.value}` : fn.type === 'miss' ? 'MISS' : `-${fn.value}MP`}
        </div>
      ))}

      {/* â”€â”€ TOP BAR â”€â”€ */}
      <div className="shrink-0 bg-black/60 backdrop-blur-md border-b border-slate-800">
        {/* Team HP summary */}
        <div className="flex items-center gap-4 px-6 py-2 border-b border-slate-800/60">
          <TeamSummaryBar team={teamBlue} label="BLUE" />
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div className="text-[9px] text-slate-600 tracking-widest">ROUND</div>
            <div className="text-white font-black text-sm">{Math.floor(currentTurn / 4) + 1}</div>
          </div>
          <TeamSummaryBar team={teamRed} label="RED" />
        </div>

        {/* Current turn + timer */}
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            <span className="text-[10px] text-slate-400 tracking-widest">CURRENT TURN</span>
            <span className="text-white font-black text-sm tracking-wider uppercase">{currentPlayer?.username}</span>
            <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 border rounded-sm ${
              currentPlayer?.team === 'blue' ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' : 'text-red-400 border-red-500/40 bg-red-500/10'
            }`}>
              {currentPlayer?.characterClass?.toUpperCase()}
            </span>
          </div>

          {/* Turn timer */}
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timerColor}`} />
            <div className={`font-black text-lg font-mono ${timerColor}`}>{String(timeLeft).padStart(2, '0')}</div>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerBg}`}
                style={{ width: `${(timeLeft / TURN_TIME) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ MAIN LAYOUT â”€â”€ */}
      <div className="flex flex-1 overflow-hidden">

        {/* â”€â”€ LEFT: Team Blue HUDs â”€â”€ */}
        <div className="w-56 shrink-0 p-3 space-y-2 border-r border-slate-800/60 bg-black/20 overflow-y-auto">
          <div className="text-[9px] text-cyan-400 font-black tracking-widest mb-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" /> TEAM BLUE
          </div>
          {teamBlue.map(p => <PlayerHUD key={p.id} player={p} />)}
        </div>

        {/* â”€â”€ CENTER: Battle arena â”€â”€ */}
        <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">

          {/* Arena floor glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-t from-slate-700/20 to-transparent blur-2xl rounded-full" />

          {/* Character portraits */}
          <div className="flex items-end justify-between w-full px-8 mb-4 relative min-h-[320px]">

            {/* Blue team portraits */}
            <div className="flex items-end gap-6">
              {teamBlue.map(player => {
                const isCur     = player.position === currentTurn;
                const isDead    = player.currentHp <= 0;
                const isTarget  = selectedTargets.includes(player.id);
                const isEnemy   = player.team !== currentPlayer?.team;
                const isShaking = shakingId === player.id;

                return (
                  <div
                    key={player.id}
                    onClick={() => isEnemy && !isDead && setSelectedTargets(prev => prev.includes(player.id) ? [] : [player.id])}
                    className={`relative transition-all duration-500 ${isCur ? '-translate-y-4' : ''} ${isDead ? 'grayscale opacity-40' : ''} ${isEnemy ? 'cursor-pointer' : ''} ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
                  >
                    {isCur && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full blur-lg opacity-70"
                        style={{ background: CLASS_GLOW[player.characterClass] }} />
                    )}
                    {isTarget && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                        <div className="w-6 h-6 rotate-45 border-r-4 border-b-4 border-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                      </div>
                    )}
                    {isCur && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-black text-[10px] font-black tracking-widest px-3 py-0.5 skew-x-[-8deg] shadow-[0_0_16px_rgba(250,204,21,0.5)]">
                        <span className="skew-x-[8deg] inline-block">P{player.position + 1} TURN</span>
                      </div>
                    )}
                    <img
                      src={CHARACTERS[player.characterClass].image}
                      alt={player.characterClass}
                      className={`h-72 w-auto object-contain drop-shadow-2xl transition-all duration-300 ${isTarget ? 'brightness-125 scale-105 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'hover:scale-105'}`}
                    />
                    {player.isInvisible && (
                      <div className="absolute inset-0 bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                        <EyeOff className="w-8 h-8 text-purple-400 opacity-60" />
                      </div>
                    )}
                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="text-red-500 font-black text-3xl -rotate-12 border-4 border-red-500 px-3 py-1 bg-black/70">KO</div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-cyan-500 text-black text-[10px] font-black px-2 py-0.5 tracking-widest">
                      {player.characterClass.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VS */}
            <div className="absolute left-1/2 bottom-8 -translate-x-1/2 z-10">
              <div className="bg-black/60 border border-slate-700 px-3 py-1.5 text-slate-600 font-black text-xs tracking-widest">VS</div>
            </div>

            {/* Red team portraits */}
            <div className="flex items-end gap-6">
              {teamRed.map(player => {
                const isCur     = player.position === currentTurn;
                const isDead    = player.currentHp <= 0;
                const isTarget  = selectedTargets.includes(player.id);
                const isEnemy   = player.team !== currentPlayer?.team;
                const isShaking = shakingId === player.id;

                return (
                  <div
                    key={player.id}
                    onClick={() => isEnemy && !isDead && setSelectedTargets(prev => prev.includes(player.id) ? [] : [player.id])}
                    className={`relative transition-all duration-500 ${isCur ? '-translate-y-4' : ''} ${isDead ? 'grayscale opacity-40' : ''} ${isEnemy ? 'cursor-pointer' : ''} ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
                  >
                    {isCur && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full blur-lg opacity-70"
                        style={{ background: CLASS_GLOW[player.characterClass] }} />
                    )}
                    {isTarget && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                        <div className="w-6 h-6 rotate-45 border-r-4 border-b-4 border-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                      </div>
                    )}
                    {isCur && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-black text-[10px] font-black tracking-widest px-3 py-0.5 skew-x-[-8deg] shadow-[0_0_16px_rgba(250,204,21,0.5)]">
                        <span className="skew-x-[8deg] inline-block">P{player.position + 1} TURN</span>
                      </div>
                    )}
                    <img
                      src={CHARACTERS[player.characterClass].image}
                      alt={player.characterClass}
                      className={`h-72 w-auto object-contain drop-shadow-2xl transition-all duration-300 ${isTarget ? 'brightness-125 scale-105 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'hover:scale-105'}`}
                    />
                    {player.isInvisible && (
                      <div className="absolute inset-0 bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                        <EyeOff className="w-8 h-8 text-purple-400 opacity-60" />
                      </div>
                    )}
                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="text-red-500 font-black text-3xl -rotate-12 border-4 border-red-500 px-3 py-1 bg-black/70">KO</div>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 tracking-widest">
                      {player.characterClass.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* â”€â”€ Battle log â”€â”€ */}
          <div className="w-full px-4 mt-2">
            <div className="bg-black/50 border border-slate-800 rounded-sm max-h-28 overflow-y-auto p-3 space-y-1 scroll-smooth">
              {battleLog.length === 0 && (
                <div className="text-slate-700 text-[10px] italic text-center py-2">Battle log will appear here...</div>
              )}
              {battleLog.map(entry => (
                <div key={entry.id} className={`text-[11px] font-mono leading-snug ${
                  entry.type === 'attack'  ? 'text-red-300' :
                  entry.type === 'defense' ? 'text-blue-300' :
                  entry.type === 'system'  ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  <span className="text-slate-600 mr-1">&rsaquo;</span>{entry.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* â”€â”€ RIGHT: Team Red HUDs + Ability panel â”€â”€ */}
        <div className="w-72 shrink-0 flex flex-col border-l border-slate-800/60 bg-black/20">

          {/* Red team HUDs */}
          <div className="p-3 space-y-2 border-b border-slate-800/60">
            <div className="text-[9px] text-red-400 font-black tracking-widest mb-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" /> TEAM RED
            </div>
            {teamRed.map(p => <PlayerHUD key={p.id} player={p} />)}
          </div>

          {/* Ability panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setSelectedTab(selectedTab === 'attack' ? null : 'attack')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black tracking-widest transition-all border-r border-slate-800 ${
                  selectedTab === 'attack' ? 'bg-red-500/20 text-red-400 border-b-2 border-b-red-500' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Swords className="w-3.5 h-3.5" /> ATTACK
              </button>
              <button
                onClick={() => setSelectedTab(selectedTab === 'defense' ? null : 'defense')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black tracking-widest transition-all ${
                  selectedTab === 'defense' ? 'bg-blue-500/20 text-blue-400 border-b-2 border-b-blue-500' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> DEFEND
              </button>
            </div>

            {/* Mana display */}
            {myPlayer && (
              <div className="px-3 py-2 border-b border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 tracking-widest">YOUR MANA</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${(myPlayer.currentMana / myPlayer.maxMana) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-400">{myPlayer.currentMana}/{myPlayer.maxMana}</span>
                </div>
              </div>
            )}

            {/* Abilities list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedTab === null && (
                <div className="text-center py-8 space-y-2">
                  <div className="text-slate-600 text-xs tracking-widest">Choose your action</div>
                  <div className="flex gap-2 justify-center">
                    <div className="w-8 h-8 border border-red-500/30 bg-red-500/10 flex items-center justify-center rounded-sm">
                      <Swords className="w-4 h-4 text-red-500/50" />
                    </div>
                    <div className="w-8 h-8 border border-blue-500/30 bg-blue-500/10 flex items-center justify-center rounded-sm">
                      <Shield className="w-4 h-4 text-blue-500/50" />
                    </div>
                  </div>
                </div>
              )}
              {selectedTab === 'attack'  && attackAbilities.map(a  => <AbilityButton key={a.id} ability={a} />)}
              {selectedTab === 'defense' && defenseAbilities.map(a => <AbilityButton key={a.id} ability={a} />)}
            </div>

            {/* Selected target hint */}
            {selectedTargets.length > 0 && (
              <div className="px-3 py-2 border-t border-yellow-500/30 bg-yellow-500/5 flex items-center justify-between">
                <span className="text-[10px] text-yellow-400 font-bold tracking-widest">
                  TARGET: {players.find(p => p.id === selectedTargets[0])?.username.toUpperCase()}
                </span>
                <button onClick={() => setSelectedTargets([])} className="text-[9px] text-slate-500 hover:text-white transition-colors">âœ• CLEAR</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)    scale(1);   opacity: 1; }
          60%  { transform: translateY(-40px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-70px) scale(0.9); opacity: 0; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}