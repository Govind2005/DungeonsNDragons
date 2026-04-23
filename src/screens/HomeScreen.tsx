import { useEffect, useState, useRef } from 'react';
import { Swords, Trophy, ChevronRight, ShieldCheck, Crosshair, Wand2, LogOut } from 'lucide-react';

interface HomeScreenProps {
  onStartQuest: () => void;
  onLeaderboards: () => void;
  onLogout: () => void;
}

export function HomeScreen({ onStartQuest, onLeaderboards, onLogout }: HomeScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [hoverQuest, setHoverQuest] = useState(false);
  const [hoverLead, setHoverLead] = useState(false);
  const [tick, setTick] = useState(0);
  const glitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);

    // Glitch effect
    const scheduleGlitch = () => {
      glitchRef.current = setTimeout(() => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 80);
        setTimeout(() => {
          setGlitching(true);
          setTimeout(() => setGlitching(false), 60);
        }, 150);
        scheduleGlitch();
      }, 2500 + Math.random() * 4000);
    };
    scheduleGlitch();

    // Tick for animated elements
    const tickInterval = setInterval(() => setTick(t => t + 1), 50);

    return () => {
      if (glitchRef.current) clearTimeout(glitchRef.current);
      clearInterval(tickInterval);
    };
  }, []);

  const glitchX = glitching ? (Math.random() - 0.5) * 8 : 0;
  const glitchX2 = glitching ? (Math.random() - 0.5) * 6 : 0;

  return (
    <div className="min-h-screen bg-[#03060c] relative overflow-hidden select-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* â”€â”€ LAYER 1: Deep space background â”€â”€ */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #0a2a18 0%, #03060c 55%)',
      }} />

      {/* â”€â”€ LAYER 2: Dramatic vignette â”€â”€ */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* â”€â”€ LAYER 3: Fine grid â”€â”€ */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,255,100,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.04) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* â”€â”€ LAYER 4: Subtle diagonal lines â”€â”€ */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,1) 60px, rgba(255,255,255,1) 61px)',
      }} />

      {/* â”€â”€ LAYER 5: Massive center glow â”€â”€ */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(80,200,80,0.06) 0%, transparent 70%)',
      }} />

      {/* â”€â”€ LAYER 6: Left edge cyan accent â”€â”€ */}
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{
        background: 'linear-gradient(to bottom, transparent, rgba(0,255,180,0.4) 30%, rgba(0,255,180,0.4) 70%, transparent)',
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-px" style={{
        background: 'linear-gradient(to bottom, transparent, rgba(0,255,180,0.2) 30%, rgba(0,255,180,0.2) 70%, transparent)',
      }} />

      {/* â”€â”€ TOP ACCENT LINE â”€â”€ */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.8) 20%, rgba(163,230,53,1) 50%, rgba(163,230,53,0.8) 80%, transparent)',
      }} />
      <div className="absolute top-0 left-0 right-0 h-32" style={{
        background: 'linear-gradient(to bottom, rgba(163,230,53,0.05), transparent)',
      }} />

      {/* â”€â”€ BOTTOM ACCENT â”€â”€ */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.3) 50%, transparent)',
      }} />

      {/* â”€â”€ ANIMATED SCANNING LINE â”€â”€ */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.15) 50%, transparent)',
          top: `${((tick * 0.3) % 100)}%`,
          transition: 'none',
        }}
      />

      {/* â”€â”€ CORNER BRACKETS â”€â”€ */}
      {[
        'top-5 left-5 border-t-2 border-l-2',
        'top-5 right-5 border-t-2 border-r-2',
        'bottom-5 left-5 border-b-2 border-l-2',
        'bottom-5 right-5 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-10 h-10 border-lime-400/30 ${cls}`} />
      ))}

      {/* â”€â”€ FLOATING RUNE DOTS â”€â”€ */}
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (i * 37.7) % 100;
        const y = (i * 23.1) % 100;
        const size = 1 + (i % 3);
        const phase = (tick * 0.02 + i * 0.7) % (Math.PI * 2);
        const opacity = 0.08 + Math.sin(phase) * 0.06;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-lime-400 pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, opacity }}
          />
        );
      })}

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-6">

        {/* â”€â”€ MEGA TITLE â”€â”€ */}
        <div
          className={`relative text-center mb-2 w-full transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Background title blur glow */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(163,230,53,0.08)',
              filter: 'blur(20px)',
              userSelect: 'none',
            }}>DUNGEONS</div>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(163,230,53,0.08)',
              filter: 'blur(20px)',
              userSelect: 'none',
            }}>{`& DRAGONS`}</div>
          </div>

          {/* Glitch layer 1 - cyan */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
            transform: `translateX(${glitchX}px)`,
            transition: glitching ? 'none' : 'transform 0.15s',
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'rgba(0,255,220,0.25)',
              userSelect: 'none',
            }}>DUNGEONS</div>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'rgba(0,255,220,0.25)',
              userSelect: 'none',
            }}>{`& DRAGONS`}</div>
          </div>

          {/* Glitch layer 2 - red */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
            transform: `translateX(${glitchX2}px)`,
            transition: glitching ? 'none' : 'transform 0.15s',
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'rgba(255,50,80,0.18)',
              userSelect: 'none',
            }}>DUNGEONS</div>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'rgba(255,50,80,0.18)',
              userSelect: 'none',
            }}>{`& DRAGONS`}</div>
          </div>

          {/* Main title */}
          <div style={{
            fontSize: 'clamp(3rem, 10vw, 6.5rem)',
            fontWeight: 900,
            fontStyle: 'italic',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#d9f99d',
            textShadow: glitching
              ? '0 0 20px rgba(163,230,53,0.9), 0 0 60px rgba(163,230,53,0.5), 4px 0 rgba(0,255,220,0.6), -4px 0 rgba(255,50,80,0.6)'
              : '0 0 40px rgba(163,230,53,0.4), 0 0 80px rgba(163,230,53,0.15), 0 4px 30px rgba(0,0,0,0.8)',
            position: 'relative',
            zIndex: 2,
          }}>
            DUNGEONS
          </div>
          <div style={{
            fontSize: 'clamp(3rem, 10vw, 6.5rem)',
            fontWeight: 900,
            fontStyle: 'italic',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#d9f99d',
            textShadow: glitching
              ? '0 0 20px rgba(163,230,53,0.9), 0 0 60px rgba(163,230,53,0.5), -4px 0 rgba(0,255,220,0.6), 4px 0 rgba(255,50,80,0.6)'
              : '0 0 40px rgba(163,230,53,0.4), 0 0 80px rgba(163,230,53,0.15), 0 4px 30px rgba(0,0,0,0.8)',
            position: 'relative',
            zIndex: 2,
          }}>
            {`& DRAGONS`}
          </div>

          {/* Underline streak */}
          <div className="relative z-10 mx-auto mt-1" style={{
            height: '2px',
            width: '60%',
            background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.8) 20%, rgba(163,230,53,1) 50%, rgba(163,230,53,0.8) 80%, transparent)',
            boxShadow: '0 0 20px rgba(163,230,53,0.6)',
          }} />
        </div>

        {/* â”€â”€ CLASS ROSTER STRIP â”€â”€ */}
        <div
          className={`flex items-center gap-3 mt-4 mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '400ms' }}
        >
          {[
            { Icon: Swords, name: 'BARBARIAN', color: '#fb923c', glow: 'rgba(251,146,60,0.4)' },
            { Icon: ShieldCheck, name: 'KNIGHT', color: '#60a5fa', glow: 'rgba(96,165,250,0.4)' },
            { Icon: Crosshair, name: 'RANGER', color: '#4ade80', glow: 'rgba(74,222,128,0.4)' },
            { Icon: Wand2, name: 'WIZARD', color: '#c084fc', glow: 'rgba(192,132,252,0.4)' },
          ].map(({ Icon, name, color, glow }, i) => (
            <div
              key={i}
              className="group relative flex flex-col items-center gap-1.5 px-4 py-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-all duration-300 hover:scale-105 cursor-default rounded-sm"
              style={{
                transitionDelay: `${400 + i * 60}ms`,
                boxShadow: `0 0 0 0 ${glow}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 20px ${glow}`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${glow}`)}
            >
              <Icon className="w-5 h-5 transition-colors duration-300" style={{ color }} />
              <span className="font-black tracking-widest transition-colors duration-300" style={{ fontSize: '9px', color }}>{name}</span>
            </div>
          ))}
        </div>

        {/* â”€â”€ BUTTONS â”€â”€ */}
        <div
          className={`flex flex-col gap-4 w-full transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ maxWidth: '480px', transitionDelay: '550ms' }}
        >
          {/* START QUEST */}
          <button
            onClick={onStartQuest}
            onMouseEnter={() => setHoverQuest(true)}
            onMouseLeave={() => setHoverQuest(false)}
            className="group relative overflow-hidden transition-all duration-300"
            style={{ transform: hoverQuest ? 'scale(1.02) translateY(-2px)' : 'scale(1)', }}
          >
            {/* Shadow offset */}
            <div className="absolute inset-0 rounded-sm bg-black" style={{ transform: 'translate(4px, 4px)' }} />
            {/* Animated background */}
            <div
              className="absolute inset-0 rounded-sm transition-all duration-500"
              style={{
                background: hoverQuest
                  ? 'linear-gradient(135deg, #a3e635, #84cc16)'
                  : 'linear-gradient(135deg, #84cc16, #65a30d)',
              }}
            />
            {/* Shine sweep */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                transform: hoverQuest ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.6s ease',
              }}
            />
            {/* Top highlight */}
            <div className="absolute top-0 left-4 right-4 h-px bg-white/30 rounded-full" />
            {/* Content */}
            <div className="relative flex items-center justify-center gap-4 px-8 py-3.5 border-2 border-black rounded-sm">
              <div className="w-9 h-9 bg-black/20 border border-black/30 rounded-sm flex items-center justify-center">
                <Swords className="w-5 h-5 text-black" />
              </div>
              <span className="text-black font-black tracking-widest" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)' }}>
                START QUEST
              </span>
              <ChevronRight
                className="w-5 h-5 text-black/70 transition-transform duration-300"
                style={{ transform: hoverQuest ? 'translateX(4px)' : 'none' }}
              />
            </div>
          </button>

          {/* LEADERBOARDS */}
          <button
            onClick={onLeaderboards}
            onMouseEnter={() => setHoverLead(true)}
            onMouseLeave={() => setHoverLead(false)}
            className="group relative overflow-hidden transition-all duration-300"
            style={{ transform: hoverLead ? 'scale(1.02) translateY(-2px)' : 'scale(1)' }}
          >
            <div className="absolute inset-0 rounded-sm bg-black" style={{ transform: 'translate(4px, 4px)' }} />
            <div
              className="absolute inset-0 rounded-sm transition-all duration-500"
              style={{
                background: hoverLead
                  ? 'linear-gradient(135deg, #22d3ee, #06b6d4)'
                  : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              }}
            />
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                transform: hoverLead ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.6s ease',
              }}
            />
            <div className="absolute top-0 left-4 right-4 h-px bg-white/30 rounded-full" />
            <div className="relative flex items-center justify-center gap-4 px-8 py-3.5 border-2 border-black rounded-sm">
              <div className="w-9 h-9 bg-black/20 border border-black/30 rounded-sm flex items-center justify-center">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <span className="text-black font-black tracking-widest" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)' }}>
                LEADERBOARDS
              </span>
              <ChevronRight
                className="w-5 h-5 text-black/70 transition-transform duration-300"
                style={{ transform: hoverLead ? 'translateX(4px)' : 'none' }}
              />
            </div>
          </button>
        </div>

        {/* â”€â”€ STATS ROW â”€â”€ */}
        <div
          className={`flex items-center gap-0 mt-6 border border-slate-800 rounded-sm overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '700ms' }}
        >
          {[
            { value: '4', label: 'PLAYERS' },
            { value: '2v2', label: 'FORMAT' },
            { value: '4', label: 'CLASSES' },
            { value: 'S01', label: 'SEASON' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center px-6 py-2 bg-slate-900/40 hover:bg-slate-900/80 transition-colors">
                <span className="text-lime-400 font-black text-base tracking-wider">{stat.value}</span>
                <span className="text-slate-600 tracking-widest mt-0.5" style={{ fontSize: '8px' }}>{stat.label}</span>
              </div>
              {i < 3 && <div className="w-px h-8 bg-slate-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 border-t border-slate-800/60 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 py-2.5 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: '900ms' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
            <span className="text-lime-400 font-black tracking-widest" style={{ fontSize: '10px' }}>SYSTEM ACTIVE</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-lime-400 rounded-sm" />
            <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
          </div>
        </div>
        <div className="flex items-center gap-6" style={{ fontSize: '10px' }}>
          <span className="text-slate-700 tracking-widest">v1.0.0</span>
          <span className="text-slate-700 tracking-widest">DISTRIBUTED SYSTEMS PROJECT</span>
          <span className="text-slate-700 tracking-widest">5-COMPONENT ARCHITECTURE</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm transition-all tracking-widest ml-4 font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}