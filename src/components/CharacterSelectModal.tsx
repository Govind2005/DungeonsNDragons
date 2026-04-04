import { useState } from 'react';
import { X, Zap, Heart, Droplets, Swords, Shield } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (characterClass: CharacterClass) => void;
}

const CLASS_THEMES: Record<CharacterClass, {
  primary: string;
  glow: string;
  bg: string;
  border: string;
  activeBorder: string;
  activeGlow: string;
  badge: string;
  badgeText: string;
  role: string;
  tagline: string;
}> = {
  barbarian: {
    primary:     'text-orange-400',
    glow:        'rgba(249,115,22,0.6)',
    bg:          'from-orange-950/80 via-slate-900 to-slate-950',
    border:      'border-orange-900/40',
    activeBorder:'border-orange-400',
    activeGlow:  'shadow-[0_0_40px_rgba(249,115,22,0.5)]',
    badge:       'bg-orange-500',
    badgeText:   'text-black',
    role:        'TANK',
    tagline:     'Unstoppable force',
  },
  knight: {
    primary:     'text-blue-400',
    glow:        'rgba(96,165,250,0.6)',
    bg:          'from-blue-950/80 via-slate-900 to-slate-950',
    border:      'border-blue-900/40',
    activeBorder:'border-blue-400',
    activeGlow:  'shadow-[0_0_40px_rgba(96,165,250,0.5)]',
    badge:       'bg-blue-500',
    badgeText:   'text-white',
    role:        'SUPPORT',
    tagline:     'Shield of allies',
  },
  ranger: {
    primary:     'text-green-400',
    glow:        'rgba(74,222,128,0.6)',
    bg:          'from-green-950/80 via-slate-900 to-slate-950',
    border:      'border-green-900/40',
    activeBorder:'border-green-400',
    activeGlow:  'shadow-[0_0_40px_rgba(74,222,128,0.5)]',
    badge:       'bg-green-500',
    badgeText:   'text-black',
    role:        'CROWD CONTROL',
    tagline:     'Swift & deadly',
  },
  wizard: {
    primary:     'text-purple-400',
    glow:        'rgba(168,85,247,0.6)',
    bg:          'from-purple-950/80 via-slate-900 to-slate-950',
    border:      'border-purple-900/40',
    activeBorder:'border-purple-400',
    activeGlow:  'shadow-[0_0_40px_rgba(168,85,247,0.5)]',
    badge:       'bg-purple-500',
    badgeText:   'text-white',
    role:        'DEBUFFER',
    tagline:     'Master of chaos',
  },
};

