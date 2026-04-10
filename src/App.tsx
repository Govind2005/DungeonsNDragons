import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { GameProvider, useGame } from './contexts/GameContext';
import { useGameLogic } from './hooks/useGameLogic';
// import { supabase } from './lib/supabase';

import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { CharacterClass, Ability } from './lib/gameData';

function AppContent() {
  const { user, loading, token } = useAuth();
  const { currentScreen, setCurrentScreen } = useGameLogic(user?.id);
  const { matchId, matchPlayers, matchCurrentTurn } = useGame();

  const performAttack = async (abilityId: string, targets: string[]) => {
    if (!matchId || !user) return;
    try {
      await fetch(`http://localhost:8080/api/game/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          actorPlayerId: user.id,
          actionType: abilityId,
          targetPlayerId: targets.length > 0 ? targets[0] : null,
        }),
      });
    } catch (err) {
      console.error('Failed to perform attack:', err);
    }
  };

  const performDefense = async (abilityId: string) => {
    if (!matchId || !user) return;
    try {
      await fetch(`http://localhost:8080/api/game/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          actorPlayerId: user.id,
          actionType: abilityId,
        }),
      });
    } catch (err) {
      console.error('Failed to perform defense:', err);
    }
  };

  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadPlayerProfile();
    }
  }, [user]);

  // Navigate to battle screen if a match is detected
  useEffect(() => {
    if (matchId && (currentScreen.startsWith('lobby') || currentScreen === 'home')) {
      console.log("Match detected in App, navigating to battle...");
      setCurrentScreen('battle');
    }
  }, [matchId, currentScreen, setCurrentScreen]);

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

  const handleStartQuest = async () => {
    // Navigate to lobby join/create screen
    setCurrentScreen('lobby-join');
  };

  const handleLeaderboards = async () => {
    await loadLeaderboard();
    setCurrentScreen('leaderboard');
  };

  const handleNavigateTo = (screen: string) => {
    setCurrentScreen(screen);
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
    return <LoginScreen />;
  }

  return (
    <>
      {currentScreen === 'home' && (
        <HomeScreen
          onStartQuest={handleStartQuest}
          onLeaderboards={handleLeaderboards}
        />
      )}

      {currentScreen === 'lobby-join' && (
        <LobbyScreen onNavigateTo={handleNavigateTo} />
      )}

      {currentScreen === 'lobby-waiting' && (
        <LobbyScreen onNavigateTo={handleNavigateTo} />
      )}

      {currentScreen === 'lobby' && (
        <LobbyScreen onNavigateTo={handleNavigateTo} />
      )}

      {currentScreen === 'battle' && matchId && matchPlayers && matchPlayers.length > 0 && (
        <BattleScreen
          players={matchPlayers.map((p: any) => ({
            id: p.playerId,
            username: p.username,
            team: p.team === 1 ? 'blue' : 'red',
            characterClass: p.characterClass || 'barbarian',
            currentHp: p.currentHp || 100,
            maxHp: p.maxHp || 100,
            currentMana: p.currentMana || 50,
            maxMana: p.maxMana || 50,
            position: p.turnOrder,
            attackPowerBuff: 0,
            isBound: false,
            isWeakened: false,
            isInvisible: false,
          }))}
          currentTurn={matchCurrentTurn}
          onAttack={performAttack}
          onDefense={performDefense}
        />
      )}

      {currentScreen === 'result' && (
        <ResultScreen
          winnerTeam="blue"
          players={[
            {
              username: 'Player1',
              characterClass: 'knight',
              team: 'blue',
              damage: 450,
              healing: 120,
              xpGained: 250,
            },
            {
              username: 'Player2',
              characterClass: 'barbarian',
              team: 'red',
              damage: 380,
              healing: 0,
              xpGained: 100,
            },
            {
              username: 'Player3',
              characterClass: 'ranger',
              team: 'blue',
              damage: 420,
              healing: 0,
              xpGained: 250,
            },
            {
              username: 'Player4',
              characterClass: 'wizard',
              team: 'red',
              damage: 340,
              healing: 180,
              xpGained: 100,
            },
          ]}
          currentUserId={user.id}
          onReturnHome={() => setCurrentScreen('home')}
          onPlayAgain={handleStartQuest}
        />
      )}

      {currentScreen === 'leaderboard' && (
        <LeaderboardScreen
          leaderboard={leaderboard}
          currentUserId={user.id}
          onBack={() => setCurrentScreen('home')}
        />
      )}

    </>
  );
}

function App() {
  const { token } = useAuth();

  return (
    <GameProvider token={token}>
      <AppContent />
    </GameProvider>
  );
}

export default App;
