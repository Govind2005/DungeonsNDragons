import { Trophy, TrendingUp, Crown, ArrowLeft } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
}

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
  onBack: () => void;
}

export function LeaderboardScreen({ leaderboard, onBack }: LeaderboardScreenProps) {
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const renderPodium = (entry: LeaderboardEntry, position: 1 | 2 | 3) => {
    const heights = {
      1: 'h-64',
      2: 'h-48',
      3: 'h-40',
    };

    const colors = {
      1: 'from-yellow-600 to-yellow-400',
      2: 'from-slate-500 to-slate-300',
      3: 'from-orange-700 to-orange-500',
    };

    const crownColors = {
      1: 'text-yellow-400',
      2: 'text-slate-300',
      3: 'text-orange-400',
    };

    return (
      <div className={`flex flex-col items-center ${position === 2 ? 'order-1' : position === 1 ? 'order-2' : 'order-3'}`}>
        <div className="mb-4 text-center">
          <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-700 rounded-full flex items-center justify-center mb-3">
            <Crown className={`w-12 h-12 ${crownColors[position]}`} />
          </div>
          <div className="text-white font-bold text-lg">{entry.username}</div>
          <div className="text-slate-400 text-sm">Level {entry.level}</div>
        </div>

        <div
          className={`w-48 ${heights[position]} bg-gradient-to-t ${colors[position]} border-4 border-black flex flex-col items-center justify-start pt-6 relative`}
        >
          <div className="text-6xl font-black text-black mb-2">#{position}</div>
          <div className="text-black font-bold text-lg">{entry.wins}W - {entry.losses}L</div>
          <div className="text-black/70 text-sm">{entry.xp} XP</div>

          <div className="absolute -top-4 inset-x-0 h-2 bg-black"></div>
        </div>
      </div>
    );
  };

  const renderLeaderboardRow = (entry: LeaderboardEntry) => {
    const winRate = entry.wins + entry.losses > 0
      ? ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0)
      : '0';

    return (
      <div
        key={entry.rank}
        className="flex items-center gap-6 px-6 py-4 bg-slate-800/30 hover:bg-slate-800/50 border-l-4 border-transparent hover:border-lime-400 transition-all"
      >
        <div className="text-3xl font-black text-slate-600 w-12">#{entry.rank}</div>

        <div className="w-14 h-14 bg-slate-700 border-2 border-slate-600 rounded-full flex items-center justify-center">
          <Trophy className="w-7 h-7 text-slate-500" />
        </div>

        <div className="flex-1">
          <div className="text-white font-bold text-lg">{entry.username}</div>
          <div className="text-slate-400 text-sm">Level {entry.level}</div>
        </div>

        <div className="text-center">
          <div className="text-lime-400 font-mono text-xl font-bold">{entry.xp}</div>
          <div className="text-slate-500 text-xs">XP</div>
        </div>

        <div className="text-center">
          <div className="text-cyan-400 font-mono text-xl font-bold">{entry.wins}</div>
          <div className="text-slate-500 text-xs">WINS</div>
        </div>

        <div className="text-center">
          <div className="text-red-400 font-mono text-xl font-bold">{entry.losses}</div>
          <div className="text-slate-500 text-xs">LOSSES</div>
        </div>

        <div className="text-center bg-slate-900 px-4 py-2 border border-slate-700">
          <div className="text-lime-400 font-mono text-lg font-bold">{winRate}%</div>
          <div className="text-slate-500 text-xs">WIN RATE</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"></div>

      <div className="relative z-10">
        <div className="px-8 py-6 border-b border-slate-700/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">BACK</span>
          </button>
        </div>

        <div className="px-8 py-12">
          <div className="text-center mb-16">
            <div className="inline-block bg-cyan-400 px-8 py-3 transform -skew-x-12 mb-4">
              <Trophy className="w-10 h-10 text-black skew-x-12 mx-auto" />
            </div>
            <h1 className="text-6xl font-black text-lime-300 italic mb-2 drop-shadow-[0_0_20px_rgba(190,242,100,0.5)]">
              LEADERBOARDS
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm tracking-wider">SEASON 01: KINETIC HERO</span>
            </div>
          </div>

          {topThree.length > 0 && (
            <div className="mb-16">
              <div className="flex items-end justify-center gap-8 max-w-5xl mx-auto">
                {topThree[1] && renderPodium(topThree[1], 2)}
                {topThree[0] && renderPodium(topThree[0], 1)}
                {topThree[2] && renderPodium(topThree[2], 3)}
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-900/50 border-t-4 border-lime-400">
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-lime-400" />
                  <h2 className="text-lime-400 font-bold text-lg tracking-wider">RANKINGS</h2>
                </div>
              </div>

              <div className="divide-y divide-slate-700/50">
                {rest.map(renderLeaderboardRow)}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  No rankings available yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
