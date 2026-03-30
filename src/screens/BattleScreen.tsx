import { useState } from 'react';
import { Swords, Shield } from 'lucide-react';
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

export function BattleScreen({
  players,
  currentTurn,
  onAttack,
  onDefense,
  lastAction,
}: BattleScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'attack' | 'defense' | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const currentPlayer = players.find((p) => p.position === currentTurn);
  const isMyTurn = true; 
  const myPlayer = currentPlayer;

  const teamBlue = players.filter((p) => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed = players.filter((p) => p.team === 'red').sort((a, b) => a.position - b.position);

  const abilities = myPlayer ? CHARACTERS[myPlayer.characterClass].abilities : [];
  const attackAbilities = abilities.filter((a) => a.type === 'attack');
  const defenseAbilities = abilities.filter((a) => a.type === 'defense');

  const renderHealthAndManaBars = (player: BattlePlayer) => {
    const hpPercent = (player.currentHp / player.maxHp) * 100;
    const mpPercent = (player.currentMana / player.maxMana) * 100;
    const isDead = player.currentHp <= 0;
    const isCurrent = player.position === currentTurn;

    return (
      <div key={player.id} className={`flex items-start gap-3 ${isDead ? 'opacity-40 grayscale' : ''} ${isCurrent ? 'scale-105' : 'scale-100'} transition-all`}>
        <div className={`relative w-16 h-16 border-2 ${player.team === 'blue' ? 'border-cyan-500' : 'border-red-500'} bg-slate-800 overflow-hidden skew-x-[-10deg]`}>
           <img 
             src={CHARACTERS[player.characterClass].image} 
             className="w-full h-full object-cover skew-x-[10deg] scale-150" 
             alt="portrait" 
           />
           {isCurrent && <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse"></div>}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-black italic tracking-tighter text-white mb-1 uppercase">
            <span>{player.username}</span>
            <span>{player.currentHp}/{player.maxHp}</span>
          </div>
          
          {/* Health Bar (Slanted) */}
          <div className="h-4 bg-slate-900 border border-slate-700 skew-x-[-15deg] overflow-hidden mb-1">
            <div
              className={`h-full transition-all duration-700 ${player.team === 'blue' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          
          {/* Mana Bar (Slanted) */}
          <div className="h-2 bg-slate-900 border border-slate-700 skew-x-[-15deg] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-600 to-lime-400 transition-all duration-700"
              style={{ width: `${mpPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerPortrait = (player: BattlePlayer) => {
    const isCurrentTurn = player.position === currentTurn;
    const isTargeted = selectedTargets.includes(player.id);
    const isEnemy = player.team !== currentPlayer?.team;
    const isDead = player.currentHp <= 0;

    return (
      <div
        onClick={() => {
          if (isEnemy && !isDead) {
            setSelectedTargets(prev => prev.includes(player.id) ? [] : [player.id]);
          }
        }}
        className={`relative transition-all duration-500 cursor-pointer ${
          isCurrentTurn ? 'translate-y-[-10px] z-20' : 'translate-y-0'
        } ${isDead ? 'grayscale opacity-50' : ''}`}
      >
        <div className={`relative group ${isTargeted ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : ''}`}>
          {isCurrentTurn && (
            <div className="absolute -inset-4 bg-lime-400/10 animate-pulse blur-xl rounded-full"></div>
          )}
          
          <img 
            src={CHARACTERS[player.characterClass].image} 
            alt={player.characterClass}
            className={`h-[300px] md:h-[450px] w-auto object-contain transition-all duration-500 drop-shadow-2xl ${
              isDead ? 'grayscale opacity-40' : 'group-hover:scale-105'
            }`}
          />

          {isTargeted && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 animate-bounce">
                <div className="w-6 h-6 rotate-45 border-r-4 border-b-4 border-yellow-400"></div>
             </div>
          )}

          {isDead && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-red-500 font-black text-4xl -rotate-12 border-4 border-red-500 px-4 py-1 shadow-[0_0_20px_rgba(239,68,68,0.6)] bg-black/60 backdrop-blur-sm">KO</div>
            </div>
          )}
          
          <div className={`absolute -bottom-2 ${player.team === 'blue' ? 'left-0' : 'right-0'} z-20`}>
             <div className={`text-[11px] font-black tracking-widest uppercase py-1 px-3 shadow-xl ${player.team === 'blue' ? 'bg-cyan-500 text-black translate-x-[-10px]' : 'bg-red-500 text-white translate-x-[10px]'}`}>
               {player.characterClass}
             </div>
          </div>
        </div>

        {isCurrentTurn && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 px-4 py-1 transform -skew-x-12 shadow-[0_0_20px_rgba(250,204,21,0.5)] border-2 border-black z-30">
            <span className="text-black font-black text-xs tracking-wider skew-x-12 inline-block font-mono">
              P{player.position + 1} TURN
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderAbilityButton = (ability: Ability) => {
    const canAfford = myPlayer ? myPlayer.currentMana >= ability.manaCost : false;

    return (
      <button
        key={ability.id}
        disabled={!isMyTurn || !canAfford}
        onClick={() => {
          if (ability.type === 'attack') {
            if (ability.target === 'aoe') {
              const enemyTeam = currentPlayer?.team === 'blue' ? teamRed : teamBlue;
              onAttack(ability.id, enemyTeam.filter(p => p.currentHp > 0).map((p) => p.id));
            } else if (ability.target === 'single') {
              if (selectedTargets.length === 1) {
                onAttack(ability.id, selectedTargets);
                setSelectedTargets([]);
                setSelectedTab(null as any);
              } else {
                alert("Please click an enemy to target, then click the ability again.");
              }
            }
          } else {
            onDefense(ability.id);
            setSelectedTab(null as any);
          }
        }}
        className="group relative w-full mb-2 flex items-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {/* Jagged Background */}
        <div className={`absolute inset-0 skew-x-[-20deg] ${ability.type === 'attack' ? 'bg-red-600' : 'bg-cyan-600'} border-y-4 border-black z-0 shadow-xl`}></div>
        
        {/* Sawtooth decoration */}
        <div className="absolute left-[-10px] top-0 bottom-0 w-8 bg-black skew-x-[-20deg] z-10 flex flex-col justify-around">
           {[...Array(4)].map((_, i) => <div key={i} className="w-4 h-4 bg-slate-900 border-r-2 border-slate-600 rotate-45 transform translate-x-3"></div>)}
        </div>

        <div className="relative z-20 w-full px-12 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-black/40 rounded-full border border-white/20">
                {ability.type === 'attack' ? <Swords className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
             </div>
             <div className="text-left">
                <div className="font-black italic text-white tracking-wider text-sm md:text-base uppercase">{ability.name}</div>
                <div className="text-[10px] text-black/80 font-bold -mt-1 tracking-tight leading-none max-w-[150px] truncate">{ability.description}</div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-black/60 font-black tracking-tighter">MANA COST</span>
                <span className="text-xl font-black italic text-white -mt-2">{ability.manaCost}</span>
             </div>
             <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center border-2 border-black/40 group-hover:bg-black/50 transition-colors">
                <div className={`w-6 h-6 rounded-full border-2 ${canAfford ? 'bg-lime-400' : 'bg-red-500'} animate-pulse`}></div>
             </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10">
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-1">
          <div className="text-center font-black text-sm tracking-widest">DUNGEONS & DRAGONS</div>
        </div>

        <div className="px-8 py-2 flex items-center justify-between bg-black/40 backdrop-blur-md">
           <div className="flex gap-4">
              <div className="flex flex-col">
                 <span className="text-[10px] text-lime-400 font-black italic tracking-widest">CURRENT PLAYER</span>
                 <span className="text-white text-xl font-black italic tracking-tighter uppercase">{currentPlayer?.username}</span>
              </div>
           </div>
           
           <div className="flex gap-8">
              {/* Optional UI elements for the top bar */}
           </div>
        </div>

        <div className="px-4 py-4 grid grid-cols-2 gap-4">
           {/* Team Blue HUDs */}
           <div className="space-y-2 max-w-[300px]">
              {teamBlue.map(renderHealthAndManaBars)}
           </div>
           {/* Team Red HUDs */}
           <div className="space-y-2 max-w-[300px] ml-auto">
              {teamRed.map(renderHealthAndManaBars)}
           </div>
        </div>

        <div className="px-8 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-4 min-h-[400px] relative">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent rounded-full blur-3xl -z-10"></div>
            
            <div className="flex items-end gap-2 md:gap-4 relative">
              {teamBlue.map((player) => (
                <div key={player.id} className="relative">
                  {renderPlayerPortrait(player)}
                </div>
              ))}
            </div>

            {/* Move Selection Overlay */}
            {(selectedTab === 'attack' || selectedTab === 'defense') && (
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col gap-1">
                     <button 
                       onClick={() => setSelectedTab(null as any)}
                       className="self-end text-white font-black italic text-xs mb-2 hover:text-red-400 transition-colors uppercase"
                     >
                       [ BACK ]
                     </button>
                     {selectedTab === 'attack' ? attackAbilities.map(renderAbilityButton) : defenseAbilities.map(renderAbilityButton)}
                  </div>
               </div>
            )}

            <div className="flex flex-row items-end gap-2 md:gap-4 relative">
              {teamRed.map((player) => (
                <div key={player.id} className="relative">
                  {renderPlayerPortrait(player)}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-xl mx-auto h-12 flex items-center justify-center">
            {lastAction && (
                <div className="text-white text-center italic font-black text-sm tracking-tight bg-black/40 px-6 py-2 rounded-full border border-white/10 animate-fade-in">
                  {lastAction.description}
                </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-auto px-4 pb-8 flex justify-center gap-6">
           <button
             onClick={() => setSelectedTab('attack')}
             className={`group relative px-12 py-4 transition-all hover:scale-110 active:scale-95 ${selectedTab === 'attack' ? 'scale-110' : ''}`}
           >
              <div className="absolute inset-0 bg-red-600 skew-x-[-15deg] border-y-4 border-black shadow-[0_0_30px_rgba(220,38,38,0.4)]"></div>
              <div className="relative z-10 flex items-center gap-3 skew-x-[0deg]">
                 <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center -skew-x-[15deg]">
                    <Swords className="w-6 h-6 text-white skew-x-[15deg]" />
                 </div>
                 <span className="text-white font-black italic text-2xl tracking-tighter shadow-black drop-shadow-md">ATTACK</span>
              </div>
           </button>

           <button
             onClick={() => setSelectedTab('defense')}
             className={`group relative px-12 py-4 transition-all hover:scale-110 active:scale-95 ${selectedTab === 'defense' ? 'scale-110' : ''}`}
           >
              <div className="absolute inset-0 bg-cyan-500 skew-x-[-15deg] border-y-4 border-black shadow-[0_0_30px_rgba(6,182,212,0.4)]"></div>
              <div className="relative z-10 flex items-center gap-3 skew-x-[0deg]">
                 <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center -skew-x-[15deg]">
                    <Shield className="w-6 h-6 text-white skew-x-[15deg]" />
                 </div>
                 <span className="text-white font-black italic text-2xl tracking-tighter shadow-black drop-shadow-md">DEFENSE</span>
              </div>
           </button>
        </div>
      </div>
    </div>
  );
}
