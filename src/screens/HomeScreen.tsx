import { Swords, Trophy } from 'lucide-react';

interface HomeScreenProps {
  onStartQuest: () => void;
  onLeaderboards: () => void;
  playerLevel: number;
  playerRank: string;
}

export function HomeScreen({ onStartQuest, onLeaderboards, playerLevel, playerRank }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <div className="bg-slate-800/80 backdrop-blur-sm border-2 border-lime-400/30 px-6 py-3 skew-x-[-5deg]">
            <div className="skew-x-[5deg] flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-700 border-2 border-lime-400"></div>
              <div className="text-right">
                <div className="text-lime-400 font-bold text-sm tracking-wider">LEVEL {playerLevel}</div>
                <div className="text-xs text-slate-400">{playerRank}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-8xl font-black text-lime-300 italic transform -skew-y-2 mb-2 drop-shadow-[0_0_20px_rgba(190,242,100,0.5)]">
            DUNGEONS
          </h1>
          <h1 className="text-8xl font-black text-lime-300 italic transform -skew-y-2 mb-4 drop-shadow-[0_0_20px_rgba(190,242,100,0.5)]">
            & DRAGONS
          </h1>
          <div className="inline-block bg-red-600 px-8 py-2 transform skew-x-[-5deg] border-2 border-black">
            <span className="text-white font-bold tracking-widest text-sm skew-x-[5deg] inline-block">
              SEASON 01: KINETIC HERO and so it goes
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <button
            onClick={onStartQuest}
            className="group relative bg-lime-400 hover:bg-lime-300 transition-all duration-200 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2"></div>
            <div className="relative bg-lime-400 border-4 border-black px-12 py-6 flex items-center justify-center gap-4 transform skew-x-[-5deg] group-hover:skew-x-[-3deg] transition-transform">
              <Swords className="w-8 h-8 text-black skew-x-[5deg]" />
              <span className="text-black font-black text-3xl tracking-wider skew-x-[5deg]">
                START QUEST
              </span>
            </div>
          </button>

          <button
            onClick={onLeaderboards}
            className="group relative bg-cyan-400 hover:bg-cyan-300 transition-all duration-200 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2"></div>
            <div className="relative bg-cyan-400 border-4 border-black px-12 py-6 flex items-center justify-center gap-4 transform skew-x-[-5deg] group-hover:skew-x-[-3deg] transition-transform">
              <Trophy className="w-8 h-8 text-black skew-x-[5deg]" />
              <span className="text-black font-black text-3xl tracking-wider skew-x-[5deg]">
                LEADERBOARDS
              </span>
            </div>
          </button>
        </div>

        <div className="absolute bottom-8 left-8 flex gap-3">
          <div className="w-4 h-4 bg-lime-400"></div>
          <div className="w-4 h-4 bg-cyan-400"></div>
          <div className="w-4 h-4 bg-red-500"></div>
        </div>

        <div className="absolute bottom-8 left-8 ml-20">
          <div className="text-white font-mono text-xs tracking-wider">
            SYSTEM-ACTIVE: 100%
          </div>
        </div>
      </div>
    </div>
  );
}