const StatBar = ({
  icon: Icon,
  label,
  value,
  max,
  color,
  active,
}: {
  icon: any;
  label: string;
  value: number;
  max: number;
  color: string;
  active: boolean;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${active ? color : 'text-slate-600'}`} />
        <span className={`text-[10px] font-black tracking-widest uppercase ${active ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      </div>
      <span className={`text-[10px] font-mono font-bold ${active ? color : 'text-slate-600'}`}>{value}</span>
    </div>
    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
        style={{ width: active ? `${(value / max) * 100}%` : '0%' }}
      />
    </div>
  </div>
);

export function CharacterSelectModal({ isOpen, onClose, onSelect }: CharacterSelectModalProps) {
  const [hoveredClass, setHoveredClass] = useState<CharacterClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);

  if (!isOpen) return null;

  const characterClasses: CharacterClass[] = ['barbarian', 'knight', 'ranger', 'wizard'];

  const handleSelect = (cls: CharacterClass) => {
    setSelectedClass(cls);
    setTimeout(() => {
      onSelect(cls);
      onClose();
      setSelectedClass(null);
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl z-10">

        {/* Outer glow border */}
        <div className="absolute -inset-px bg-gradient-to-b from-lime-400/30 via-transparent to-transparent rounded-sm pointer-events-none" />

        <div className="relative bg-[#08090f] border border-slate-800 rounded-sm overflow-hidden">

          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-lime-600/20 via-lime-400/30 to-lime-600/20" />
            <div className="absolute inset-0"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(0,0,0,0.1) 40px,rgba(0,0,0,0.1) 41px)' }} />
            <div className="relative flex items-center justify-between px-8 py-5">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-lime-400" />
                <div>
                  <h2 className="text-white font-black text-xl tracking-widest uppercase">Select Your Champion</h2>
                  <p className="text-lime-400/60 text-[10px] tracking-widest">Choose wisely. Your team depends on it</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 hover:border-red-500 text-red-400 flex items-center justify-center transition-all rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards grid */}
          <div className="p-6 grid grid-cols-4 gap-4">
            {characterClasses.map((cls) => {
              const char    = CHARACTERS[cls];
              const theme   = CLASS_THEMES[cls];
              const isHover = hoveredClass === cls;
              const isSel   = selectedClass === cls;
              const active  = isHover || isSel;

              return (
                <button
                  key={cls}
                  onClick={() => handleSelect(cls)}
                  onMouseEnter={() => setHoveredClass(cls)}
                  onMouseLeave={() => setHoveredClass(null)}
                  className={`
                    group relative flex flex-col overflow-hidden rounded-sm border-2 transition-all duration-300 text-left
                    bg-gradient-to-b ${theme.bg}
                    ${active ? `${theme.activeBorder} ${theme.activeGlow} scale-[1.03] -translate-y-1` : `${theme.border} hover:scale-[1.02]`}
                    ${isSel ? 'scale-[1.05] brightness-125' : ''}
                  `}
                >
                  {/* Top corner accent */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-300 ${active ? theme.activeBorder : 'border-slate-700'}`} />
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-300 ${active ? theme.activeBorder : 'border-slate-700'}`} />

                  {/* Role badge */}
                  <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 ${theme.badge} ${theme.badgeText} text-[9px] font-black tracking-widest rounded-sm`}>
                    {theme.role}
                  </div>

                  {/* Character image */}
                  <div className="relative h-52 overflow-hidden bg-black/40 flex items-end justify-center">
                    {/* Background glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at 50% 100%, ${theme.glow} 0%, transparent 70%)` }}
                    />
                    {/* Scan lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                      style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)' }} />

                    <img
                      src={char.image}
                      alt={char.name}
                      className={`relative z-10 h-44 w-auto object-contain transition-all duration-500 drop-shadow-2xl ${active ? 'scale-110 translate-y-1' : 'scale-100'}`}
                    />

                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent z-20" />
                  </div>

                  {/* Info section */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Name + tagline */}
                    <div>
                      <div className={`font-black text-lg tracking-wider uppercase transition-colors duration-300 ${active ? theme.primary : 'text-slate-400'}`}>
                        {char.name}
                      </div>
                      <div className={`text-[10px] italic transition-colors duration-300 ${active ? 'text-slate-400' : 'text-slate-700'}`}>
                        {theme.tagline}
                      </div>
                    </div>

                    {/* Stat bars */}
                    <div className="space-y-2">
                      <StatBar icon={Heart}    label="HP"   value={char.maxHp}   max={210} color="text-rose-400"  active={active} />
                      <StatBar icon={Droplets} label="Mana" value={char.maxMana} max={130} color="text-blue-400"  active={active} />
                    </div>

                    {/* Divider */}
                    <div className={`h-px transition-colors duration-300 ${active ? 'bg-slate-700' : 'bg-slate-800'}`} />

                    {/* Abilities */}
                    <div className="space-y-1.5">
                      {char.abilities.slice(0, 3).map(ab => (
                        <div key={ab.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 shrink-0 rounded-sm flex items-center justify-center ${ab.type === 'attack' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                            {ab.type === 'attack'
                              ? <Swords className="w-2.5 h-2.5 text-red-400" />
                              : <Shield className="w-2.5 h-2.5 text-blue-400" />}
                          </div>
                          <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                            {ab.name}
                          </span>
                          {ab.damage && (
                            <span className="ml-auto text-[9px] font-mono text-red-500/60">{ab.damage}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Select CTA */}
                  <div className={`mx-4 mb-4 py-2 rounded-sm text-center text-xs font-black tracking-widest transition-all duration-300 border ${
                    active
                      ? `${theme.badge} ${theme.badgeText} border-transparent`
                      : 'bg-transparent border-slate-700 text-slate-600'
                  }`}>
                    {isSel ? 'âœ“ SELECTED' : active ? 'CLICK TO SELECT' : 'SELECT'}
                  </div>

                  {/* Bottom accent bar */}
                  <div className={`h-0.5 transition-all duration-300 ${active ? theme.badge.replace('bg-', 'bg-') : 'bg-slate-800'}`} />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-slate-700">
              <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-red-500/50" /> Attack ability</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500/50" /> Defense ability</span>
            </div>
            <p className="text-slate-600 text-[10px] italic tracking-wider">
              Hover to preview Â· Click to confirm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}