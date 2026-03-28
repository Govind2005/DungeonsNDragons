import { Settings, LogOut, Swords } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface Player {
  id: string;
  username: string;
  team: 'blue' | 'red';
  characterClass: CharacterClass | null;
  isReady: boolean;
  position: number;
}

interface LobbyScreenProps {
  lobbyCode: string;
  players: Player[];
  currentUserId: string;
  onSelectCharacter: () => void;
  onReady: () => void;
  onLeave: () => void;
}

export function LobbyScreen({
  lobbyCode,
  players,
  currentUserId,
  onSelectCharacter,
  onReady,
  onLeave,
}: LobbyScreenProps) {
  const currentPlayer = players.find((p) => p.id === currentUserId);
  const teamBlue = players.filter((p) => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed = players.filter((p) => p.team === 'red').sort((a, b) => a.position - b.position);

  const renderPlayerCard = (player: Player | undefined, slotPosition: number) => {
    if (!player) {
      return (
        <div className="relative">
          <div className="bg-slate-800/30 border-2 border-slate-700/50 h-72 flex items-center justify-center">
            <span className="text-slate-600 font-bold italic text-lg">WAITING</span>
          </div>
          <div className="h-2 bg-slate-700/30 mt-2"></div>
        </div>
      );
    }

    const characterData = player.characterClass ? CHARACTERS[player.characterClass] : null;
    const isCurrentPlayer = player.id === currentUserId;

    return (
      <div className="relative">
        {player.isReady && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-lime-400 px-4 py-1 transform -skew-x-12">
            <span className="text-black font-black text-xs tracking-wider skew-x-12 inline-block">
              READY
            </span>
          </div>
        )}

        <div
          className={`relative border-4 h-72 transition-all ${
            player.team === 'blue'
              ? 'border-cyan-400 bg-gradient-to-b from-cyan-900/30 to-slate-900/50'
              : 'border-red-400 bg-gradient-to-b from-red-900/30 to-slate-900/50'
          }`}
        >
          {characterData ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-slate-900/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="text-6xl z-10">
                  {characterData.class === 'barbarian' && '⚔️'}
                  {characterData.class === 'knight' && '🛡️'}
                  {characterData.class === 'ranger' && '🏹'}
                  {characterData.class === 'wizard' && '🔮'}
                </div>
              </div>
              <div className="bg-black/80 p-3">
                <div
                  className={`font-black text-xl tracking-wide uppercase ${
                    player.team === 'blue' ? 'text-cyan-400' : 'text-red-400'
                  } italic`}
                >
                  {characterData.name}
                </div>
                <div className="text-white text-sm mt-1">
                  {isCurrentPlayer && 'PLAYER 1 (You)'}
                  {!isCurrentPlayer && `PLAYER ${slotPosition + 1}`}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 border-4 border-slate-600 mx-auto mb-3"></div>
                <div className="text-white text-sm font-semibold">
                  {isCurrentPlayer && 'PLAYER 1 (You)'}
                  {!isCurrentPlayer && `PLAYER ${slotPosition + 1}`}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`h-2 mt-2 ${
            player.team === 'blue' ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
          }`}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDI1NSwgMTUwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="text-lime-400 font-bold text-sm tracking-widest italic">
              KINETIC VOID
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-white font-semibold tracking-wider">DUNGEON LOBBY</div>
          </div>

          <div className="flex items-center gap-4">
            <Settings className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
            <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-sm border border-lime-400/30 px-4 py-2">
              <div className="w-10 h-10 bg-slate-700 border-2 border-lime-400"></div>
              <div className="text-right">
                <div className="text-lime-400 font-bold text-xs">VANGUARD</div>
                <div className="text-white text-xs">{currentPlayer?.username || 'PLAYER_ONE'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <div className="bg-cyan-400 text-black font-black text-xl px-6 py-3 mb-6 transform -skew-x-6">
                <span className="skew-x-6 inline-block tracking-wider">TEAM BLUE</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {renderPlayerCard(teamBlue[0], 0)}
                {renderPlayerCard(teamBlue[1], 2)}
              </div>
            </div>

            <div>
              <div className="bg-red-500 text-black font-black text-xl px-6 py-3 mb-6 transform skew-x-6">
                <span className="-skew-x-6 inline-block tracking-wider">TEAM RED</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {renderPlayerCard(teamRed[0], 1)}
                {renderPlayerCard(teamRed[1], 3)}
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black border-4 border-white px-8 py-6 transform rotate-12">
              <span className="text-white font-black text-4xl tracking-widest">VS</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={onLeave}
              className="flex items-center gap-3 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600 text-red-400 px-6 py-3 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold tracking-wider">LEAVE LOBBY</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-slate-400 text-sm">
                REGION: <span className="text-white font-semibold">NA-WEST</span>
              </div>
              <div className="text-slate-400 text-sm">
                LATENCY: <span className="text-lime-400 font-semibold">24MS</span>
              </div>
              <div className="w-3 h-3 bg-lime-400 animate-pulse"></div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onSelectCharacter}
                disabled={currentPlayer?.isReady}
                className="bg-slate-700 hover:bg-slate-600 border-2 border-cyan-400 text-white px-8 py-3 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Swords className="w-5 h-5" />
                <span className="font-bold tracking-wider">SELECT CHARACTER</span>
              </button>

              <button
                onClick={onReady}
                disabled={!currentPlayer?.characterClass || currentPlayer?.isReady}
                className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1"></div>
                <div className="relative bg-lime-400 hover:bg-lime-300 border-2 border-black px-10 py-3 flex items-center gap-3 transform -skew-x-6 transition-all">
                  <Swords className="w-5 h-5 text-black skew-x-6" />
                  <span className="text-black font-black text-lg tracking-wider skew-x-6">
                    READY UP
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
