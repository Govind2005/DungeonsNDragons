import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

export type GameScreen = 'home' | 'login' | 'lobby' | 'lobby-join' | 'lobby-waiting' | 'battle' | 'result' | 'leaderboard';

interface MatchPlayer {
  id: string;
  username: string;
  team: 'blue' | 'red';
  characterClass: CharacterClass | null;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  attackPowerBuff: number;
  isReady: boolean;
  isInvisible: boolean;
  isBound: boolean;
  isWeakened: boolean;
  position: number;
}

interface Match {
  id: string;
  lobbyCode: string;
  status: string;
  currentTurn: number;
  winnerTeam: string | null;
}

export function useGameLogic(userId: string | undefined) {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('home');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);

  const [lastAction, setLastAction] = useState<any>(null);

  const createMatch = async () => {
    if (!userId) return;

    const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newMatch: Match = {
      id: Math.random().toString(36).substring(2, 15),
      lobbyCode,
      status: 'waiting',
      currentTurn: 0,
      winnerTeam: null,
    };

    setCurrentMatch(newMatch);
    
    const profiles = JSON.parse(localStorage.getItem('rpg_profiles') || '[]');
    const teams: ('blue' | 'red')[] = ['blue', 'red', 'blue', 'red'];
    
    // Initialize 4 slots without classes
    const players: MatchPlayer[] = profiles.slice(0, 4).map((profile: any, index: number) => ({
      id: profile.id,
      username: profile.username,
      team: teams[index],
      characterClass: null,
      currentHp: 0,
      maxHp: 0,
      currentMana: 0,
      maxMana: 0,
      attackPowerBuff: 0,
      isReady: false,
      isInvisible: false,
      isBound: false,
      isWeakened: false,
      position: index,
    }));

    setMatchPlayers(players);
    setCurrentScreen('lobby');
  };

  const selectCharacterForPlayer = (playerId: string, characterClass: CharacterClass) => {
    const characterData = CHARACTERS[characterClass];
    setMatchPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          characterClass,
          maxHp: characterData.maxHp,
          currentHp: characterData.maxHp,
          maxMana: characterData.maxMana,
          currentMana: characterData.maxMana,
        };
      }
      return p;
    }));
  };

  const startGame = () => {
    if (matchPlayers.every(p => p.characterClass)) {
      setCurrentMatch(prev => prev ? { ...prev, status: 'battle' } : null);
      setCurrentScreen('battle');
    } else {
      alert("Please select characters for all 4 players!");
    }
  };

  const performAttack = async (abilityId: string, targetIds: string[]) => {
    if (!currentMatch || matchPlayers.length === 0) return;

    const currentPlayer = matchPlayers[currentMatch.currentTurn];
    const ability = CHARACTERS[currentPlayer.characterClass!].abilities.find(a => a.id === abilityId);
    
    if (!ability || currentPlayer.currentMana < ability.manaCost) return;

    setMatchPlayers(prevPlayers => {
      let newPlayers = [...prevPlayers];
      const actor = newPlayers[currentMatch.currentTurn];
      
      // Consume Mana (ensure not negative)
      actor.currentMana = Math.max(0, actor.currentMana - ability.manaCost);

      let totalDamage = 0;
      let logBuffer = `${actor.username} used ${ability.name}! `;

      // Apply Damage and Effects
      newPlayers = newPlayers.map(p => {
        if (targetIds.includes(p.id)) {
          let damage = ability.damage || 0;
          
          // Buff calculation
          damage = Math.floor(damage * (1 + actor.attackPowerBuff / 100));
          
          // Invisible check
          if (p.isInvisible) {
            damage = 0;
            p.isInvisible = false;
            logBuffer += `${p.username} evaded! `;
          } else {
            p.currentHp = Math.max(0, p.currentHp - damage);
            totalDamage += damage;
          }

          // Ability specific effects
          if (abilityId === 'pinning_arrow') {
            p.isBound = true;
            logBuffer += `${p.username} was BOUND! `;
          }
          if (abilityId === 'cataclysm') {
            p.isWeakened = true;
            p.maxHp = Math.floor(p.maxHp * 0.9);
            p.maxMana = Math.floor(p.maxMana * 0.9);
            p.attackPowerBuff -= 10;
            logBuffer += `${p.username} was WEAKENED! `;
          }
          if (abilityId === 'mind_siphon') {
            p.currentMana = Math.max(0, p.currentMana - 15);
            logBuffer += `${p.username}'s mana was drained! `;
          }
        }
        return p;
      });

      // Ability self effects
      if (abilityId === 'shield_bash') {
        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + 25);
        logBuffer += `${actor.username} gained a SHIELD! `;
      }
      if (abilityId === 'vanguard_charge') {
        newPlayers = newPlayers.map(p => {
          if (p.team === actor.team) p.attackPowerBuff += 10;
          return p;
        });
        logBuffer += `Team Buffed! `;
      }

      setLastAction({
        playerName: actor.username,
        abilityName: ability.name,
        damage: totalDamage,
        description: logBuffer
      });

      return newPlayers;
    });

    advanceTurn();
  };

  const performDefense = async (abilityId: string) => {
    if (!currentMatch) return;
    const currentPlayer = matchPlayers[currentMatch.currentTurn];
    const ability = CHARACTERS[currentPlayer.characterClass!].abilities.find(a => a.id === abilityId);
    if (!ability || currentPlayer.currentMana < ability.manaCost) return;

    setMatchPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      const p = newPlayers[currentMatch.currentTurn];
      
      p.currentMana = Math.max(0, p.currentMana - ability.manaCost);
      let logBuffer = `${p.username} used ${ability.name}. `;

      if (abilityId === 'guard_gather') {
        p.currentMana = Math.min(p.maxMana, p.currentMana + 20);
        logBuffer += `Mana restored! `;
      }
      if (abilityId === 'war_cry') {
        p.attackPowerBuff += 15;
        logBuffer += `Attack Power up! `;
      }
      if (abilityId === 'divine_rest') {
        p.currentHp = Math.min(p.maxHp, p.currentHp + 45);
        logBuffer += `Healed self! `;
      }
      if (abilityId === 'shadow_meld') {
        p.isInvisible = true;
        logBuffer += `Became INVISIBLE! `;
      }
      if (abilityId === 'aura_of_life') {
        newPlayers.forEach(player => {
          if (player.team === p.team) player.currentHp = Math.min(player.maxHp, player.currentHp + 35);
        });
        logBuffer += `Team HEALED! `;
      }

      setLastAction({
        playerName: p.username,
        abilityName: ability.name,
        damage: 0,
        description: logBuffer
      });

      return newPlayers;
    });

    advanceTurn();
  };

  const advanceTurn = () => {
    // 1. Check for win condition
    const blueTeamDead = matchPlayers.length > 0 && matchPlayers.filter(p => p.team === 'blue').every(p => p.currentHp <= 0);
    const redTeamDead = matchPlayers.length > 0 && matchPlayers.filter(p => p.team === 'red').every(p => p.currentHp <= 0);

    if (blueTeamDead || redTeamDead) {
      setCurrentMatch(prev => prev ? { ...prev, status: 'finished', winnerTeam: blueTeamDead ? 'red' : 'blue' } : null);
      setCurrentScreen('result');
      return;
    }

    // 2. Find next valid player and clear skipped status
    setMatchPlayers(prevPlayers => {
      let nextTurn = (currentMatch!.currentTurn + 1) % 4;
      const newPlayers = [...prevPlayers];
      let attempts = 0;
      let finalNextTurn = nextTurn;

      while (attempts < 4) {
        const potentialPlayer = newPlayers[finalNextTurn];
        
        if (potentialPlayer.currentHp <= 0) {
          finalNextTurn = (finalNextTurn + 1) % 4;
          attempts++;
          continue;
        }

        if (potentialPlayer.isBound) {
          // Clear bound status but they still skip THIS turn
          newPlayers[finalNextTurn] = { ...potentialPlayer, isBound: false };
          finalNextTurn = (finalNextTurn + 1) % 4;
          attempts++;
          continue;
        }

        // Found an active player
        break;
      }

      // 3. Update match turn state
      setCurrentMatch(prev => prev ? { ...prev, currentTurn: finalNextTurn } : null);
      return newPlayers;
    });
  };

  useEffect(() => {
    // No auto-start, user clicks "READY UP" (repurposed as "START GAME")
  }, [matchPlayers, currentMatch]);

  return {
    currentScreen,
    setCurrentScreen,
    currentMatch,
    matchPlayers,
    lastAction,
    createMatch,
    selectCharacterForPlayer,
    startGame,
    performAttack,
    performDefense,
  };
}
