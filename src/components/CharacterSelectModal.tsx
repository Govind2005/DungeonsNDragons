import { X } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (characterClass: CharacterClass) => void;
}

export function CharacterSelectModal({ isOpen, onClose, onSelect }: CharacterSelectModalProps) {
  if (!isOpen) return null;

  const characterClasses: CharacterClass[] = ['barbarian', 'knight', 'ranger', 'wizard'];

  const handleSelect = (characterClass: CharacterClass) => {
    onSelect(characterClass);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="relative max-w-6xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-12 h-12 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-slate-900 border-4 border-lime-400">
          <div className="bg-gradient-to-r from-lime-600 to-lime-400 px-8 py-6">
            <h2 className="text-black font-black text-3xl tracking-wider text-center">
              SELECT YOUR CHAMPION
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-4 gap-6">
              {characterClasses.map((characterClass) => {
                const character = CHARACTERS[characterClass];

                return (
                  <button
                    key={characterClass}
                    onClick={() => handleSelect(characterClass)}
                    className="group relative bg-slate-800 hover:bg-slate-700 border-4 border-slate-700 hover:border-lime-400 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="aspect-[3/4] bg-slate-900 flex items-center justify-center text-7xl relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="relative z-10">
                        {characterClass === 'barbarian' && '⚔️'}
                        {characterClass === 'knight' && '🛡️'}
                        {characterClass === 'ranger' && '🏹'}
                        {characterClass === 'wizard' && '🔮'}
                      </div>
                    </div>

                    <div className="p-4 relative z-10">
                      <div className="text-lime-400 font-black text-xl tracking-wide uppercase mb-2 group-hover:text-lime-300 transition-colors">
                        {character.name}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">HP</span>
                          <span className="text-white font-mono font-bold">{character.maxHp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">MANA</span>
                          <span className="text-cyan-400 font-mono font-bold">{character.maxMana}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">ABILITIES</div>
                        <div className="space-y-1">
                          {character.abilities.slice(0, 3).map((ability) => (
                            <div key={ability.id} className="text-xs text-slate-300">
                              • {ability.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-lime-400 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 text-center text-slate-400 text-sm">
              Click on a character to select them for battle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
