import { useState, useEffect, useCallback } from 'react';
import { Swords, Shield, Zap } from 'lucide-react';
import { CharacterClass, CHARACTERS, Ability } from '../lib/gameData';

// ── Character head imports ───────────────────────────────────────────────────
import barbarianHead from '../characters/barbarian_head.png';
import knightHead    from '../characters/knight_head.png';
import rangerHead    from '../characters/ranger_head.png';
import wizardHead    from '../characters/wizard_head.png';

const CHARACTER_HEADS: Record<CharacterClass, string> = {
  barbarian: barbarianHead,
  knight:    knightHead,
  ranger:    rangerHead,
  wizard:    wizardHead,
};

interface BattlePlayer {
  id: string;
  username: string;
  team: 'blue' | 'red';
  characterClass: CharacterClass;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  position: number;
  attackPowerBuff: number;
  isBound: boolean;
  isWeakened: boolean;
  isInvisible: boolean;
}

interface BattleScreenProps {
  players: BattlePlayer[];
  currentTurn: number;
  onAttack: (abilityId: string, targetIds: string[]) => void;
  onDefense: (abilityId: string) => void;
}

export function BattleScreen({ players, currentTurn, onAttack, onDefense }: BattleScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'attack' | 'defense' | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [cinematicAction, setCinematicAction] = useState<{ ability: Ability; player: BattlePlayer; isLeft: boolean } | null>(null);

  // ── Hit / heal effect states ─────────────────────────────────────────────
  // hitEffect: tracks which player is being hit and with what "flavour"
  const [hitEffect, setHitEffect] = useState<{ id: string; type: 'slash' | 'magic' | 'bind' | 'drain' } | null>(null);
  // healEffect: tracks which player is receiving a heal pulse
  const [healEffect, setHealEffect] = useState<string | null>(null);
  // floatingTexts: damage / heal numbers that float up and fade
  const [floatingTexts, setFloatingTexts] = useState<
    { uid: number; targetId: string; text: string; color: string }[]
  >([]);

  const currentPlayer = players.find(p => p.position === currentTurn);
  const isMyTurn = true;
  const myPlayer = currentPlayer;
  const teamBlue = players.filter(p => p.team === 'blue').sort((a, b) => a.position - b.position);
  const teamRed  = players.filter(p => p.team === 'red').sort((a, b) => a.position - b.position);
  const abilities       = myPlayer ? CHARACTERS[myPlayer.characterClass].abilities : [];
  const attackAbilities  = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');

  useEffect(() => {
    setSelectedTab(null);
    setSelectedTargets([]);
  }, [currentTurn]);

  useEffect(() => {
    if (selectedTargets.length === 0 && currentPlayer) {
      const enemies = (currentPlayer.team === 'blue' ? teamRed : teamBlue).filter(p => p.currentHp > 0);
      if (enemies.length > 0) setSelectedTargets([enemies[0].id]);
    }
  }, [currentTurn, currentPlayer, selectedTargets]);

  const triggerShake = useCallback((playerId: string) => {
    setShakingId(playerId);
    setTimeout(() => setShakingId(null), 500);
  }, []);

  // Spawn a floating number above a character then auto-remove it
  const spawnFloat = useCallback((targetId: string, text: string, color: string) => {
    const uid = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { uid, targetId, text, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.uid !== uid)), 1100);
  }, []);

  // Resolve which hit-effect flavour an ability maps to
  const abilityHitType = (ab: Ability): 'slash' | 'magic' | 'bind' | 'drain' => {
    if (ab.id === 'pinning_arrow' || ab.id === 'shield_bash') return 'bind';
    if (ab.id === 'mind_siphon') return 'drain';
    if (ab.id === 'arcane_burst' || ab.id === 'cataclysm') return 'magic';
    return 'slash';
  };

  const executeAction = useCallback((ability: Ability, targets: string[]) => {
    if (ability.type === 'attack') {
      const flavour = abilityHitType(ability);
      targets.forEach(id => {
        triggerShake(id);
        // Show the hit overlay on the target
        setHitEffect({ id, type: flavour });
        setTimeout(() => setHitEffect(null), 600);
        // Floating damage number — use ability.damage if available, else generic "HIT"
        const dmgText = ability.damage ? `-${ability.damage}` : 'HIT';
        const dmgColor = flavour === 'magic' ? '#a78bfa' : flavour === 'bind' ? '#fbbf24' : flavour === 'drain' ? '#34d399' : '#f87171';
        spawnFloat(id, dmgText, dmgColor);
      });
      onAttack(ability.id, targets);
    } else {
      // Defense / heal abilities — green pulse on the caster (myPlayer)
      if (myPlayer) {
        setHealEffect(myPlayer.id);
        setTimeout(() => setHealEffect(null), 800);
        spawnFloat(myPlayer.id, ability.effect?.includes('HP') ? '+HP' : ability.effect?.includes('mana') ? '+MP' : '✦', '#4ade80');
      }
      onDefense(ability.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAttack, onDefense, triggerShake, spawnFloat, myPlayer]);

  const handleAbilityClick = (ability: Ability) => {
    if (!isMyTurn || !myPlayer || myPlayer.currentMana < ability.manaCost || cinematicAction) return;

    let targetsToUse = selectedTargets;
    if (ability.type === 'attack') {
      if (ability.target === 'aoe') {
        const enemies = (currentPlayer?.team === 'blue' ? teamRed : teamBlue).filter(p => p.currentHp > 0);
        targetsToUse = enemies.map(p => p.id);
      } else {
        if (selectedTargets.length !== 1) return;
      }
    }

    const isLeft = myPlayer.team === 'blue';
    setCinematicAction({ ability, player: myPlayer, isLeft });
    setSelectedTab(null);
    setSelectedTargets([]);

    setTimeout(() => {
      executeAction(ability, targetsToUse);
      setCinematicAction(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#060a18] flex flex-col relative overflow-hidden font-mono">

      {/* ═══════════════════════════════════════════════
          BACKGROUND: Cyberpunk Arena
      ═══════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Sky gradient base */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, #1a2a6c 0%, #0b132b 50%, #060a18 100%)'
        }}/>

        {/* Left team cyan ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 15% 60%, rgba(0,234,255,0.18) 0%, transparent 50%)'
        }}/>

        {/* Right team magenta ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 85% 60%, rgba(255,45,122,0.18) 0%, transparent 50%)'
        }}/>

        {/* Center purple vertical beam from floor */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(123,47,255,0.22) 0%, transparent 60%)'
        }}/>

        {/* Stars */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice">
          {([
            [80,40,1],[180,20,1.5],[320,55,1],[450,15,1],[600,35,1.5],
            [720,50,1],[850,22,1],[950,60,1.5],[1050,30,1],[1150,45,1],
            [140,80,1],[400,90,1],[700,75,1],[1000,85,1],[250,120,1],
            [560,100,1],[900,110,1],[350,65,1],[480,30,1.5],[780,48,1],
            [1100,20,1.5],[50,90,1],[670,18,1],[1020,55,1]
          ] as [number,number,number][]).map(([x,y,r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.35 + (i % 4) * 0.15}/>
          ))}
        </svg>

        {/* Moon with glow halo */}
        <div className="absolute" style={{ top: 38, right: 210, width: 58, height: 58 }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: '#daeeff',
            boxShadow: '0 0 50px 20px rgba(126,200,240,0.28), 0 0 100px 40px rgba(126,200,240,0.12)'
          }}/>
          <div className="absolute rounded-full bg-[#b0cce0] opacity-50" style={{ top:9, left:7, width:11, height:11 }}/>
          <div className="absolute rounded-full bg-[#b0cce0] opacity-35" style={{ top:20, left:25, width:7, height:7 }}/>
          <div className="absolute rounded-full bg-[#c8dff0] opacity-25" style={{ top:32, left:12, width:5, height:5 }}/>
        </div>

        {/* City skyline SVG — far + mid layers */}
        <svg
          className="absolute w-full"
          style={{ bottom: '30%' }}
          viewBox="0 0 1200 340"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* ── Far distant buildings (darkest) ── */}
          <g fill="#0d1b35">
            <rect x="0"    y="160" width="35" height="180"/>
            <rect x="38"   y="110" width="20" height="230"/>
            <rect x="60"   y="140" width="40" height="200"/>
            <rect x="103"  y="90"  width="25" height="250"/>
            <rect x="130"  y="120" width="50" height="220"/>
            <rect x="183"  y="70"  width="18" height="270"/>
            <rect x="203"  y="100" width="35" height="240"/>
            <rect x="250"  y="130" width="22" height="210"/>
            <rect x="275"  y="85"  width="30" height="255"/>
            <rect x="308"  y="115" width="45" height="225"/>
            <rect x="356"  y="100" width="20" height="240"/>
            <rect x="750"  y="95"  width="28" height="245"/>
            <rect x="782"  y="120" width="38" height="220"/>
            <rect x="823"  y="80"  width="22" height="260"/>
            <rect x="848"  y="110" width="42" height="230"/>
            <rect x="893"  y="135" width="18" height="205"/>
            <rect x="990"  y="105" width="30" height="235"/>
            <rect x="1023" y="130" width="50" height="210"/>
            <rect x="1076" y="85"  width="22" height="255"/>
            <rect x="1101" y="110" width="38" height="230"/>
            <rect x="1142" y="140" width="58" height="200"/>
          </g>

          {/* ── Mid towers ── */}
          <g fill="#0f2240">
            <rect x="20"   y="50"  width="62" height="290"/>
            <rect x="85"   y="20"  width="46" height="320"/>
            <rect x="133"  y="65"  width="72" height="275"/>
            <rect x="207"  y="10"  width="36" height="330"/>
            <rect x="1060" y="40"  width="66" height="300"/>
            <rect x="1010" y="15"  width="48" height="325"/>
            <rect x="960"  y="60"  width="50" height="280"/>
            <rect x="915"  y="5"   width="43" height="335"/>
          </g>

          {/* ── Antennae ── */}
          <rect x="38"   y="18"  width="4" height="32" fill="#0f2240"/>
          <circle cx="40"   cy="16"  r="3.5" fill="#ff2d7a" opacity="0.95"/>
          <rect x="208"  y="-5"  width="3" height="28" fill="#091628"/>
          <circle cx="209"  cy="-7"  r="2.5" fill="#00eaff" opacity="0.9"/>
          <rect x="1088" y="8"   width="4" height="32" fill="#0f2240"/>
          <circle cx="1090" cy="6"  r="3.5" fill="#ff2d7a" opacity="0.95"/>
          <rect x="934"  y="-8"  width="3" height="28" fill="#091628"/>
          <circle cx="935"  cy="-10" r="2.5" fill="#00eaff" opacity="0.9"/>

          {/* ── Windows: left towers ── */}
          <g fill="#00eaff" opacity="0.75">
            <rect x="28" y="58" width="7" height="4"/><rect x="50" y="58" width="7" height="4"/>
            <rect x="39" y="72" width="7" height="4"/><rect x="28" y="86" width="7" height="4"/>
            <rect x="50" y="100" width="7" height="4"/><rect x="39" y="114" width="7" height="4"/>
            <rect x="28" y="128" width="7" height="4"/><rect x="50" y="142" width="7" height="4"/>
            <rect x="92" y="28" width="5" height="4"/><rect x="104" y="28" width="5" height="4"/>
            <rect x="116" y="42" width="5" height="4"/><rect x="92" y="56" width="5" height="4"/>
            <rect x="104" y="70" width="5" height="4"/><rect x="116" y="84" width="5" height="4"/>
            <rect x="92" y="98" width="5" height="4"/>
            <rect x="141" y="73" width="7" height="4"/><rect x="154" y="73" width="7" height="4"/>
            <rect x="167" y="87" width="7" height="4"/><rect x="141" y="101" width="7" height="4"/>
            <rect x="167" y="115" width="7" height="4"/><rect x="154" y="129" width="7" height="4"/>
          </g>
          <g fill="#ffe18a" opacity="0.65">
            <rect x="39" y="58" width="7" height="4"/><rect x="28" y="72" width="7" height="4"/>
            <rect x="50" y="86" width="7" height="4"/><rect x="39" y="100" width="7" height="4"/>
            <rect x="28" y="114" width="7" height="4"/><rect x="50" y="128" width="7" height="4"/>
            <rect x="92" y="42" width="5" height="4"/><rect x="116" y="28" width="5" height="4"/>
            <rect x="104" y="56" width="5" height="4"/><rect x="92" y="70" width="5" height="4"/>
            <rect x="116" y="98" width="5" height="4"/>
            <rect x="154" y="87" width="7" height="4"/><rect x="141" y="115" width="7" height="4"/>
            <rect x="167" y="101" width="7" height="4"/><rect x="154" y="143" width="7" height="4"/>
          </g>
          <g fill="#ff2d7a" opacity="0.6">
            <rect x="28" y="142" width="7" height="4"/><rect x="104" y="84" width="5" height="4"/>
            <rect x="141" y="129" width="7" height="4"/>
          </g>

          {/* ── Windows: right towers ── */}
          <g fill="#00eaff" opacity="0.75">
            <rect x="1067" y="48"  width="7" height="4"/><rect x="1080" y="62"  width="7" height="4"/>
            <rect x="1093" y="48"  width="7" height="4"/><rect x="1067" y="76"  width="7" height="4"/>
            <rect x="1093" y="90"  width="7" height="4"/><rect x="1080" y="104" width="7" height="4"/>
            <rect x="1067" y="118" width="7" height="4"/><rect x="1093" y="132" width="7" height="4"/>
            <rect x="1017" y="23"  width="5" height="4"/><rect x="1030" y="37"  width="5" height="4"/>
            <rect x="1043" y="23"  width="5" height="4"/><rect x="1017" y="51"  width="5" height="4"/>
            <rect x="1043" y="65"  width="5" height="4"/><rect x="1030" y="79"  width="5" height="4"/>
            <rect x="967" y="68" width="7" height="4"/><rect x="980" y="82"  width="7" height="4"/>
            <rect x="993" y="68" width="7" height="4"/><rect x="967" y="96"  width="7" height="4"/>
            <rect x="980" y="110" width="7" height="4"/>
          </g>
          <g fill="#ffe18a" opacity="0.65">
            <rect x="1080" y="48"  width="7" height="4"/><rect x="1067" y="62"  width="7" height="4"/>
            <rect x="1093" y="76"  width="7" height="4"/><rect x="1080" y="90"  width="7" height="4"/>
            <rect x="1067" y="104" width="7" height="4"/><rect x="1093" y="118" width="7" height="4"/>
            <rect x="1017" y="37"  width="5" height="4"/><rect x="1043" y="51"  width="5" height="4"/>
            <rect x="1030" y="65"  width="5" height="4"/><rect x="1017" y="79"  width="5" height="4"/>
            <rect x="967" y="82"  width="7" height="4"/><rect x="993" y="96"  width="7" height="4"/>
            <rect x="967" y="110" width="7" height="4"/>
          </g>
          <g fill="#ff2d7a" opacity="0.6">
            <rect x="1080" y="118" width="7" height="4"/><rect x="1043" y="37" width="5" height="4"/>
            <rect x="993" y="82" width="7" height="4"/>
          </g>

          {/* ── Neon signs ── */}
          <rect x="30"   y="185" width="55" height="11" rx="2" fill="none" stroke="#00eaff" strokeWidth="1.5" opacity="0.85"/>
          <text x="57"   y="194" textAnchor="middle" fontSize="7" fill="#00eaff" fontFamily="monospace" opacity="0.95">CYBER·NET</text>
          <rect x="30"   y="202" width="42" height="9"  rx="2" fill="none" stroke="#ff2d7a" strokeWidth="1.5" opacity="0.75"/>
          <text x="51"   y="210" textAnchor="middle" fontSize="6" fill="#ff2d7a" fontFamily="monospace" opacity="0.95">ARENA·01</text>
          <rect x="1113" y="185" width="58" height="11" rx="2" fill="none" stroke="#ff2d7a" strokeWidth="1.5" opacity="0.85"/>
          <text x="1142" y="194" textAnchor="middle" fontSize="7" fill="#ff2d7a" fontFamily="monospace" opacity="0.95">BATTLE·SYS</text>
          <rect x="1127" y="202" width="42" height="9"  rx="2" fill="none" stroke="#00eaff" strokeWidth="1.5" opacity="0.75"/>
          <text x="1148" y="210" textAnchor="middle" fontSize="6" fill="#00eaff" fontFamily="monospace" opacity="0.95">NODE·07</text>
        </svg>

        {/* Foreground dark street-level buildings */}
        <div className="absolute bottom-0 left-0 w-28 h-[32%] bg-[#06101f]"/>
        <div className="absolute bottom-0 right-0 w-28 h-[32%] bg-[#06101f]"/>
        <div className="absolute bottom-0 left-24 w-20 h-[26%] bg-[#070d1e]"/>
        <div className="absolute bottom-0 right-24 w-20 h-[26%] bg-[#070d1e]"/>

        {/* Arena floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={{
          background: 'linear-gradient(to bottom, #0a1628, #030609)'
        }}/>

        {/* Horizon neon line with glow */}
        <div className="absolute left-0 right-0" style={{
          bottom: '30%',
          height: 2,
          background: 'rgba(0,234,255,0.5)',
          boxShadow: '0 0 20px 5px rgba(0,234,255,0.35), 0 0 60px 10px rgba(0,234,255,0.15)'
        }}/>

        {/* Perspective grid floor */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[30%]"
          viewBox="0 0 1200 225"
          preserveAspectRatio="none"
        >
          <line x1="600" y1="0" x2="0"    y2="225" stroke="#00eaff" strokeWidth="0.9" opacity="0.45"/>
          <line x1="600" y1="0" x2="100"  y2="225" stroke="#00eaff" strokeWidth="0.7" opacity="0.38"/>
          <line x1="600" y1="0" x2="200"  y2="225" stroke="#00eaff" strokeWidth="0.6" opacity="0.32"/>
          <line x1="600" y1="0" x2="300"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.28"/>
          <line x1="600" y1="0" x2="400"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.25"/>
          <line x1="600" y1="0" x2="500"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.22"/>
          <line x1="600" y1="0" x2="600"  y2="225" stroke="#00eaff" strokeWidth="1.1" opacity="0.55"/>
          <line x1="600" y1="0" x2="700"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.22"/>
          <line x1="600" y1="0" x2="800"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.25"/>
          <line x1="600" y1="0" x2="900"  y2="225" stroke="#00eaff" strokeWidth="0.5" opacity="0.28"/>
          <line x1="600" y1="0" x2="1000" y2="225" stroke="#00eaff" strokeWidth="0.6" opacity="0.32"/>
          <line x1="600" y1="0" x2="1100" y2="225" stroke="#00eaff" strokeWidth="0.7" opacity="0.38"/>
          <line x1="600" y1="0" x2="1200" y2="225" stroke="#00eaff" strokeWidth="0.9" opacity="0.45"/>
          <line x1="0" y1="35"  x2="1200" y2="35"  stroke="#00eaff" strokeWidth="0.7" opacity="0.42"/>
          <line x1="0" y1="75"  x2="1200" y2="75"  stroke="#00eaff" strokeWidth="0.6" opacity="0.33"/>
          <line x1="0" y1="118" x2="1200" y2="118" stroke="#00eaff" strokeWidth="0.5" opacity="0.25"/>
          <line x1="0" y1="165" x2="1200" y2="165" stroke="#00eaff" strokeWidth="0.4" opacity="0.18"/>
          <line x1="0" y1="210" x2="1200" y2="210" stroke="#00eaff" strokeWidth="0.4" opacity="0.13"/>
        </svg>

        {/* Vertical light beams */}
        <div className="absolute" style={{
          bottom: '30%', left: '21%', width: 130, height: '46%',
          background: 'linear-gradient(to bottom, transparent, rgba(0,234,255,0.07))',
          clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0% 100%)'
        }}/>
        <div className="absolute" style={{
          bottom: '30%', left: '45%', width: 150, height: '52%',
          background: 'linear-gradient(to bottom, transparent, rgba(123,47,255,0.09))',
          clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)'
        }}/>
        <div className="absolute" style={{
          bottom: '30%', right: '21%', width: 130, height: '46%',
          background: 'linear-gradient(to bottom, transparent, rgba(255,45,122,0.07))',
          clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0% 100%)'
        }}/>

        {/* Arena center divider glow line */}
        <div className="absolute" style={{
          bottom: '30%', left: '50%', transform: 'translateX(-50%)',
          width: 2, height: '22%',
          background: 'rgba(123,47,255,0.65)',
          boxShadow: '0 0 14px 4px rgba(123,47,255,0.45)'
        }}/>

        {/* Floor center ellipse glow */}
        <div className="absolute" style={{
          bottom: '28%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 40,
          background: 'radial-gradient(ellipse, rgba(123,47,255,0.18) 0%, transparent 70%)',
          borderRadius: '50%'
        }}/>

        {/* Vignette overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(2,4,8,0.78) 100%)'
        }}/>
      </div>

{/* ═══ HUD: Top Status Bars ═══ */}
      {/* ── Blue Team (left) ── */}
      <div className="absolute top-4 left-6 z-30 flex flex-col gap-6">
        {teamBlue.map((p) => {
          const isActive = p.id === currentPlayer?.id;
          const isTarget = selectedTargets.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => p.currentHp > 0 && setSelectedTargets([p.id])}
              className={`flex items-start gap-3 transition-all duration-300 mt-2 ${
                isActive
                  ? 'scale-110 -translate-x-2'
                  : isTarget
                  ? 'scale-105 translate-x-2'
                  : 'opacity-80 scale-90 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 cursor-pointer'
              }`}
            >
              {/* ── UNBOUND Character head avatar ── */}
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                {/* Glow aura (replaces the old colored border) */}
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-300 ${
                  isActive ? 'bg-cyan-400/70' : isTarget ? 'bg-red-500/70' : 'opacity-0'
                }`} />

                {/* Zoomed-in, borderless face */}
                <img
                  src={CHARACTER_HEADS[p.characterClass]}
                  alt={p.characterClass}
                  className={`relative z-10 w-24 h-24 max-w-none object-contain object-bottom drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-transform duration-300 ${
                    isActive ? 'scale-[1.3] drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]' 
                    : isTarget ? 'scale-[1.2] drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]' 
                    : 'scale-[1.15]'
                  }`}
                />

                {/* Position badge (Anchored to bottom right now since the circle border is gone) */}
                <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 bg-red-600 border border-slate-800 font-black text-[9px] text-white flex items-center justify-center rotate-45 shadow-xl">
                  <span className="-rotate-45">{p.position}</span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 pt-2">
                <div className="text-[9px] font-black text-white tracking-widest uppercase">{p.username}</div>
                <div className={`relative w-56 h-6 bg-slate-900 border-r-4 ${isActive ? 'border-cyan-400/80' : 'border-red-600/80'} skew-x-[-15deg] overflow-hidden`}>
                  <div
                    className={`h-full transition-all duration-700 ${isActive ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-orange-400'}`}
                    style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[15deg] font-black text-white text-[10px] tracking-widest">
                    {p.currentHp}/{p.maxHp}
                  </div>
                </div>
                <div className="relative w-48 h-4 bg-slate-900 border-r-4 border-lime-600/80 skew-x-[-15deg] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lime-600 to-lime-400 transition-all duration-700"
                    style={{ width: `${(p.currentMana / p.maxMana) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[15deg] font-black text-white text-[8px] tracking-widest">
                    {p.currentMana}/{p.maxMana}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Red Team (right) ── */}
      <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-6">
        {teamRed.map((p) => {
          const isActive = p.id === currentPlayer?.id;
          const isTarget = selectedTargets.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => p.currentHp > 0 && setSelectedTargets([p.id])}
              className={`flex items-start gap-3 flex-row-reverse transition-all duration-300 mt-2 ${
                isActive
                  ? 'scale-110 translate-x-2'
                  : isTarget
                  ? 'scale-105 -translate-x-2'
                  : 'opacity-80 scale-90 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 cursor-pointer'
              }`}
            >
              {/* ── UNBOUND Character head avatar ── */}
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                {/* Glow aura */}
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-300 ${
                  isActive ? 'bg-cyan-400/70' : isTarget ? 'bg-red-500/70' : 'opacity-0'
                }`} />

                {/* Zoomed-in, borderless face */}
                <img
                  src={CHARACTER_HEADS[p.characterClass]}
                  alt={p.characterClass}
                  className={`relative z-10 w-24 h-24 max-w-none object-contain object-bottom drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transition-transform duration-300 ${
                    isActive ? 'scale-[1.3] drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]' 
                    : isTarget ? 'scale-[1.2] drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]' 
                    : 'scale-[1.15]'
                  }`}
                />

                {/* Position badge (Anchored to bottom left) */}
                <div className="absolute -bottom-1 -left-1 z-20 w-6 h-6 bg-cyan-600 border border-slate-800 font-black text-[9px] text-white flex items-center justify-center -rotate-45 shadow-xl">
                  <span className="rotate-45">{p.position}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 pt-2">
                <div className="text-[9px] font-black text-white tracking-widest uppercase">{p.username}</div>
                <div className={`relative w-56 h-6 bg-slate-900 border-l-4 ${isActive ? 'border-cyan-400/80' : 'border-red-600/80'} skew-x-[15deg] overflow-hidden`}>
                  <div
                    className={`h-full transition-all duration-700 ${isActive ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-orange-400 to-red-600'}`}
                    style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[-15deg] font-black text-white text-[10px] tracking-widest">
                    {p.currentHp}/{p.maxHp}
                  </div>
                </div>
                <div className="relative w-48 h-4 bg-slate-900 border-l-4 border-lime-600/80 skew-x-[15deg] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lime-400 to-lime-600 transition-all duration-700"
                    style={{ width: `${(p.currentMana / p.maxMana) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[-15deg] font-black text-white text-[8px] tracking-widest">
                    {p.currentMana}/{p.maxMana}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ CENTER: Battle Arena ═══ */}
      <div className="flex-1 relative flex flex-col items-center justify-end overflow-hidden pb-4">
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[900px] h-40 bg-gradient-to-t from-slate-700/10 to-transparent blur-3xl opacity-50" />

        {/* wider gap via gap-32, wider max-w so sprites have room */}
        <div className="flex items-end justify-center w-full max-w-6xl px-16 relative gap-32">

          {/* ── Blue Team Representative (Left) ── */}
          {(() => {
            const target  = players.find(p => p.id === selectedTargets[0]);
            const blueRep =
              myPlayer?.team === 'blue'        ? myPlayer
              : target?.team === 'blue'        ? target
              : teamBlue.find(p => p.currentHp > 0) || teamBlue[0];
            if (!blueRep) return null;
            const isActive  = myPlayer?.id === blueRep.id;
            const isTarget  = selectedTargets.includes(blueRep.id);
            const isHit     = shakingId === blueRep.id;
            const isHealed  = healEffect === blueRep.id;
            const curHitFx  = hitEffect?.id === blueRep.id ? hitEffect.type : null;
            return (
              <div className={`relative transition-all duration-500 ${
                isHit ? 'animate-[shake_0.4s_ease-in-out]' : ''
              } ${
                isActive  ? 'scale-110'
                : isTarget ? 'scale-100'
                : 'opacity-70 scale-90 grayscale-[0.2]'
              }`}>
                {/* Ground glow */}
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 h-16 ${
                  isActive  ? 'bg-lime-400/20 shadow-[0_0_50px_rgba(163,230,53,0.35)] animate-pulse'
                  : isTarget ? 'bg-red-600/10'
                  : 'bg-slate-700/10'
                } blur-xl rounded-full`} />

                {/* ── Status auras ── */}
                {blueRep.isBound && (
                  <div className="absolute inset-x-4 inset-y-4 rounded-full border-4 border-dashed border-yellow-400/80 animate-[spin_3s_linear_infinite] shadow-[0_0_20px_rgba(250,204,21,0.5)] pointer-events-none" />
                )}
                {blueRep.isWeakened && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-purple-400 text-[10px] font-black tracking-widest animate-bounce whitespace-nowrap pointer-events-none">
                    ▼ WEAKENED
                  </div>
                )}
                {blueRep.isInvisible && (
                  <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/40 bg-cyan-400/5 animate-pulse pointer-events-none" />
                )}

                {/* ── Sprite — hit flash / heal tint applied via filter classes ── */}
                <img
                  src={CHARACTERS[blueRep.characterClass].image}
                  className={`h-80 w-auto object-contain transition-all duration-150 ${
                    isHit     ? 'brightness-[3] saturate-[8] hue-rotate-[-40deg]'
                    : isHealed ? 'brightness-[1.6] saturate-[3] hue-rotate-[80deg]'
                    : isActive  ? 'drop-shadow-[0_0_25px_rgba(163,230,53,0.6)]'
                    : isTarget  ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] grayscale-[0.5] contrast-[1.1] opacity-90'
                    : ''
                  } ${blueRep.isInvisible ? 'opacity-40' : ''}`}
                  alt=""
                />

                {/* ── Hit type overlays ── */}
                {curHitFx === 'slash' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.35s_ease-out]">
                    <Swords className="w-28 h-28 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.9)]" />
                  </div>
                )}
                {curHitFx === 'magic' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <Zap className="w-32 h-32 text-violet-400 drop-shadow-[0_0_30px_rgba(167,139,250,0.9)]" />
                  </div>
                )}
                {curHitFx === 'bind' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <div className="w-28 h-28 rounded-full border-8 border-dashed border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
                  </div>
                )}
                {curHitFx === 'drain' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <div className="w-28 h-28 rounded-full bg-emerald-400/20 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                  </div>
                )}

                {/* ── Heal pulse ring ── */}
                {isHealed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-4 border-green-400 animate-[ping_0.7s_ease-out] shadow-[0_0_40px_rgba(74,222,128,0.7)]" />
                  </div>
                )}

                {/* ── Floating damage / heal numbers ── */}
                {floatingTexts.filter(f => f.targetId === blueRep.id).map(f => (
                  <div
                    key={f.uid}
                    className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl font-black pointer-events-none animate-[floatUp_1.1s_ease-out_forwards] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] z-50"
                    style={{ color: f.color }}
                  >
                    {f.text}
                  </div>
                ))}

                {isActive ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg] shadow-[0_0_15px_rgba(163,230,53,0.5)] whitespace-nowrap">
                    PLAYER TURN
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[-15deg] whitespace-nowrap">
                    TARGET
                  </div>
                ) : null}
              </div>
            );
          })()}

          {/* ── Red Team Representative (Right) — flipped to face left ── */}
          {(() => {
            const target  = players.find(p => p.id === selectedTargets[0]);
            const redRep  =
              myPlayer?.team === 'red'        ? myPlayer
              : target?.team === 'red'        ? target
              : teamRed.find(p => p.currentHp > 0) || teamRed[0];
            if (!redRep) return null;
            const isActive  = myPlayer?.id === redRep.id;
            const isTarget  = selectedTargets.includes(redRep.id);
            const isHit     = shakingId === redRep.id;
            const isHealed  = healEffect === redRep.id;
            const curHitFx  = hitEffect?.id === redRep.id ? hitEffect.type : null;
            return (
              <div className={`relative transition-all duration-500 ${
                isHit ? 'animate-[shake_0.4s_ease-in-out]' : ''
              } ${
                isActive  ? 'scale-110'
                : isTarget ? 'scale-100'
                : 'opacity-70 scale-90 grayscale-[0.2]'
              }`}>
                {/* Ground glow */}
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 h-16 ${
                  isActive  ? 'bg-red-600/25 shadow-[0_0_50px_rgba(239,68,68,0.35)] animate-pulse'
                  : isTarget ? 'bg-red-600/10'
                  : 'bg-slate-700/10'
                } blur-xl rounded-full`} />

                {/* ── Status auras ── */}
                {redRep.isBound && (
                  <div className="absolute inset-x-4 inset-y-4 rounded-full border-4 border-dashed border-yellow-400/80 animate-[spin_3s_linear_infinite] shadow-[0_0_20px_rgba(250,204,21,0.5)] pointer-events-none" />
                )}
                {redRep.isWeakened && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-purple-400 text-[10px] font-black tracking-widest animate-bounce whitespace-nowrap pointer-events-none">
                    ▼ WEAKENED
                  </div>
                )}
                {redRep.isInvisible && (
                  <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/40 bg-cyan-400/5 animate-pulse pointer-events-none" />
                )}

                {/* ── Sprite — scaleX(-1) flips red side + hit flash / heal tint ── */}
                <img
                  src={CHARACTERS[redRep.characterClass].image}
                  className={`h-80 w-auto object-contain transition-all duration-150 ${
                    isHit     ? 'brightness-[3] saturate-[8] hue-rotate-[-40deg]'
                    : isHealed ? 'brightness-[1.6] saturate-[3] hue-rotate-[80deg]'
                    : isActive  ? 'drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                    : isTarget  ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] grayscale-[0.5] contrast-[1.1] opacity-90'
                    : ''
                  } ${redRep.isInvisible ? 'opacity-40' : ''}`}
                  style={{ transform: 'scaleX(-1)' }}
                  alt=""
                />

                {/* ── Hit type overlays ── */}
                {curHitFx === 'slash' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.35s_ease-out]">
                    <Swords className="w-28 h-28 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.9)]" />
                  </div>
                )}
                {curHitFx === 'magic' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <Zap className="w-32 h-32 text-violet-400 drop-shadow-[0_0_30px_rgba(167,139,250,0.9)]" />
                  </div>
                )}
                {curHitFx === 'bind' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <div className="w-28 h-28 rounded-full border-8 border-dashed border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
                  </div>
                )}
                {curHitFx === 'drain' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[ping_0.4s_ease-out]">
                    <div className="w-28 h-28 rounded-full bg-emerald-400/20 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                  </div>
                )}

                {/* ── Heal pulse ring ── */}
                {isHealed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-4 border-green-400 animate-[ping_0.7s_ease-out] shadow-[0_0_40px_rgba(74,222,128,0.7)]" />
                  </div>
                )}

                {/* ── Floating damage / heal numbers ── */}
                {floatingTexts.filter(f => f.targetId === redRep.id).map(f => (
                  <div
                    key={f.uid}
                    className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl font-black pointer-events-none animate-[floatUp_1.1s_ease-out_forwards] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] z-50"
                    style={{ color: f.color }}
                  >
                    {f.text}
                  </div>
                ))}

                {isActive ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg] whitespace-nowrap">
                    PLAYER TURN
                  </div>
                ) : isTarget ? (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black tracking-widest px-3 py-1 skew-x-[15deg] whitespace-nowrap">
                    TARGET
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══ CINEMATIC ACTION OVERLAY ═══ */}
      {cinematicAction && (
        <div className="absolute inset-0 z-50 flex items-center overflow-hidden pointer-events-none drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className={`absolute w-[120%] h-64 flex items-center px-32 relative
            ${cinematicAction.isLeft
              ? 'bg-red-600 animate-[cinematicLeft_1.5s_ease-out_forwards] -left-[10%] border-y-8 border-red-500'
              : 'bg-red-600 animate-[cinematicRight_1.5s_ease-out_forwards] -right-[10%] border-y-8 border-red-500'}
            ${cinematicAction.ability.type === 'defense' ? '!bg-cyan-600 !border-cyan-400' : ''}
          `}>
            <img
              src={CHARACTERS[cinematicAction.player.characterClass].image}
              className={`h-[400px] w-auto object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.6)] absolute -bottom-10
                ${cinematicAction.isLeft ? 'left-48' : 'right-48 scale-x-[-1]'}
              `}
              alt=""
            />
            <div className={`absolute flex flex-col z-10 w-1/2
              ${cinematicAction.isLeft ? 'left-[450px] text-left' : 'right-[450px] text-right'}
            `}>
              <span className="text-4xl font-black text-yellow-400 tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic uppercase">
                {cinematicAction.ability.type === 'attack' ? 'ATTACK' : 'DEFENSE'}
              </span>
              <span
                className={`text-7xl font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] italic uppercase transform
                   ${cinematicAction.isLeft ? '-skew-x-[10deg]' : 'skew-x-[10deg]'}
                `}
                style={{ WebkitTextStroke: `3px ${cinematicAction.ability.type === 'attack' ? '#991b1b' : '#0891b2'}` }}
              >
                {cinematicAction.ability.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ABILITY MENU OVERLAY ═══ */}
      {selectedTab && !cinematicAction && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="w-full max-w-xl flex flex-col items-center gap-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3.5 h-3.5 rounded-full ${selectedTab === 'attack' ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_15px_currentColor]`} />
              <h2 className="text-xl font-black text-white tracking-[0.4em] uppercase">{selectedTab} ABILITIES</h2>
              <div className={`w-3.5 h-3.5 rounded-full ${selectedTab === 'attack' ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_15px_currentColor]`} />
            </div>
            <div className="w-full space-y-4">
              {(selectedTab === 'attack' ? attackAbilities : defenseAbilities).map((ability) => {
                const canAfford  = myPlayer ? myPlayer.currentMana >= ability.manaCost : false;
                const needsTarget = ability.type === 'attack' && ability.target === 'single';
                const isReady    = canAfford && (!needsTarget || selectedTargets.length === 1);
                return (
                  <button
                    key={ability.id}
                    onClick={() => handleAbilityClick(ability)}
                    disabled={!isReady}
                    className={`relative w-full group transition-all duration-300 ${isReady ? 'hover:scale-[1.02]' : 'opacity-40 cursor-not-allowed grayscale'}`}
                  >
                    <div className={`h-20 w-full relative skew-x-[-8deg] border-y-2 border-r-8 transition-colors duration-300
                      ${selectedTab === 'attack'
                        ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.2)]'
                        : 'bg-cyan-600 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]'}`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
                      <div className="absolute inset-0 flex items-center px-8 skew-x-[8deg] gap-6">
                        <div className={`w-12 h-12 flex items-center justify-center bg-black/30 border-2 ${selectedTab === 'attack' ? 'border-red-400' : 'border-cyan-400'}`}>
                          {selectedTab === 'attack' ? <Swords className="w-7 h-7 text-white" /> : <Shield className="w-7 h-7 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-lg font-black text-white tracking-widest uppercase mb-0.5">{ability.name}</div>
                          <div className="text-[10px] text-white/70 font-bold uppercase tracking-tight italic line-clamp-1">{ability.description}</div>
                        </div>
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/40 rotate-[30deg] border border-white/20" />
                          <div className="relative flex flex-col items-center">
                            <span className="text-lg font-black text-white font-mono leading-none">{ability.manaCost}</span>
                            <span className="text-[8px] font-black text-white/60 tracking-widest leading-none">MP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setSelectedTab(null)}
              className="mt-8 px-12 py-3 bg-slate-800 border border-slate-600 text-slate-400 font-black text-xs tracking-[0.5em] uppercase hover:bg-slate-700 hover:text-white transition-all"
            >
              CANCEL [ESC]
            </button>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM ACTION PANEL ═══ */}
      <div className="shrink-0 bg-black/80 backdrop-blur-xl border-t border-slate-800/80 z-40">
        <div className="flex items-center justify-center p-6 gap-8 bg-slate-900/40 relative">

          {/* Left icon */}
          <div className="absolute left-10 flex items-center gap-2">
            <div
              className="w-16 h-16 bg-white/5 border-4 border-slate-600 rounded-lg flex items-center justify-center relative shadow-2xl"
              style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)' }}
            >
              <div
                className="w-10 h-10 bg-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <Swords className="w-6 h-6 text-slate-900" />
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedTab(selectedTab === 'attack' ? null : 'attack')}
            className={`relative flex items-center justify-center gap-3 px-10 py-5 rounded-md transition-all duration-300 border-b-4 border-r-4 group
              ${selectedTab === 'attack'
                ? 'bg-red-500 border-red-700 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-[0.98]'
                : 'bg-[#e53935] border-[#b71c1c] text-white hover:bg-red-500 hover:border-[#c62828]'}`}
            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
          >
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest uppercase pe-4">ATTACK</span>
          </button>

          <button
            onClick={() => setSelectedTab(selectedTab === 'defense' ? null : 'defense')}
            className={`relative flex items-center justify-center gap-3 px-10 py-5 rounded-md transition-all duration-300 border-b-4 border-r-4 group
              ${selectedTab === 'defense'
                ? 'bg-cyan-400 border-cyan-600 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] scale-[0.98]'
                : 'bg-[#00acc1] border-[#006064] text-white hover:bg-[#00bcd4] hover:border-[#00838f]'}`}
            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
          >
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest uppercase pe-4">DEFENSE</span>
          </button>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes cinematicLeft {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          15%  { transform: translateX(0)     skewX(-15deg); opacity: 1; }
          85%  { transform: translateX(5%)    skewX(-15deg); opacity: 1; }
          100% { transform: translateX(100%)  skewX(-15deg); opacity: 0; }
        }
        @keyframes cinematicRight {
          0%   { transform: translateX(100%)  skewX(15deg); opacity: 0; }
          15%  { transform: translateX(0)     skewX(15deg); opacity: 1; }
          85%  { transform: translateX(-5%)   skewX(15deg); opacity: 1; }
          100% { transform: translateX(-100%) skewX(15deg); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1.4); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-40px) scale(1.1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-70px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}