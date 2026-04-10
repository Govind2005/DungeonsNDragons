import { useState, useEffect, useCallback } from 'react';
import { Swords, Shield, Zap } from 'lucide-react';
import { CharacterClass, CHARACTERS, Ability } from '../lib/gameData';
import { useAuth } from '../contexts/AuthContext';

// ── Character head imports ───────────────────────────────────────────────────
import barbarianHead from '../characters/barbarian_head.png';
import knightHead    from '../characters/knight_head.png';
import rangerHead    from '../characters/ranger_head.png';
import wizardHead    from '../characters/wizard_head.png';

const CHARACTER_HEADS: Record<CharacterClass, string> = {
  barbarian: barbarianHead,
  knight:    knightHead,
  ranger:    rangerHead,
  wizard:    wizardHead,
};

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

// Floating number type removed

// Log removed as per request

interface BattleScreenProps {
  players: BattlePlayer[];
  currentTurn: number;
  onAttack: (abilityId: string, targetIds: string[]) => void;
  onDefense: (abilityId: string) => void;
}

// Timer removed as per request

// Style configurations moved or removed

export function BattleScreen({ players, currentTurn, onAttack, onDefense }: BattleScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'attack' | 'defense' | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [cinematicAction, setCinematicAction] = useState<{ ability: Ability; player: BattlePlayer; isLeft: boolean } | null>(null);

  const { user } = useAuth();
  const currentPlayer = players.find(p => p.position === currentTurn);
  const myPlayer = players.find(p => p.id === user?.id);
  const isMyTurn = currentPlayer?.id === user?.id;
  
  const teamBlue = players.filter(p => p.team === 'blue').sort((a: BattlePlayer, b: BattlePlayer) => a.position - b.position);
  const teamRed = players.filter(p => p.team === 'red').sort((a: BattlePlayer, b: BattlePlayer) => a.position - b.position);
  const abilities = myPlayer ? CHARACTERS[myPlayer.characterClass].abilities : [];
  const attackAbilities = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');

  // â”€â”€ Turn initialization â”€â”€
  useEffect(() => {
    setSelectedTab(null);
    setSelectedTargets([]);
  }, [currentTurn]);

  // Log listener removed

  // Auto-targeting opponent if none selected
  useEffect(() => {
    if (selectedTargets.length === 0 && currentPlayer) {
      const enemies = (currentPlayer.team === 'blue' ? teamRed : teamBlue).filter(p => p.currentHp > 0);
      if (enemies.length > 0) setSelectedTargets([enemies[0].id]);
    }
  }, [currentTurn, currentPlayer, selectedTargets]);

  // Floating numbers logic removed for clarity

  const triggerShake = useCallback((playerId: string) => {
    setShakingId(playerId);
    setTimeout(() => setShakingId(null), 500);
  }, []);

  const executeAction = useCallback((ability: Ability, targets: string[]) => {
    if (ability.type === 'attack') {
      targets.forEach(id => triggerShake(id));
      onAttack(ability.id, targets);
    } else {
      onDefense(ability.id);
    }
  }, [onAttack, onDefense, triggerShake]);

  const handleAbilityClick = (ability: Ability) => {
    if (!isMyTurn || !myPlayer || myPlayer.currentMana < ability.manaCost || cinematicAction) return;
    
    let targetsToUse = selectedTargets;
    if (ability.type === 'attack') {
      if (ability.target === 'aoe') {
        const enemies = (currentPlayer?.team === 'blue' ? teamRed : teamBlue).filter(p => p.currentHp > 0);
        targetsToUse = enemies.map(p => p.id);
      } else {
        if (selectedTargets.length !== 1) return;
      }
    }

    const isLeft = myPlayer.team === 'blue';
    setCinematicAction({ ability, player: myPlayer, isLeft });
    setSelectedTab(null);
    setSelectedTargets([]);

    setTimeout(() => {
      executeAction(ability, targetsToUse);
      setCinematicAction(null);
    }, 1500);
  };

  // ── Helpers ──
  // AbilityButton logic is now integrated into the main menu.

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col relative overflow-hidden font-mono">

      {/* ═ THE ENVIRONMENT: Cyberpunk Arena ═ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sky gradient base */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, #1a2a6c 0%, #0b132b 50%, #060a18 100%)'
        }}/>

        {/* Team ambient glows */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 15% 60%, rgba(0,234,255,0.18) 0%, transparent 50%)'
        }}/>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 85% 60%, rgba(255,45,122,0.18) 0%, transparent 50%)'
        }}/>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(123,47,255,0.22) 0%, transparent 60%)'
        }}/>

        {/* Stars field */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice">
          {([
            [80,40,1],[180,20,1.5],[320,55,1],[450,15,1],[600,35,1.5],
            [720,50,1],[850,22,1],[950,60,1.5],[1050,30,1],[1150,45,1],
            [140,80,1],[400,90,1],[700,75,1],[1000,85,1],[250,120,1],
            [560,100,1],[900,110,1],[350,65,1],[480,30,1.5],[780,48,1],
            [1100,20,1.5],[50,90,1],[670,18,1],[1020,55,1]
          ] as [number,number,number][]).map(([x,y,r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.35 + (i % 4) * 0.15}/>
          ))}
        </svg>

        {/* Moon */}
        <div className="absolute" style={{ top: 38, right: 210, width: 58, height: 58 }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: '#daeeff',
            boxShadow: '0 0 50px 20px rgba(126,200,240,0.28), 0 0 100px 40px rgba(126,200,240,0.12)'
          }}/>
        </div>

        {/* City Skyline Layers */}
        <svg className="absolute w-full" style={{ bottom: '30%' }} viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax meet">
          <g fill="#0d1b35">
            <rect x="0" y="160" width="35" height="180"/><rect x="38" y="110" width="20" height="230"/>
            <rect x="60" y="140" width="40" height="200"/><rect x="103" y="90" width="25" height="250"/>
            <rect x="1142" y="140" width="58" height="200"/>
          </g>
          <g fill="#0f2240">
            <rect x="20" y="50" width="62" height="290"/><rect x="85" y="20" width="46" height="320"/>
            <rect x="1060" y="40" width="66" height="300"/><rect x="915" y="5" width="43" height="335"/>
          </g>
          {/* Neon windows */}
          <g fill="#00eaff" opacity="0.75">
            <rect x="28" y="58" width="7" height="4"/><rect x="50" y="58" width="7" height="4"/>
            <rect x="1067" y="48" width="7" height="4"/><rect x="1093" y="48" width="7" height="4"/>
          </g>
        </svg>

        {/* Floor Horizon & Grid */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-b from-[#0a1628] to-[#030609]" />
        <div className="absolute left-0 right-0" style={{ bottom: '30%', height: 2, background: 'rgba(0,234,255,0.5)', boxShadow: '0 0 20px 5px rgba(0,234,255,0.35)' }} />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 38%, rgba(2,4,8,0.78) 100%)'
      }}/>

      {/* HUD: Slanted Top Status Bars (All 4 Players) */}
      <div className="absolute top-4 left-6 z-30 flex flex-col gap-4">
        {teamBlue.map((p) => {
          const isActive = p.id === currentPlayer?.id;
          const isTarget = selectedTargets.includes(p.id);
          return (
            <div key={p.id}
              onClick={() => p.currentHp > 0 && setSelectedTargets([p.id])}
              className={`flex items-start gap-3 transition-all duration-300 ${isActive ? 'scale-110 -translate-x-2' : isTarget ? 'scale-105 translate-x-2' : 'opacity-80 scale-90 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 cursor-pointer'}`}
            >
              <div className={`relative w-16 h-16 bg-slate-900 border-4 rounded-full flex items-center justify-center overflow-hidden shadow-2xl ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : isTarget ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-slate-700'}`}>
                <img src={CHARACTER_HEADS[p.characterClass]} className="w-full h-full object-cover scale-110" alt="" />
                <div className="absolute top-0 right-0 w-6 h-6 bg-red-600 border border-slate-700 font-black text-[8px] flex items-center justify-center rotate-45 translate-x-1 -translate-y-1">
                  <span className="-rotate-45">{p.position}</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 pt-1">
                <div className="text-[9px] font-black text-white tracking-widest uppercase">{p.username}</div>
                <div className={`relative w-56 h-6 bg-slate-900 border-r-4 ${isActive ? 'border-cyan-400/80' : 'border-red-600/80'} skew-x-[-15deg] overflow-hidden`}>
                  <div className={`h-full transition-all duration-700 ${isActive ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-orange-400'}`} style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[15deg] font-black text-white text-[10px] tracking-widest">
                    {p.currentHp}/{p.maxHp}
                  </div>
                </div>
                <div className="relative w-48 h-4 bg-slate-900 border-r-4 border-lime-600/80 skew-x-[-15deg] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-lime-600 to-lime-400 transition-all duration-700" style={{ width: `${(p.currentMana / p.maxMana) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[15deg] font-black text-white text-[8px] tracking-widest">
                    {p.currentMana}/{p.maxMana}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-4">
        {teamRed.map((p) => {
          const isActive = p.id === currentPlayer?.id;
          const isTarget = selectedTargets.includes(p.id);
          return (
            <div key={p.id}
              onClick={() => p.currentHp > 0 && setSelectedTargets([p.id])}
              className={`flex items-start gap-3 flex-row-reverse transition-all duration-300 ${isActive ? 'scale-110 translate-x-2' : isTarget ? 'scale-105 -translate-x-2' : 'opacity-80 scale-90 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 cursor-pointer'}`}
            >
              <div className={`relative w-16 h-16 bg-slate-900 border-4 rounded-full flex items-center justify-center overflow-hidden shadow-2xl ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : isTarget ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-slate-700'}`}>
                <img src={CHARACTER_HEADS[p.characterClass]} className="w-full h-full object-cover scale-110" alt="" />
                <div className="absolute top-0 left-0 w-6 h-6 bg-cyan-600 border border-slate-700 font-black text-[8px] flex items-center justify-center -rotate-45 -translate-x-1 -translate-y-1">
                  <span className="rotate-45">{p.position}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 pt-1">
                <div className="text-[9px] font-black text-white tracking-widest uppercase">{p.username}</div>
                <div className={`relative w-56 h-6 bg-slate-900 border-l-4 ${isActive ? 'border-cyan-400/80' : 'border-red-600/80'} skew-x-[15deg] overflow-hidden`}>
                  <div className={`h-full transition-all duration-700 ${isActive ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-orange-400 to-red-600'}`} style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[-15deg] font-black text-white text-[10px] tracking-widest">
                    {p.currentHp}/{p.maxHp}
                  </div>
                </div>
                <div className="relative w-48 h-4 bg-slate-900 border-l-4 border-lime-600/80 skew-x-[15deg] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-lime-400 to-lime-600 transition-all duration-700" style={{ width: `${(p.currentMana / p.maxMana) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[-15deg] font-black text-white text-[8px] tracking-widest">
                    {p.currentMana}/{p.maxMana}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ——— TURN BANNER ——— */}
      <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
        {isMyTurn ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.8)]" />
            <span className="text-lime-400 text-2xl font-black tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(163,230,53,0.5)]">YOUR TURN</span>
            <div className="w-3 h-3 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.8)]" />
          </div>
        ) : currentPlayer ? (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400/60" />
            <span className="text-amber-400/80 text-lg font-black tracking-[0.4em] uppercase">WAITING FOR {currentPlayer.username.toUpperCase()}</span>
            <div className="w-2 h-2 rounded-full bg-amber-400/60" />
          </div>
        ) : null}
      </div>

      {/* ——— CENTER: Battle arena (1v1 Focused) ——— */}
      <div className="flex-1 relative flex flex-col items-center justify-end overflow-hidden pb-4">
        {/* Arena floor glow */}
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[900px] h-40 bg-gradient-to-t from-slate-700/10 to-transparent blur-3xl opacity-50" />

        {/* Portraits Container */}
        <div className="flex items-end justify-center w-full max-w-6xl px-16 relative gap-32">

          {/* Blue Team Representative (Left) */}
          {(() => {
            const target = players.find(p => p.id === selectedTargets[0]);
            const blueRep = myPlayer?.team === 'blue' ? myPlayer : target?.team === 'blue' ? target : teamBlue.find(p => p.currentHp > 0) || teamBlue[0];
            if (!blueRep) return null;

            const isTurnPlayer = currentPlayer?.id === blueRep.id;
            const isTarget = selectedTargets.includes(blueRep.id);

            return (
              <div className={`relative transition-all duration-500 ${shakingId === blueRep.id ? 'animate-[shake_0.4s_ease-in-out]' : ''} ${isTurnPlayer ? 'scale-110' : isTarget ? 'scale-100' : 'opacity-70 scale-90 grayscale-[0.2]'}`}>
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 h-16 ${isTurnPlayer ? 'bg-lime-400/20 shadow-[0_0_50px_rgba(163,230,53,0.35)] animate-pulse' : isTarget ? 'bg-red-600/10' : 'bg-slate-700/10'} blur-xl rounded-full`} />
                <img src={CHARACTERS[blueRep.characterClass].image} className={`h-80 w-auto object-contain transition-all duration-300 ${isTurnPlayer ? 'drop-shadow-[0_0_25px_rgba(163,230,53,0.6)]' : isTarget ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] grayscale-[0.5] contrast-[1.1] opacity-90' : 'drop-shadow-none'}`} alt="" />
                {isTurnPlayer ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg] shadow-[0_0_15px_rgba(163,230,53,0.5)] whitespace-nowrap">
                    {blueRep.id === user?.id ? '► YOUR TURN' : `${blueRep.username.toUpperCase()}'S TURN`}
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg] whitespace-nowrap">
                    TARGET
                  </div>
                ) : null}
              </div>
            );
          })()}

          {/* Red Team Representative (Right) */}
          {(() => {
            const target = players.find(p => p.id === selectedTargets[0]);
            const redRep = myPlayer?.team === 'red' ? myPlayer : target?.team === 'red' ? target : teamRed.find(p => p.currentHp > 0) || teamRed[0];
            if (!redRep) return null;

            const isTurnPlayer = currentPlayer?.id === redRep.id;
            const isTarget = selectedTargets.includes(redRep.id);

            return (
              <div className={`relative transition-all duration-500 ${shakingId === redRep.id ? 'animate-[shake_0.4s_ease-in-out]' : ''} ${isTurnPlayer ? 'scale-110' : isTarget ? 'scale-100' : 'opacity-70 scale-90 grayscale-[0.2]'}`}>
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 h-16 ${isTurnPlayer ? 'bg-red-600/25 shadow-[0_0_50px_rgba(239,68,68,0.35)] animate-pulse' : isTarget ? 'bg-red-600/10' : 'bg-slate-700/10'} blur-xl rounded-full`} />
                <img 
                  src={CHARACTERS[redRep.characterClass].image} 
                  className={`h-80 w-auto object-contain transition-all duration-300 ${isTurnPlayer ? 'drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]' : isTarget ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] grayscale-[0.5] contrast-[1.1] opacity-90' : 'drop-shadow-none'}`} 
                  style={{ transform: 'scaleX(-1)' }}
                  alt="" 
                />
                {isTurnPlayer ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg] shadow-[0_0_15px_rgba(163,230,53,0.5)] whitespace-nowrap">
                    {redRep.id === user?.id ? '► YOUR TURN' : `${redRep.username.toUpperCase()}'S TURN`}
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg] whitespace-nowrap">
                    TARGET
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>


      {/* â”€â”€ CINEMATIC ACTION OVERLAY â”€â”€ */}
      {cinematicAction && (
        <div className="absolute inset-0 z-50 flex items-center overflow-hidden pointer-events-none drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className={`absolute w-[120%] h-64 flex items-center px-32 relative
            ${cinematicAction.isLeft ? 'bg-red-600 animate-[cinematicLeft_1.5s_ease-out_forwards] -left-[10%] border-y-8 border-red-500' 
                                     : 'bg-red-600 animate-[cinematicRight_1.5s_ease-out_forwards] -right-[10%] border-y-8 border-red-500'}
            ${cinematicAction.ability.type === 'defense' ? '!bg-cyan-600 !border-cyan-400' : ''}
          `}>
            {/* Cinematic Character Image */}
            <img 
              src={CHARACTERS[cinematicAction.player.characterClass].image} 
              className={`h-[400px] w-auto object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.6)] absolute -bottom-10
                ${cinematicAction.isLeft ? 'left-48' : 'right-48 scale-x-[-1]'}
              `} 
              alt=""
            />
            
            {/* Cinematic Typography */}
            <div className={`absolute flex flex-col z-10 w-1/2
              ${cinematicAction.isLeft ? 'left-[450px] text-left' : 'right-[450px] text-right'}
            `}>
              <span className="text-4xl font-black text-yellow-400 tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic uppercase">
                {cinematicAction.ability.type === 'attack' ? 'ATTACK' : 'DEFENSE'}
              </span>
              <span 
                className={`text-7xl font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] italic uppercase transform 
                   ${cinematicAction.isLeft ? '-skew-x-[10deg]' : 'skew-x-[10deg]'}
                `} 
                style={{ WebkitTextStroke: `3px ${cinematicAction.ability.type === 'attack' ? '#991b1b' : '#0891b2'}` }}
              >
                {cinematicAction.ability.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ OVERLAPPING ABILITY MENU (Zig-Zag Vertical) â”€â”€ */}
      {selectedTab && !cinematicAction && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="w-full max-w-xl flex flex-col items-center gap-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3.5 h-3.5 rounded-full ${selectedTab === 'attack' ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_15px_currentColor]`} />
              <h2 className="text-xl font-black text-white tracking-[0.4em] uppercase">{selectedTab} ABILITIES</h2>
              <div className={`w-3.5 h-3.5 rounded-full ${selectedTab === 'attack' ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_15px_currentColor]`} />
            </div>

            <div className="w-full space-y-4">
              {(selectedTab === 'attack' ? attackAbilities : defenseAbilities).map((ability: Ability) => {
                const canAfford = myPlayer ? myPlayer.currentMana >= ability.manaCost : false;
                const needsTarget = ability.type === 'attack' && ability.target === 'single';
                const isReady = canAfford && (!needsTarget || selectedTargets.length === 1);

                return (
                  <button
                    key={ability.id}
                    onClick={() => handleAbilityClick(ability)}
                    disabled={!isReady}
                    className={`
                      relative w-full group transition-all duration-300
                      ${isReady ? 'hover:scale-[1.02]' : 'opacity-40 cursor-not-allowed grayscale'}
                    `}
                  >
                    {/* The zig-zag bar background */}
                    <div className={`
                      h-20 w-full relative skew-x-[-8deg] border-y-2 border-r-8 transition-colors duration-300
                      ${selectedTab === 'attack'
                        ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.2)]'
                        : 'bg-cyan-600 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]'}
                    `}>
                      {/* Inner Shine */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />

                      {/* Content (counter-skewed) */}
                      <div className="absolute inset-0 flex items-center px-8 skew-x-[8deg] gap-6">
                        <div className={`w-12 h-12 flex items-center justify-center bg-black/30 border-2 ${selectedTab === 'attack' ? 'border-red-400' : 'border-cyan-400'}`}>
                          {selectedTab === 'attack' ? <Swords className="w-7 h-7 text-white" /> : <Shield className="w-7 h-7 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-lg font-black text-white tracking-widest uppercase mb-0.5">{ability.name}</div>
                          <div className="text-[10px] text-white/70 font-bold uppercase tracking-tight italic line-clamp-1">{ability.description}</div>
                        </div>
                        {/* Mana Hex-ish badge */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <div className={`absolute inset-0 bg-black/40 rotate-[30deg] border border-white/20`} />
                          <div className="relative flex flex-col items-center">
                            <span className="text-lg font-black text-white font-mono leading-none">{ability.manaCost}</span>
                            <span className="text-[8px] font-black text-white/60 tracking-widest leading-none">MP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedTab(null)}
              className="mt-8 px-12 py-3 bg-slate-800 border border-slate-600 text-slate-400 font-black text-xs tracking-[0.5em] uppercase hover:bg-slate-700 hover:text-white transition-all"
            >
              CANCEL [ESC]
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ BOTTOM ACTION PANEL â”€â”€ */}
      <div className="shrink-0 bg-black/80 backdrop-blur-xl border-t border-slate-800/80 z-40">
        <div className="flex items-center justify-center p-6 gap-8 bg-slate-900/40">
          <div className="absolute left-10 flex items-center gap-2">
            <div className="w-16 h-16 bg-white/5 border-4 border-slate-600 rounded-lg flex items-center justify-center relative shadow-2xl"
              style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)' }}>
              <div className="w-10 h-10 bg-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                <Swords className="w-6 h-6 text-slate-900" />
              </div>
            </div>
          </div>

          {isMyTurn ? (
            <>
              {/* Attack Button */}
              <button
                onClick={() => setSelectedTab(selectedTab === 'attack' ? null : 'attack')}
                className={`
                  relative flex items-center justify-center gap-3 px-10 py-5 rounded-md transition-all duration-300 border-b-4 border-r-4 group
                  ${selectedTab === 'attack' ? 'bg-red-500 border-red-700 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-[0.98]' : 'bg-[#e53935] border-[#b71c1c] text-white hover:bg-red-500 hover:border-[#c62828]'}
                `}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
              >
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-widest uppercase pe-4">ATTACK</span>
              </button>

              {/* Defense Button */}
              <button
                onClick={() => setSelectedTab(selectedTab === 'defense' ? null : 'defense')}
                className={`
                  relative flex items-center justify-center gap-3 px-10 py-5 rounded-md transition-all duration-300 border-b-4 border-r-4 group
                  ${selectedTab === 'defense' ? 'bg-cyan-400 border-cyan-600 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] scale-[0.98]' : 'bg-[#00acc1] border-[#006064] text-white hover:bg-[#00bcd4] hover:border-[#00838f]'}
                `}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
              >
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-widest uppercase pe-4">DEFENSE</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 py-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400/90 text-lg font-black tracking-[0.3em] uppercase">
                WAITING FOR {currentPlayer?.username?.toUpperCase() || '...'}
              </span>
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            </div>
          )}

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
        @keyframes cinematicLeft {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          15%  { transform: translateX(0)     skewX(-15deg); opacity: 1; }
          85%  { transform: translateX(5%)    skewX(-15deg); opacity: 1; }
          100% { transform: translateX(100%)  skewX(-15deg); opacity: 0; }
        }
        @keyframes cinematicRight {
          0%   { transform: translateX(100%)  skewX(15deg); opacity: 0; }
          15%  { transform: translateX(0)     skewX(15deg); opacity: 1; }
          85%  { transform: translateX(-5%)   skewX(15deg); opacity: 1; }
          100% { transform: translateX(-100%) skewX(15deg); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}