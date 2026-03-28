import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useGameLogic } from './hooks/useGameLogic';
import { supabase } from './lib/supabase';

import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { CharacterSelectModal } from './components/CharacterSelectModal';

function App() {
  const { user, loading, signIn, signUp } = useAuth();
  const {
    currentScreen,
    setCurrentScreen,
    currentMatch,
    matchPlayers,
    createMatch,
    selectCharacter,
    toggleReady,
    performAttack,
    performDefense,
  } = useGameLogic(user?.id);

  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadPlayerProfile();
    }
  }, [user]);

  const loadPlayerProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setPlayerProfile(data);
    }
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50);

    if (data) {
      const formattedLeaderboard = data.map((profile, index) => ({
        rank: index + 1,
        username: profile.username,
        level: profile.level,
        xp: profile.xp,
        wins: profile.total_wins,
        losses: profile.total_losses,
      }));

      setLeaderboard(formattedLeaderboard);
    }
  };

  const handleStartQuest = async () => {
    await createMatch();
  };

  const handleLeaderboards = async () => {
    await loadLeaderboard();
    setCurrentScreen('leaderboard');
  };

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
    setCurrentScreen('home');
  };

  const handleSignUp = async (email: string, password: string, username: string) => {
    await signUp(email, password, username);
    setCurrentScreen('home');
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
    return <LoginScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
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
          lobbyCode={currentMatch.lobbyCode}
          players={matchPlayers.map((p) => ({
            id: p.id,
            username: p.username,
            team: p.team,
            characterClass: p.characterClass,
            isReady: p.isReady,
            position: p.position,
          }))}
          currentUserId={user.id}
          onSelectCharacter={() => setShowCharacterSelect(true)}
          onReady={toggleReady}
          onLeave={() => {
            setCurrentScreen('home');
          }}
        />
      )}

      {currentScreen === 'battle' && currentMatch && matchPlayers.length > 0 && (
        <BattleScreen
          players={matchPlayers.filter((p) => p.characterClass).map((p) => ({
            id: p.id,
            username: p.username,
            team: p.team,
            characterClass: p.characterClass!,
            currentHp: p.currentHp,
            maxHp: p.maxHp,
            currentMana: p.currentMana,
            maxMana: p.maxMana,
            position: p.position,
          }))}
          currentTurn={currentMatch.currentTurn}
          currentUserId={user.id}
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

      <CharacterSelectModal
        isOpen={showCharacterSelect}
        onClose={() => setShowCharacterSelect(false)}
        onSelect={selectCharacter}
      />
    </>
  );
}

export default App;
