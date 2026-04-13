import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useGameLogic, BattleResult } from './hooks/useGameLogic';
// import { supabase } from './lib/supabase';

import { HomeScreen } from './screens/HomeScreen';
// import { LoginScreen } from './screens/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { CharacterSelectModal } from './components/CharacterSelectModal';

function App() {
  const { user, loading } = useAuth();
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [selectingForPlayer, setSelectingForPlayer] = useState<string | null>(null);

  const {
    currentScreen,
    setCurrentScreen,
    currentMatch,
    matchPlayers,
    lastAction,
    lastBattleResult,
    createMatch,
    selectCharacterForPlayer,
    startGame,
    performAttack,
    performDefense,
  } = useGameLogic(user?.id);

  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [battleLogs, setBattleLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadPlayerProfile();
      loadBattleLogs();
    }
  }, [user]);

  useEffect(() => {
    // When a battle result is available, save it and add to battle logs
    if (lastBattleResult) {
      saveBattleLog(lastBattleResult);
    }
  }, [lastBattleResult]);

  const loadPlayerProfile = () => {
    if (!user) return;

    const profiles = JSON.parse(localStorage.getItem('rpg_profiles') || '[]');
    const profile = profiles.find((p: any) => p.id === user.id);

    if (profile) {
      setPlayerProfile(profile);
    }
  };

  const loadLeaderboard = () => {
    const profiles = JSON.parse(localStorage.getItem('rpg_profiles') || '[]');
    const sorted = [...profiles].sort((a: any, b: any) => b.xp - a.xp).slice(0, 50);

    const formattedLeaderboard = sorted.map((profile: any, index: number) => ({
      rank: index + 1,
      username: profile.username,
      level: profile.level,
      xp: profile.xp,
      wins: profile.total_wins,
      losses: profile.total_losses,
    }));

    setLeaderboard(formattedLeaderboard);
  };

  const loadBattleLogs = () => {
    const logs = JSON.parse(localStorage.getItem('battle_logs') || '[]');
    setBattleLogs(logs);
  };

  const saveBattleLog = (result: BattleResult) => {
    const logs = JSON.parse(localStorage.getItem('battle_logs') || '[]');
    logs.unshift(result);
    // Keep only last 100 battles
    const recentLogs = logs.slice(0, 100);
    localStorage.setItem('battle_logs', JSON.stringify(recentLogs));
    setBattleLogs(recentLogs);
  };

  const handleStartQuest = async () => {
    await createMatch();
  };

  const handleLeaderboards = async () => {
    await loadLeaderboard();
    loadBattleLogs();
    setCurrentScreen('leaderboard');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-lime-400 font-black text-2xl tracking-wider animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-lime-400 font-black animate-pulse">
           INITIALIZING...
        </div>
      </div>
    );
  }

  return (
    <>
      {currentScreen === 'home' && (
        <HomeScreen
          onStartQuest={handleStartQuest}
          onLeaderboards={handleLeaderboards}
        />
      )}

      {currentScreen === 'lobby' && currentMatch && (
        <LobbyScreen
          players={matchPlayers.map((p: any) => ({
            id: p.id,
            username: p.username,
            team: p.team,
            characterClass: p.characterClass,
            isReady: p.isReady,
            position: p.position,
          }))}
          onSelectCharacter={(playerId: string) => {
            setSelectingForPlayer(playerId);
            setShowCharacterSelect(true);
          }}
          onStart={startGame}
          onLeave={() => {
            setCurrentScreen('home');
          }}
        />
      )}

      {currentScreen === 'battle' && currentMatch && matchPlayers.length > 0 && (
        <BattleScreen
          players={matchPlayers.map((p: any) => ({
            id: p.id,
            username: p.username,
            team: p.team,
            characterClass: p.characterClass!,
            currentHp: p.currentHp,
            maxHp: p.maxHp,
            currentMana: p.currentMana,
            maxMana: p.maxMana,
            position: p.position,
            attackPowerBuff: p.attackPowerBuff,
            isBound: p.isBound,
            isWeakened: p.isWeakened,
            isInvisible: p.isInvisible,
          }))}
          currentTurn={currentMatch.currentTurn}
          onAttack={performAttack}
          onDefense={performDefense}
          lastAction={lastAction}
        />
      )}

      {currentScreen === 'result' && lastBattleResult && (
        <ResultScreen
          winnerTeam={lastBattleResult.winnerTeam}
          players={lastBattleResult.players.map(p => ({
            username: p.username,
            characterClass: p.characterClass,
            team: p.team,
            damage: p.damage,
            healing: p.healing,
            xpGained: p.xpGained,
          }))}
          currentUserId={user.id}
          onReturnHome={() => setCurrentScreen('home')}
          onPlayAgain={handleStartQuest}
        />
      )}

      {currentScreen === 'leaderboard' && (
        <LeaderboardScreen
          battleLogs={battleLogs.map(log => ({
            id: log.matchId,
            timestamp: log.timestamp,
            winnerTeam: log.winnerTeam,
            players: log.players.map((p: any) => ({
              username: p.username,
              team: p.team,
              characterClass: p.characterClass,
              damageDealt: p.damage,
              healingDone: p.healing,
              xpGained: p.xpGained,
            })),
          }))}
          currentUserId={user.id}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      <CharacterSelectModal
        isOpen={showCharacterSelect}
        onClose={() => {
          setShowCharacterSelect(false);
          setSelectingForPlayer(null);
        }}
        onSelect={(characterClass) => {
          if (selectingForPlayer) {
            selectCharacterForPlayer(selectingForPlayer, characterClass);
          }
        }}
      />
    </>
  );
}

export default App;
