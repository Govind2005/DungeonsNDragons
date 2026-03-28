import { Trophy, TrendingUp, Award, Home } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface ResultPlayer {
  username: string;
  characterClass: CharacterClass;
  team: 'blue' | 'red';
  damage: number;
  healing: number;
  xpGained: number;
}

interface ResultScreenProps {
  winnerTeam: 'blue' | 'red';
  players: ResultPlayer[];
  currentUserId: string;
  onReturnHome: () => void;
  onPlayAgain: () => void;
}

export function ResultScreen({
  winnerTeam,
  players,
  currentUserId,
  onReturnHome,
  onPlayAgain,
}: ResultScreenProps) {
  const winners = players.filter((p) => p.team === winnerTeam);
  const losers = players.filter((p) => p.team !== winnerTeam);

  const renderPlayerStat = (player: ResultPlayer, rank: number) => {
    const characterData = CHARACTERS[player.characterClass];

    return (
      <div
        className={`flex items-center gap-4 p-4 border-l-4 ${
          player.team === winnerTeam
            ? 'bg-lime-400/10 border-lime-400'
            : 'bg-slate-800/50 border-slate-600'
        }`}
      >
        <div className="text-3xl font-black text-slate-600 w-8">#{rank}</div>

        <div className="w-16 h-16 border-2 border-slate-600 bg-slate-900 flex items-center justify-center text-3xl">
          {characterData.class === 'barbarian' && '⚔️'}
          {characterData.class === 'knight' && '🛡️'}
          {characterData.class === 'ranger' && '🏹'}
          {characterData.class === 'wizard' && '🔮'}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`font-bold ${
                player.team === winnerTeam ? 'text-lime-400' : 'text-white'
              }`}
            >
              {player.username}
            </div>
            {player.team === winnerTeam && (
              <Trophy className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <div className="text-sm text-slate-400">{characterData.name}</div>
        </div>

        <div className="text-right">
          <div className="text-red-400 font-mono text-sm">{player.damage} DMG</div>
          <div className="text-lime-400 font-mono text-sm">{player.healing} HEAL</div>
        </div>

        <div className="bg-slate-900 px-4 py-2 border border-slate-700">
          <div className="text-xs text-slate-400">XP</div>
          <div className="text-lime-400 font-bold">+{player.xpGained}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-lime-400 to-transparent"></div>

      {winnerTeam === 'blue' && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"></div>
        </>
      )}

      {winnerTeam === 'red' && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 blur-3xl rounded-full"></div>
        </>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 py-12">
        <div className="text-center mb-12">
          <div
            className={`inline-block px-12 py-4 mb-6 transform -skew-x-12 ${
              winnerTeam === 'blue'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                : 'bg-gradient-to-r from-red-600 to-red-400'
            }`}
          >
            <div className="skew-x-12">
              <Trophy className="w-16 h-16 text-white mx-auto mb-2" />
              <div className="text-white font-black text-4xl tracking-wider">
                {winnerTeam === 'blue' ? 'TEAM BLUE' : 'TEAM RED'}
              </div>
            </div>
          </div>

          <div className="text-white font-black text-6xl tracking-wider mb-4">VICTORY</div>
          <div className="text-slate-400 text-lg tracking-wide">MATCH COMPLETE</div>
        </div>

        <div className="w-full max-w-4xl space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-lime-400" />
              <div className="text-lime-400 font-bold text-xl tracking-wider">VICTORS</div>
            </div>
            <div className="space-y-2">
              {winners.map((player, index) => renderPlayerStat(player, index + 1))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-slate-400" />
              <div className="text-slate-400 font-bold text-xl tracking-wider">DEFEATED</div>
            </div>
            <div className="space-y-2">
              {losers.map((player, index) => renderPlayerStat(player, winners.length + index + 1))}
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-12">
          <button
            onClick={onReturnHome}
            className="group relative bg-slate-700 hover:bg-slate-600 transition-all"
          >
            <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1"></div>
            <div className="relative border-2 border-slate-500 px-8 py-4 flex items-center gap-3">
              <Home className="w-5 h-5 text-slate-300" />
              <span className="text-slate-300 font-bold text-lg tracking-wider">MAIN MENU</span>
            </div>
          </button>

          <button
            onClick={onPlayAgain}
            className="group relative bg-lime-400 hover:bg-lime-300 transition-all"
          >
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2"></div>
            <div className="relative bg-lime-400 border-2 border-black px-10 py-4 flex items-center gap-3 transform -skew-x-6">
              <Trophy className="w-5 h-5 text-black skew-x-6" />
              <span className="text-black font-black text-lg tracking-wider skew-x-6">
                PLAY AGAIN
              </span>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block bg-slate-900/80 backdrop-blur-sm border border-lime-400/30 px-6 py-3">
            <div className="text-lime-400 text-sm font-bold tracking-wider">
              +250 XP EARNED THIS MATCH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
