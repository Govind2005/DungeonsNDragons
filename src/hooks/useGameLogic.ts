import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

export type GameScreen = 'home' | 'login' | 'lobby' | 'battle' | 'result' | 'leaderboard';

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

  const createMatch = async () => {
    if (!userId) return;

    const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        lobby_code: lobbyCode,
        status: 'waiting',
        team_blue_player1_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      return;
    }

    if (match) {
      setCurrentMatch(match as Match);
      setCurrentScreen('lobby');
    }
  };

  const selectCharacter = async (characterClass: CharacterClass) => {
    if (!userId || !currentMatch) return;

    const characterData = CHARACTERS[characterClass];

    const { data: existingPlayer } = await supabase
      .from('match_players')
      .select()
      .eq('match_id', currentMatch.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPlayer) {
      await supabase
        .from('match_players')
        .update({
          character_class: characterClass,
          max_hp: characterData.maxHp,
          current_hp: characterData.maxHp,
          max_mana: characterData.maxMana,
          current_mana: characterData.maxMana,
        })
        .eq('id', existingPlayer.id);
    } else {
      await supabase.from('match_players').insert({
        match_id: currentMatch.id,
        user_id: userId,
        team: 'blue',
        character_class: characterClass,
        current_hp: characterData.maxHp,
        max_hp: characterData.maxHp,
        current_mana: characterData.maxMana,
        max_mana: characterData.maxMana,
        position: 0,
      });
    }

    loadMatchPlayers();
  };

  const toggleReady = async () => {
    if (!userId || !currentMatch) return;

    const player = matchPlayers.find((p) => p.id === userId);
    if (!player) return;

    await supabase
      .from('match_players')
      .update({ is_ready: !player.isReady })
      .eq('match_id', currentMatch.id)
      .eq('user_id', userId);

    loadMatchPlayers();
  };

  const loadMatchPlayers = async () => {
    if (!currentMatch) return;

    const { data: players } = await supabase
      .from('match_players')
      .select(`
        *,
        profiles:user_id (username)
      `)
      .eq('match_id', currentMatch.id);

    if (players) {
      const formattedPlayers = players.map((p: any) => ({
        id: p.user_id,
        username: p.profiles?.username || 'Unknown',
        team: p.team,
        characterClass: p.character_class,
        currentHp: p.current_hp,
        maxHp: p.max_hp,
        currentMana: p.current_mana,
        maxMana: p.max_mana,
        attackPowerBuff: p.attack_power_buff,
        isReady: p.is_ready,
        isInvisible: p.is_invisible,
        isBound: p.is_bound,
        isWeakened: p.is_weakened,
        position: p.position,
      }));

      setMatchPlayers(formattedPlayers);
    }
  };

  const performAttack = async (abilityId: string, targetIds: string[]) => {
    if (!userId || !currentMatch) return;
  };

  const performDefense = async (abilityId: string) => {
    if (!userId || !currentMatch) return;
  };

  useEffect(() => {
    if (currentMatch) {
      loadMatchPlayers();

      const channel = supabase
        .channel(`match:${currentMatch.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_players',
            filter: `match_id=eq.${currentMatch.id}`,
          },
          () => {
            loadMatchPlayers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentMatch]);

  return {
    currentScreen,
    setCurrentScreen,
    currentMatch,
    matchPlayers,
    createMatch,
    selectCharacter,
    toggleReady,
    performAttack,
    performDefense,
  };
}
