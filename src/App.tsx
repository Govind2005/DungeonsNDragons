import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useGameLogic } from './hooks/useGameLogic';
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
    createMatch,
    selectCharacterForPlayer,
    startGame,
    performAttack,
    performDefense,
  } = useGameLogic(user?.id);

  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadPlayerProfile();
    }
  }, [user]);

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
    await createMatch();
  };

  const handleLeaderboards = async () => {
    await loadLeaderboard();
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
          playerLevel={playerProfile?.level || 1}
          playerRank="PALADIN ELITE"
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
