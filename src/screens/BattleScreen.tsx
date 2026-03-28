import { useState } from 'react';
import { BarChart3, Settings, User, Swords, Shield } from 'lucide-react';
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
  const [selectedTab, setSelectedTab] = useState<'attack' | 'defense'>('attack');
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
    const characterData = CHARACTERS[player.characterClass];
    const isDead = player.currentHp <= 0;

    return (
      <div key={player.id} className={`mb-4 p-2 border border-slate-700 bg-slate-800/50 ${isDead ? 'opacity-40 grayscale' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <div className={`font-black text-xs tracking-tighter uppercase ${player.team === 'blue' ? 'text-cyan-400' : 'text-red-400'}`}>
            {characterData.name} ({player.username})
          </div>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-white">H:{player.currentHp}</span>
            <span className="text-cyan-400">M:{player.currentMana}</span>
          </div>
        </div>
        
        <div className="h-2 bg-slate-900 mb-1">
          <div
            className={`h-full transition-all duration-500 ${player.team === 'blue' ? 'bg-cyan-500' : 'bg-red-500'}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        
        <div className="h-1 bg-slate-900">
          <div
            className="h-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${mpPercent}%` }}
          />
        </div>

        {!isDead && (
          <div className="flex gap-4 mt-1 text-[9px] uppercase font-bold text-slate-500 italic">
            <span>ATK: {(characterData.abilities.find(a => a.damage)?.damage || 0) + (player.attackPowerBuff || 0)}</span>
            <span>BUFF: +{player.attackPowerBuff || 0}%</span>
            {player.isBound && <span className="text-yellow-500">BOUND</span>}
            {player.isWeakened && <span className="text-purple-500">WEAK</span>}
            {player.isInvisible && <span className="text-cyan-500">HIDE</span>}
          </div>
        )}
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
        className={`relative transition-all duration-300 cursor-pointer ${
          isCurrentTurn ? 'scale-110 z-20' : 'scale-100'
        } ${isTargeted ? 'ring-4 ring-yellow-400' : ''} ${isDead ? 'grayscale opacity-50' : ''}`}
      >
        {isCurrentTurn && (
          <div className="absolute -inset-2 bg-lime-400/20 animate-pulse border-2 border-lime-400"></div>
        )}

        <div
          className={`relative border-4 ${
            player.team === 'blue' ? 'border-cyan-400' : 'border-red-400'
          } bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden`}
        >
          <div className="aspect-[3/4] flex items-center justify-center bg-slate-900/50 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="text-7xl z-10">
              {player.characterClass === 'barbarian' && '⚔️'}
              {player.characterClass === 'knight' && '🛡️'}
              {player.characterClass === 'ranger' && '🏹'}
              {player.characterClass === 'wizard' && '🔮'}
            </div>
            {isDead && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="text-red-500 font-black text-2xl -rotate-12 border-4 border-red-500 px-2">KO</div>
              </div>
            )}
          </div>
        </div>

        {isCurrentTurn && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-lime-400 px-4 py-1 transform -skew-x-12 whitespace-nowrap">
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
              } else {
                alert("Please click an enemy to target, then click the ability again.");
              }
            }
          } else {
            onDefense(ability.id);
          }
        }}
        className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-lime-400 transition-all p-4 text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-600"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="font-bold text-white group-hover:text-lime-400 transition-colors">
            {ability.name}
          </div>
          <div
            className={`px-2 py-1 text-xs font-bold ${
              canAfford ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {ability.manaCost} MP
          </div>
        </div>
        <div className="text-xs text-slate-400 mb-2">{ability.description}</div>
        {ability.damage && (
          <div className="text-xs text-red-400 font-bold">DMG: {ability.damage}</div>
        )}
        {ability.effect && (
          <div className="text-xs text-lime-400 font-semibold mt-1">{ability.effect}</div>
        )}
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

        <div className="px-8 py-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-6">
            <BarChart3 className="w-5 h-5 text-lime-400" />
            <Settings className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
            <User className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {teamBlue.map(renderHealthAndManaBars)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {teamRed.map(renderHealthAndManaBars)}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8 max-w-5xl mx-auto">
            {teamBlue.map((player) => (
              <div key={player.id}>{renderPlayerPortrait(player)}</div>
            ))}
            {teamRed.map((player) => (
              <div key={player.id}>{renderPlayerPortrait(player)}</div>
            ))}
          </div>

          {lastAction && (
            <div className="max-w-3xl mx-auto mb-6">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-center py-4 border-2 border-lime-400">
                <div className="font-black text-lime-400 text-sm tracking-widest mb-1">ACTION LOG</div>
                <div className="text-lg font-bold px-4">
                  {lastAction.description}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedTab('attack')}
                  className={`flex-1 py-4 font-black text-lg tracking-wider transition-all transform ${
                    selectedTab === 'attack'
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white -skew-x-6 scale-105'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={selectedTab === 'attack' ? 'skew-x-6' : ''}>
                    <Swords className="w-6 h-6 mx-auto mb-1" />
                    ATTACK
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab('defense')}
                  className={`flex-1 py-4 font-black text-lg tracking-wider transition-all ${
                    selectedTab === 'defense'
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-6 h-6 mx-auto mb-1" />
                  DEFENSE
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedTab === 'attack' && attackAbilities.map(renderAbilityButton)}
                {selectedTab === 'defense' && defenseAbilities.map(renderAbilityButton)}
              </div>
            </div>

            <div className="bg-slate-900/50 border-l-4 border-lime-400 p-6">
              <div className="text-lime-400 font-bold text-sm tracking-widest mb-4">TURN INFO</div>
              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-xs mb-1">Current Turn</div>
                  <div className="text-white font-bold">
                    {currentPlayer?.username || 'Unknown'}
                  </div>
                </div>

                {myPlayer && (
                  <>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Your HP</div>
                      <div className="text-cyan-400 font-bold font-mono">
                        {myPlayer.currentHp}/{myPlayer.maxHp}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-xs mb-1">Your MP</div>
                      <div className="text-cyan-400 font-bold font-mono">
                        {myPlayer.currentMana}/{myPlayer.maxMana}
                      </div>
                    </div>
                  </>
                )}

                {isMyTurn && (
                  <div className="bg-lime-400/10 border-2 border-lime-400 p-3 mt-4">
                    <div className="text-lime-400 font-black text-sm text-center animate-pulse">
                      YOUR TURN
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
