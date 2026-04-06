import { useEffect, useState, useRef } from 'react';
import { LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

export function LoginScreen() {
  const [mounted, setMounted] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [tick, setTick] = useState(0);
  const glitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { signIn } = useAuth();
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setMounted(true);

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
      {/* Background Layers */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #0a2a18 0%, #03060c 55%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
      <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(0,255,100,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.04) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      
      {/* Animated scanning line based on tick */}
      <div className="absolute left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.15) 50%, transparent)', top: `${((tick * 0.3) % 100)}%`, transition: 'none' }} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-6">
        {/* Title */}
        <div className={`relative text-center mb-12 w-full transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '200ms' }}>
          {/* Title Layers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1, letterSpacing: '-0.02em', color: 'transparent', WebkitTextStroke: '1px rgba(163,230,53,0.08)', filter: 'blur(20px)' }}>DUNGEONS</div>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1, letterSpacing: '-0.02em', color: 'transparent', WebkitTextStroke: '1px rgba(163,230,53,0.08)', filter: 'blur(20px)' }}>& DRAGONS</div>
          </div>

          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ transform: `translateX(${glitchX}px)`, transition: glitching ? 'none' : 'transform 0.15s' }}>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'rgba(0,255,220,0.25)' }}>DUNGEONS</div>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'rgba(0,255,220,0.25)' }}>& DRAGONS</div>
          </div>

          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ transform: `translateX(${glitchX2}px)`, transition: glitching ? 'none' : 'transform 0.15s' }}>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'rgba(255,50,80,0.18)' }}>DUNGEONS</div>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'rgba(255,50,80,0.18)' }}>& DRAGONS</div>
          </div>

          <div style={{
            fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#d9f99d',
            textShadow: glitching ? '0 0 20px rgba(163,230,53,0.9), 0 0 60px rgba(163,230,53,0.5), 4px 0 rgba(0,255,220,0.6), -4px 0 rgba(255,50,80,0.6)' : '0 0 40px rgba(163,230,53,0.4), 0 0 80px rgba(163,230,53,0.15), 0 4px 30px rgba(0,0,0,0.8)',
            position: 'relative', zIndex: 2,
          }}>
            DUNGEONS
          </div>
          <div style={{
            fontSize: 'clamp(3rem, 10vw, 6.5rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#d9f99d',
            textShadow: glitching ? '0 0 20px rgba(163,230,53,0.9), 0 0 60px rgba(163,230,53,0.5), -4px 0 rgba(0,255,220,0.6), 4px 0 rgba(255,50,80,0.6)' : '0 0 40px rgba(163,230,53,0.4), 0 0 80px rgba(163,230,53,0.15), 0 4px 30px rgba(0,0,0,0.8)',
            position: 'relative', zIndex: 2,
          }}>
            & DRAGONS
          </div>
          <div className="relative z-10 mx-auto mt-1" style={{ height: '2px', width: '60%', background: 'linear-gradient(to right, transparent, rgba(163,230,53,0.8) 20%, rgba(163,230,53,1) 50%, rgba(163,230,53,0.8) 80%, transparent)', boxShadow: '0 0 20px rgba(163,230,53,0.6)' }} />
        </div>

        {/* Login Box */}
        <div className={`flex flex-col items-center gap-6 p-8 border border-slate-800 bg-slate-900/60 rounded-sm backdrop-blur-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '550ms', maxWidth: '400px', width: '100%', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
          <div className="flex flex-col items-center gap-2 mb-2">
            <LogIn className="w-8 h-8 text-lime-400 mb-2" />
            <h2 className="text-xl text-white font-black tracking-widest uppercase">Agent Access</h2>
            <p className="text-slate-400 text-xs tracking-wider text-center">AUTHENTICATE WITH PROTOCOL TO ENTER THE SYSTEM</p>
          </div>

          <div className="w-full flex justify-center py-4 rounded-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(163,230,53,0.2)' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await signIn(credentialResponse.credential);
                  } catch (e: any) {
                    setLoginError(e.message || 'Failed to sign in. System rejected access.');
                  }
                }
              }}
              onError={() => {
                setLoginError('Google communication protocol failed.');
              }}
              theme="filled_black"
              shape="rectangular"
              text="signin_with"
              use_fedcm_for_prompt={true}
              // width="100%"
            />
          </div>

          {loginError && (
            <div className="w-full p-3 bg-red-900/20 border border-red-500/30 rounded-sm text-center">
              <span className="text-red-400 text-xs tracking-wider font-bold">{loginError}</span>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Status Bar */}
      <div className={`absolute bottom-0 left-0 right-0 border-t border-slate-800/60 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 py-2.5 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.8)' }} />
            <span className="text-red-500 font-black tracking-widest" style={{ fontSize: '10px' }}>AWAITING AUTHENTICATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
