import { useState } from 'react';
import { X, Zap, Heart, Droplets, Swords, Shield } from 'lucide-react';
import { CharacterClass, CHARACTERS } from '../lib/gameData';

import barbarianImg from '../characters/Barbarian.png';
import knightImg    from '../characters/Knight.png';
import rangerImg    from '../characters/Ranger.png';
import wizardImg    from '../characters/Wizard.png';

const CHARACTER_IMAGES: Record<CharacterClass, string> = {
  barbarian: barbarianImg,
  knight:    knightImg,
  ranger:    rangerImg,
  wizard:    wizardImg,
};

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
  selectBg: string;      // active SELECT button background
  selectText: string;    // active SELECT button text
  inactiveBorder: string; // FIX: visible border on inactive cards
}> = {
  barbarian: {
    primary:       'text-orange-400',
    glow:          'rgba(249,115,22,0.6)',
    bg:            'from-orange-950/80 via-slate-900 to-slate-950',
    border:        'border-orange-900/40',
    activeBorder:  'border-orange-400',
    activeGlow:    'shadow-[0_0_40px_rgba(249,115,22,0.5)]',
    badge:         'bg-orange-500',
    badgeText:     'text-black',
    role:          'TANK',
    tagline:       'Unstoppable force',
    selectBg:      'bg-orange-500 border-transparent',
    selectText:    'text-black',
    inactiveBorder: 'border-orange-700/50',
  },
  knight: {
    primary:       'text-blue-400',
    glow:          'rgba(96,165,250,0.6)',
    bg:            'from-blue-950/80 via-slate-900 to-slate-950',
    border:        'border-blue-900/40',
    activeBorder:  'border-blue-400',
    activeGlow:    'shadow-[0_0_40px_rgba(96,165,250,0.5)]',
    badge:         'bg-blue-500',
    badgeText:     'text-white',
    role:          'SUPPORT',
    tagline:       'Shield of allies',
    selectBg:      'bg-blue-500 border-transparent',
    selectText:    'text-white',
    inactiveBorder: 'border-blue-700/50',
  },
  ranger: {
    primary:       'text-green-400',
    glow:          'rgba(74,222,128,0.6)',
    bg:            'from-green-950/80 via-slate-900 to-slate-950',
    border:        'border-green-900/40',
    activeBorder:  'border-green-400',
    activeGlow:    'shadow-[0_0_40px_rgba(74,222,128,0.5)]',
    badge:         'bg-green-500',
    badgeText:     'text-black',
    role:          'CROWD CONTROL',
    tagline:       'Swift & deadly',
    selectBg:      'bg-green-500 border-transparent',
    selectText:    'text-black',
    inactiveBorder: 'border-green-700/50',
  },
  wizard: {
    primary:       'text-purple-400',
    glow:          'rgba(168,85,247,0.6)',
    bg:            'from-purple-950/80 via-slate-900 to-slate-950',
    border:        'border-purple-900/40',
    activeBorder:  'border-purple-400',
    activeGlow:    'shadow-[0_0_40px_rgba(168,85,247,0.5)]',
    badge:         'bg-purple-500',
    badgeText:     'text-white',
    role:          'DEBUFFER',
    tagline:       'Master of chaos',
    selectBg:      'bg-purple-500 border-transparent',
    selectText:    'text-white',
    inactiveBorder: 'border-purple-700/50',
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
        {/* FIX: icons always visible, slightly dimmed when inactive */}
        <Icon className={`w-3 h-3 ${active ? color : 'text-slate-500'}`} />
        <span className={`text-[10px] font-black tracking-widest uppercase ${active ? 'text-slate-300' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
      {/* FIX: value always visible */}
      <span className={`text-[10px] font-mono font-bold ${active ? color : 'text-slate-400'}`}>{value}</span>
    </div>
    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
        style={{ width: `${(value / max) * 100}%`, opacity: active ? 1 : 0.35 }}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal — FIX: use w-[95vw] max-w-6xl so Wizard card is never clipped */}
      <div className="relative w-[95vw] max-w-6xl z-10">

        {/* Outer glow border */}
        <div className="absolute -inset-px bg-gradient-to-b from-lime-400/30 via-transparent to-transparent rounded-sm pointer-events-none" />

        <div className="relative bg-[#08090f] border border-slate-800 rounded-sm overflow-hidden">

          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-lime-600/20 via-lime-400/30 to-lime-600/20" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(0,0,0,0.1) 40px,rgba(0,0,0,0.1) 41px)' }}
            />
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

          {/* Cards grid — FIX: gap-3 instead of gap-4 gives each card a little more room */}
          <div className="p-5 grid grid-cols-4 gap-3">
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
                    ${active
                      ? `${theme.activeBorder} ${theme.activeGlow} scale-[1.03] -translate-y-1`
                      : `${theme.inactiveBorder} hover:scale-[1.02]`}
                    ${isSel ? 'scale-[1.05] brightness-125' : ''}
                  `}
                >
                  {/* Corner accents */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-colors duration-300 ${active ? theme.activeBorder : 'border-slate-600'}`} />
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-colors duration-300 ${active ? theme.activeBorder : 'border-slate-600'}`} />

                  {/* Role badge */}
                  <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 ${theme.badge} ${theme.badgeText} text-[9px] font-black tracking-widest rounded-sm whitespace-nowrap`}>
                    {theme.role}
                  </div>

                  {/* ── Character image ─────────────────────────────────────
                      FIX: All 4 cards use identical container height (h-48)
                      with object-cover + object-top so every character is
                      cropped at the same vertical level — no more mismatched
                      torso heights.
                  ────────────────────────────────────────────────────────── */}
                  <div className="relative h-48 overflow-hidden bg-black flex-shrink-0">

                    {/* Ambient glow behind character */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at 50% 60%, ${theme.glow} 0%, transparent 70%)` }}
                    />

                    {/* Scan lines */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20 z-10"
                      style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)' }}
                    />

                    {/*
                      object-cover fills the fixed-height box.
                      object-top anchors to the top of the sprite (head/torso).
                      All 4 cards are now cropped identically.
                    */}
                    <img
                      src={CHARACTER_IMAGES[cls]}
                      alt={char.name}
                      className={`
                        relative z-10 w-full h-full object-cover object-top
                        transition-transform duration-500 drop-shadow-2xl
                        ${active ? 'scale-105' : 'scale-100'}
                      `}
                    />

                    {/* Bottom fade into card body */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent z-20" />
                  </div>

                  {/* Info section */}
                  <div className="p-3 space-y-2.5 flex-1">

                    {/* Name + tagline */}
                    <div>
                      <div className={`font-black text-base tracking-wider uppercase transition-colors duration-300 ${active ? theme.primary : 'text-slate-300'}`}>
                        {char.name}
                      </div>
                      <div className={`text-[10px] italic transition-colors duration-300 ${active ? 'text-slate-400' : 'text-slate-500'}`}>
                        {theme.tagline}
                      </div>
                    </div>

                    {/* Stat bars — always readable, dimmed not hidden */}
                    <div className="space-y-1.5">
                      <StatBar icon={Heart}    label="HP"   value={char.maxHp}   max={210} color="text-rose-400" active={active} />
                      <StatBar icon={Droplets} label="Mana" value={char.maxMana} max={130} color="text-blue-400" active={active} />
                    </div>

                    {/* Divider */}
                    <div className={`h-px transition-colors duration-300 ${active ? 'bg-slate-700' : 'bg-slate-800'}`} />

                    {/* Abilities — FIX: always show names, damage number anchored with a dot separator */}
                    <div className="space-y-1.5">
                      {char.abilities.slice(0, 3).map(ab => (
                        <div key={ab.id} className="flex items-center gap-1.5">
                          {/* Icon pill */}
                          <div className={`w-4 h-4 shrink-0 rounded-sm flex items-center justify-center ${
                            ab.type === 'attack' ? 'bg-red-500/20' : 'bg-blue-500/20'
                          }`}>
                            {ab.type === 'attack'
                              ? <Swords className="w-2.5 h-2.5 text-red-400" />
                              : <Shield className="w-2.5 h-2.5 text-blue-400" />}
                          </div>

                          {/* Ability name — always legible */}
                          <span className={`text-[10px] font-bold tracking-wide flex-1 transition-colors duration-300 ${active ? 'text-slate-200' : 'text-slate-400'}`}>
                            {ab.name}
                          </span>

                          {/* FIX: damage badge — small coloured chip instead of raw floating number */}
                          {ab.damage && (
                            <span className={`text-[9px] font-mono font-black px-1 py-0.5 rounded-sm ${
                              active
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {ab.damage}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SELECT button ──────────────────────────────────────
                      FIX: inactive state now has a visible slate border +
                      muted text instead of nearly invisible outline.
                      Active state fills with the class colour.
                  ────────────────────────────────────────────────────────── */}
                  <div className={`mx-3 mb-3 py-2 rounded-sm text-center text-xs font-black tracking-widest transition-all duration-300 border ${
                    active
                      ? `${theme.selectBg} ${theme.selectText}`
                      : 'bg-slate-800/80 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                  }`}>
                    {isSel ? '✓ SELECTED' : active ? 'CLICK TO SELECT' : 'SELECT'}
                  </div>

                  {/* Bottom accent bar */}
                  <div className={`h-0.5 transition-all duration-300 ${active ? theme.badge : 'bg-slate-800'}`} />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-red-500/20 rounded-sm flex items-center justify-center">
                  <Swords className="w-2 h-2 text-red-400" />
                </span>
                Attack ability
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-blue-500/20 rounded-sm flex items-center justify-center">
                  <Shield className="w-2 h-2 text-blue-400" />
                </span>
                Defense ability
              </span>
            </div>
            <p className="text-slate-500 text-[10px] italic tracking-wider">
              Hover to preview · Click to confirm
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}