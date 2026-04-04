import { useState, useEffect, useCallback } from 'react';
import { Swords, Shield, Zap } from 'lucide-react';
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

  const currentPlayer = players.find(p => p.position === currentTurn);
  const isMyTurn = true; // will be: currentPlayer?.id === loggedInUserId
  const myPlayer = currentPlayer;
  const teamBlue = players.filter(p => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed = players.filter(p => p.team === 'red').sort((a, b) => a.position - b.position);
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

  // â”€â”€ Helpers â”€â”€
  // AbilityButton logic is now integrated into the main menu.

  // Ported status bars to main return for Ben 10 style

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col relative overflow-hidden font-mono">

      {/* Background: Cyberpunk City Vibe */}
      <div className="absolute inset-0 bg-[#0b132b] pointer-events-none">
        {/* Sky / Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c2e4a] via-[#101b33] to-[#0b132b]" />

        {/* City skyline silhouettes using gradients */}
        <div className="absolute bottom-[20%] left-0 right-0 h-[40%] bg-[linear-gradient(to_right,#000_10%,transparent_10%,transparent_15%,#000_15%,#000_25%,transparent_25%,transparent_30%,#000_30%,#000_45%,transparent_45%,transparent_50%,#000_50%,#000_65%,transparent_65%,transparent_75%,#000_75%,#000_85%,transparent_85%,transparent_90%,#000_90%)] opacity-30" style={{ backgroundSize: '200px 100%' }} />
        <div className="absolute bottom-[20%] left-0 right-0 h-[30%] bg-[linear-gradient(to_right,#091024_5%,transparent_5%,transparent_12%,#091024_12%,#091024_20%,transparent_20%,transparent_28%,#091024_28%,#091024_38%,transparent_38%,transparent_48%,#091024_48%,#091024_60%,transparent_60%,transparent_70%,#091024_70%,#091024_80%,transparent_80%,transparent_88%,#091024_88%)] opacity-80" style={{ backgroundSize: '150px 100%' }} />
        <div className="absolute bottom-[20%] left-0 right-0 h-[20%] bg-[linear-gradient(to_right,#152545_8%,transparent_8%,transparent_18%,#152545_18%,#152545_30%,transparent_30%,transparent_40%,#152545_40%,#152545_52%,transparent_52%,transparent_62%,#152545_62%,#152545_72%,transparent_72%,transparent_82%,#152545_82%,#152545_92%,transparent_92%,transparent_98%,#152545_98%)] opacity-90" style={{ backgroundSize: '100px 100%' }} />

        {/* Neon Windows / Lights */}
        <div className="absolute bottom-[20%] left-0 right-0 h-[40%] bg-[radial-gradient(ellipse_at_center,_#38bdf8_0%,_transparent_2px)] opacity-40" style={{ backgroundSize: '15px 25px' }} />
        <div className="absolute bottom-[20%] left-0 right-0 h-[30%] bg-[radial-gradient(ellipse_at_center,_#a78bfa_0%,_transparent_2px)] opacity-50" style={{ backgroundSize: '20px 30px', backgroundPosition: '10px 15px' }} />
        <div className="absolute bottom-[20%] left-0 right-0 h-[20%] bg-[radial-gradient(ellipse_at_center,_#4ade80_0%,_transparent_2px)] opacity-60" style={{ backgroundSize: '12px 20px', backgroundPosition: '5px 5px' }} />

        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#050a14] to-[#121f3a] border-t-2 border-[#1e3a5f]" />
      </div>

      {/* Floating damage numbers removed for Ben 10 style */}

      {/* â”€â”€ Ambient Glare & Vibrancy Pass â”€â”€ */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-radial-gradient from-purple-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* â”€â”€ HUD: Slanted Top Status Bars (All 4 Players) â”€â”€ */}
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
                <Zap className={`w-8 h-8 ${isActive ? 'text-cyan-400' : isTarget ? 'text-red-500' : 'text-slate-500'}`} />
                <div className="absolute top-0 right-0 w-6 h-6 bg-red-600 border border-slate-700 font-black text-[8px] flex items-center justify-center rotate-45 translate-x-1 -translate-y-1">
                  <span className="-rotate-45">30</span>
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
                <Shield className={`w-8 h-8 ${isActive ? 'text-cyan-400' : isTarget ? 'text-red-500' : 'text-slate-500'}`} />
                <div className="absolute top-0 left-0 w-6 h-6 bg-cyan-600 border border-slate-700 font-black text-[8px] flex items-center justify-center -rotate-45 -translate-x-1 -translate-y-1">
                  <span className="rotate-45">42</span>
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

      {/* SIDE HUDs removed for cleaner Ben 10 style */}

      {/* ——— CENTER: Battle arena (1v1 Focused) ——— */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Arena floor glow */}
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-gradient-to-t from-slate-700/10 to-transparent blur-3xl opacity-50" />

        {/* Portraits Container */}
        <div className="flex items-center justify-center w-full max-w-4xl px-32 relative">

          {/* Blue Team Representative (Left) */}
          {(() => {
            const target = players.find(p => p.id === selectedTargets[0]);
            const blueRep = myPlayer?.team === 'blue' ? myPlayer : target?.team === 'blue' ? target : teamBlue.find(p => p.currentHp > 0) || teamBlue[0];
            if (!blueRep) return null;

            const isActive = myPlayer?.id === blueRep.id;
            const isTarget = selectedTargets.includes(blueRep.id);

            return (
              <div className={`relative transition-all duration-500 -translate-x-12 ${shakingId === blueRep.id ? 'animate-[shake_0.4s_ease-in-out]' : ''} ${isActive ? 'scale-110' : isTarget ? 'scale-100' : 'opacity-70 scale-90 grayscale-[0.2]'}`}>
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 ${isActive ? 'bg-lime-400/20 shadow-[0_0_40px_rgba(163,230,53,0.3)] animate-pulse' : isTarget ? 'bg-red-600/10' : 'bg-slate-700/10'} blur-xl rounded-full`} />
                <img src={CHARACTERS[blueRep.characterClass].image} className={`h-32 w-auto object-contain transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_15px_rgba(163,230,53,0.4)]' : isTarget ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.2)] grayscale-[0.5] contrast-[1.1] opacity-90' : 'drop-shadow-none'}`} alt="" />
                {isActive ? (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg] shadow-[0_0_15px_rgba(163,230,53,0.5)]">
                    PLAYER TURN
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg]">
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

            const isActive = myPlayer?.id === redRep.id;
            const isTarget = selectedTargets.includes(redRep.id);

            return (
              <div className={`relative transition-all duration-500 translate-x-12 ${shakingId === redRep.id ? 'animate-[shake_0.4s_ease-in-out]' : ''} ${isActive ? 'scale-110' : isTarget ? 'scale-100' : 'opacity-70 scale-90 grayscale-[0.2]'}`}>
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 ${isActive ? 'bg-red-600/20' : isTarget ? 'bg-red-600/10' : 'bg-slate-700/10'} blur-xl rounded-full`} />
                <img src={CHARACTERS[redRep.characterClass].image} className={`h-32 w-auto object-contain transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : isTarget ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.2)] grayscale-[0.5] contrast-[1.1] opacity-90' : 'drop-shadow-none'}`} alt="" />
                {isActive ? (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg]">
                    PLAYER TURN
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg]">
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
              {(selectedTab === 'attack' ? attackAbilities : defenseAbilities).map((ability) => {
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



          {/* Control hints */}

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
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          15% { transform: translateX(0) skewX(-15deg); opacity: 1; }
          85% { transform: translateX(5%) skewX(-15deg); opacity: 1; }
          100% { transform: translateX(100%) skewX(-15deg); opacity: 0; }
        }
        @keyframes cinematicRight {
          0% { transform: translateX(100%) skewX(15deg); opacity: 0; }
          15% { transform: translateX(0) skewX(15deg); opacity: 1; }
          85% { transform: translateX(-5%) skewX(15deg); opacity: 1; }
          100% { transform: translateX(-100%) skewX(15deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}