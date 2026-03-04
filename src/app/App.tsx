import { useState, useCallback, useRef, useEffect } from 'react';
import svgPaths from '../imports/svg-13vh8bgwwi';
import {
  INSTRUMENTS,
  INSTRUMENT_LABELS,
  type InstrumentName,
  playInstrument,
  getAudioCtx,
} from './components/audio-engine';
import { useAuth } from './components/use-auth';
import { AuthModal } from './components/auth-modal';
import { API_BASE } from './components/supabase-client';
import { publicAnonKey } from '/utils/supabase/info';
import { Pencil, Camera, User, Menu, X, Save, FolderOpen, Plus } from 'lucide-react';

const STEPS = 16;

type Grid = Record<InstrumentName, boolean[]>;

function createEmptyGrid(): Grid {
  const grid: Partial<Grid> = {};
  for (const inst of INSTRUMENTS) {
    grid[inst] = new Array(STEPS).fill(false);
  }
  return grid as Grid;
}

// ─── Navbar ───
function Navbar({
  user,
  avatarUrl,
  avatarUploading,
  onSignOut,
  onOpenAuth,
  onAvatarUpload,
}: {
  user: any;
  avatarUrl: string | null;
  avatarUploading: boolean;
  onSignOut: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onAvatarUpload: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarUpload(file);
      e.target.value = '';
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="bg-[#18181b] relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-between md:justify-end overflow-clip size-full">
        <div className="content-stretch flex items-center justify-between md:justify-end px-4 sm:px-6 md:px-10 lg:px-[40px] py-3 sm:py-4 md:py-[24px] relative w-full">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex items-center justify-center size-10 rounded-lg shrink-0 cursor-pointer hover:bg-[#27272a] transition-colors touch-manipulation -ml-2"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-[#f1f5f9]" />
          </button>

          {/* Desktop auth - hidden on mobile */}
          <div className="hidden md:flex content-stretch gap-[12px] items-center justify-end relative shrink-0">
            {user ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="relative size-[40px] rounded-full shrink-0 cursor-pointer group"
                  title={avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="size-full rounded-full object-cover border-2 border-[#3f3f47] group-hover:border-[#8200db] transition-colors" />
                  ) : (
                    <div className="size-full rounded-full bg-[#27272a] border-2 border-[#3f3f47] group-hover:border-[#8200db] flex items-center justify-center">
                      <User size={18} className="text-[#9f9fa9]" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {avatarUploading ? <div className="size-[14px] border-2 border-white/80 border-t-transparent rounded-full animate-spin" /> : avatarUrl ? <Pencil size={14} className="text-white/90" /> : <Camera size={14} className="text-white/90" />}
                  </div>
                </button>
                <p className="font-['Inter',sans-serif] font-medium text-[14px] text-[#9f9fa9] truncate max-w-[120px] lg:max-w-none">{user.user_metadata?.name || user.email}</p>
                <button onClick={onSignOut} className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80">
                  <p className="font-['Geist',sans-serif] font-medium text-[16px] text-[#f1f5f9]">Sign Out</p>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onOpenAuth('signup')} className="bg-[#8200db] flex gap-[4px] items-center justify-center p-[8px] rounded-[8px] shrink-0 cursor-pointer hover:bg-[#9a20ef] transition-colors">
                  <p className="font-['Geist',sans-serif] font-medium text-[16px] text-[#f8fafc]">Sign Up</p>
                </button>
                <button onClick={() => onOpenAuth('login')} className="flex gap-[8px] items-center justify-center p-[8px] shrink-0 cursor-pointer hover:opacity-80">
                  <p className="font-['Geist',sans-serif] font-medium text-[16px] text-[#f1f5f9]">Log In</p>
                </button>
              </>
            )}
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#8200db] flex items-center justify-center left-1/2 px-3 sm:px-[16px] py-1 sm:py-[4px] top-[calc(50%+1px)] pointer-events-none">
            <p className="font-['Inter',sans-serif] font-black italic text-[#f8fafc] text-xl sm:text-2xl md:text-[36px]">Super Beats</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#3f3f47] border-b border-solid inset-0 pointer-events-none" />

      {/* Hamburger menu overlay - mobile only */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />
          <div className="absolute top-0 right-0 w-[280px] max-w-[85vw] h-full bg-[#18181b] border-l border-[#3f3f47] shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#3f3f47]">
              <p className="font-['Inter',sans-serif] font-semibold text-[18px] text-[#f1f5f9]">Menu</p>
              <button onClick={closeMenu} className="size-10 flex items-center justify-center rounded-lg hover:bg-[#27272a] transition-colors touch-manipulation">
                <X size={24} className="text-[#f1f5f9]" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              {user ? (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" />
                  <button onClick={() => { fileInputRef.current?.click(); }} disabled={avatarUploading} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#27272a] transition-colors w-full text-left">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="size-12 rounded-full object-cover border-2 border-[#3f3f47]" />
                    ) : (
                      <div className="size-12 rounded-full bg-[#27272a] border-2 border-[#3f3f47] flex items-center justify-center">
                        <User size={24} className="text-[#9f9fa9]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-['Inter',sans-serif] font-medium text-[#f1f5f9] truncate">{user.user_metadata?.name || user.email}</p>
                      <p className="font-['Inter',sans-serif] text-[13px] text-[#9f9fa9]">Tap to change photo</p>
                    </div>
                  </button>
                  <button onClick={() => { onSignOut(); closeMenu(); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#27272a] transition-colors w-full text-left font-['Geist',sans-serif] font-medium text-[#f1f5f9]">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { onOpenAuth('signup'); closeMenu(); }} className="flex items-center justify-center p-3 rounded-lg bg-[#8200db] hover:bg-[#9a20ef] transition-colors w-full font-['Geist',sans-serif] font-medium text-[#f8fafc]">
                    Sign Up
                  </button>
                  <button onClick={() => { onOpenAuth('login'); closeMenu(); }} className="flex items-center justify-center p-3 rounded-lg border border-[#3f3f47] hover:bg-[#27272a] transition-colors w-full font-['Geist',sans-serif] font-medium text-[#f1f5f9]">
                    Log In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grid Cell (mobile: flexible, fills grid cell) ───
function GridCellMobile({ active, isCurrentStep, onClick }: { active: boolean; isCurrentStep: boolean; onClick: () => void }) {
  let bg = active && isCurrentStep ? 'bg-[#ad46ff]' : active ? 'bg-[#8200db]' : isCurrentStep ? 'bg-[#52525b]' : 'bg-[#27272a]';
  return (
    <button onClick={onClick} className={`${bg} relative w-full h-full min-w-0 min-h-0 rounded-[4px] cursor-pointer transition-colors duration-75 hover:brightness-125 active:scale-95 touch-manipulation`}>
      <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[inherit] ${active ? 'border-[#ad46ff]' : 'border-[#4a5565]'}`} />
    </button>
  );
}

// ─── Grid Cell (desktop: fixed size) ───
function GridCellDesktop({ active, isCurrentStep, onClick }: { active: boolean; isCurrentStep: boolean; onClick: () => void }) {
  let bg = active && isCurrentStep ? 'bg-[#ad46ff]' : active ? 'bg-[#8200db]' : isCurrentStep ? 'bg-[#52525b]' : 'bg-[#27272a]';
  return (
    <button onClick={onClick} className={`${bg} relative shrink-0 size-[40px] rounded-[8px] cursor-pointer transition-colors duration-75 hover:brightness-125 active:scale-95`}>
      <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${active ? 'border-[#ad46ff]' : 'border-[#4a5565]'}`} />
    </button>
  );
}

// ─── Beat Grid ───
function BeatGrid({
  grid,
  currentStep,
  isPlaying,
  onToggle,
}: {
  grid: Grid;
  currentStep: number;
  isPlaying: boolean;
  onToggle: (instrument: InstrumentName, step: number) => void;
}) {
  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden md:overflow-visible">
      {/* Mobile: vertical layout - steps as rows (1-16), instruments as columns - fills available height */}
      <div
        className="md:hidden grid gap-[2px] w-full flex-1 min-h-0"
        style={{ gridTemplateColumns: 'minmax(0, 1.5rem) repeat(5, minmax(0, 1fr))', gridTemplateRows: 'repeat(16, minmax(0, 1fr))' }}
      >
        {/* Header row: empty | instrument labels */}
        <div className="flex items-center justify-center font-['Inter',sans-serif] font-medium text-[8px] text-[#3f3f47] overflow-hidden" />
        {INSTRUMENTS.map((inst) => (
          <div key={`h-${inst}`} className="flex items-center justify-center font-['Inter',sans-serif] font-medium text-[9px] text-[#9f9fa9] truncate overflow-hidden" title={INSTRUMENT_LABELS[inst]}>
            {INSTRUMENT_LABELS[inst]}
          </div>
        ))}
        {/* Data rows: step number | Kick | Snare | OH | CH | Clap for each step */}
        {Array.from({ length: STEPS }, (_, step) => [
          <div
            key={`s-${step}`}
            className={`flex items-center justify-center font-['Inter',sans-serif] font-medium text-[8px] min-w-0 ${isPlaying && currentStep === step ? 'text-[#ad46ff]' : 'text-[#3f3f47]'}`}
          >
            {step + 1}
          </div>,
          ...INSTRUMENTS.map((inst) => (
            <GridCellMobile
              key={`${inst}-${step}`}
              active={grid[inst][step]}
              isCurrentStep={isPlaying && currentStep === step}
              onClick={() => onToggle(inst, step)}
            />
          )),
        ])}
      </div>
      {/* Desktop: original flex layout with scroll */}
      <div className="hidden md:flex gap-4 lg:gap-[16px] items-start relative flex-1 min-w-0 overflow-x-auto">
        <div className="flex flex-col gap-2 lg:gap-[8px] items-start shrink-0">
          <div className="flex gap-4 lg:gap-[16px] items-center py-2 lg:py-[8px] shrink-0">
            {Array.from({ length: STEPS }, (_, i) => (
              <div key={i} className={`flex items-center justify-center shrink-0 size-[40px] font-['Inter',sans-serif] font-medium text-[12px] ${isPlaying && currentStep === i ? 'text-[#ad46ff]' : 'text-[#3f3f47]'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          {INSTRUMENTS.map((inst) => (
            <div key={inst} className="flex gap-4 lg:gap-[16px] items-center py-2 lg:py-[8px] shrink-0">
              {Array.from({ length: STEPS }, (_, step) => (
                <GridCellDesktop key={step} active={grid[inst][step]} isCurrentStep={isPlaying && currentStep === step} onClick={() => onToggle(inst, step)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const { user, accessToken, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);

  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [savedBeats, setSavedBeats] = useState<{ name: string; grid: Grid; tempo: number }[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [beatsLoading, setBeatsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const gridRef = useRef(grid);
  const tempoRef = useRef(tempo);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  // Fetch beats when user logs in
  const fetchBeats = useCallback(async (token: string) => {
    setBeatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/beats`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-user-token': token,
        },
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (res.ok && data.beats) {
        setSavedBeats(data.beats);
      } else {
        console.error('Error fetching beats:', res.status, data.error || data);
      }
    } catch (err) {
      console.error('Error fetching beats (network):', err);
    } finally {
      setBeatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      fetchBeats(accessToken);
    } else {
      setSavedBeats([]);
    }
  }, [user, accessToken, fetchBeats]);

  // Fetch avatar when user logs in
  const fetchAvatar = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/avatar`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-user-token': token,
        },
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = {}; }
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      } else {
        setAvatarUrl(null);
      }
    } catch (err) {
      console.error('Error fetching avatar (network):', err);
      setAvatarUrl(null);
    }
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      fetchAvatar(accessToken);
    } else {
      setAvatarUrl(null);
    }
  }, [user, accessToken, fetchAvatar]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!accessToken) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_BASE}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-user-token': accessToken,
        },
        body: formData,
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      } else {
        console.error('Error uploading avatar:', res.status, data.error || data);
      }
    } catch (err) {
      console.error('Error uploading avatar (network):', err);
    } finally {
      setAvatarUploading(false);
    }
  }, [accessToken]);

  const toggleCell = useCallback((instrument: InstrumentName, step: number) => {
    setGrid((prev) => {
      const newGrid = { ...prev };
      newGrid[instrument] = [...prev[instrument]];
      newGrid[instrument][step] = !prev[instrument][step];
      if (newGrid[instrument][step]) {
        playInstrument(instrument);
      }
      return newGrid;
    });
  }, []);

  const stopPlayback = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const startPlayback = useCallback(() => {
    const ctx = getAudioCtx();
    currentStepRef.current = 0;
    nextStepTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);

    const scheduleAhead = 0.1;
    const scheduleInterval = 25;

    function scheduler() {
      const ctx2 = getAudioCtx();
      while (nextStepTimeRef.current < ctx2.currentTime + scheduleAhead) {
        const step = currentStepRef.current;
        const g = gridRef.current;
        const t = nextStepTimeRef.current;

        for (const inst of INSTRUMENTS) {
          if (g[inst][step]) {
            playInstrument(inst, t);
          }
        }

        const delay = Math.max(0, (t - ctx2.currentTime) * 1000);
        setTimeout(() => {
          setCurrentStep(step);
        }, delay);

        const secondsPerStep = 60 / tempoRef.current / 4;
        nextStepTimeRef.current += secondsPerStep;
        currentStepRef.current = (step + 1) % STEPS;
      }
    }

    schedulerRef.current = window.setInterval(scheduler, scheduleInterval);
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  const newBeat = useCallback(() => {
    stopPlayback();
    setGrid(createEmptyGrid());
  }, [stopPlayback]);

  const saveBeat = useCallback(async () => {
    if (!saveName.trim()) return;

    if (!user || !accessToken) {
      // Not logged in - prompt auth
      setShowSaveDialog(false);
      setAuthModalMode('login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/beats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-user-token': accessToken,
        },
        body: JSON.stringify({ name: saveName.trim(), grid, tempo }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error saving beat:', data.error);
        return;
      }
      // Refresh list
      await fetchBeats(accessToken);
      setShowSaveDialog(false);
      setSaveName('');
    } catch (err) {
      console.error('Error saving beat:', err);
    }
  }, [saveName, grid, tempo, user, accessToken, fetchBeats]);

  const loadBeat = useCallback(
    (beat: { name: string; grid: Grid; tempo: number }) => {
      stopPlayback();
      setGrid(beat.grid);
      setTempo(beat.tempo);
      setShowOpenDialog(false);
    },
    [stopPlayback]
  );

  const deleteBeat = useCallback(async (name: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/beats/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-user-token': accessToken,
        },
      });
      if (res.ok) {
        await fetchBeats(accessToken);
      } else {
        const data = await res.json();
        console.error('Error deleting beat:', data.error);
      }
    } catch (err) {
      console.error('Error deleting beat:', err);
    }
  }, [accessToken, fetchBeats]);

  const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
    await signUp(email, password, name);
  }, [signUp]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, [signIn]);

  const handleSaveClick = useCallback(() => {
    if (!user) {
      setAuthModalMode('login');
      return;
    }
    setSaveName('');
    setShowSaveDialog(true);
  }, [user]);

  const handleOpenClick = useCallback(() => {
    if (!user) {
      setAuthModalMode('login');
      return;
    }
    setShowOpenDialog(true);
  }, [user]);

  return (
    <div className="bg-[#09090b] min-h-screen min-h-[100dvh] flex flex-col safe-area-padding">
      <Navbar
        user={user}
        avatarUrl={avatarUrl}
        avatarUploading={avatarUploading}
        onSignOut={signOut}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onAvatarUpload={handleAvatarUpload}
      />

      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 md:px-10 lg:px-[40px] py-4 sm:py-5 md:py-[24px]">
        {/* Playback Tools - Mobile: compact icon row | Desktop: full layout */}
        <div className="bg-[#18181b] relative rounded-tl-[12px] rounded-tr-[12px] shrink-0 w-full">
          <div className="overflow-clip rounded-[inherit] size-full">
            {/* Mobile: single compact row - Playback | Tempo | Save | Open | New */}
            <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2.5">
              <button
                onClick={togglePlayback}
                className={`${isPlaying ? 'bg-[#dc2626]' : 'bg-[#8200db]'} flex-1 flex gap-2 items-center justify-center py-2.5 px-3 rounded-lg shrink-0 cursor-pointer hover:brightness-110 transition-all touch-manipulation min-h-[44px]`}
              >
                {isPlaying ? (
                  <svg className="size-5 shrink-0" fill="none" viewBox="0 0 16.5 16.5"><rect x="4" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" /><rect x="9.5" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" /></svg>
                ) : (
                  <svg className="size-5 shrink-0" fill="none" viewBox="0 0 16.5 16.5"><path d={svgPaths.p3031a300} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d={svgPaths.p2aad7200} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
                )}
                <span className="font-['Geist',sans-serif] font-medium text-[#f8fafc] text-sm">{isPlaying ? 'Stop' : 'Play'}</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-['Inter',sans-serif] font-medium text-[#9f9fa9] text-xs">BPM</span>
                <input
                  type="number"
                  min={40}
                  max={300}
                  value={tempo}
                  onChange={(e) => setTempo(Math.max(40, Math.min(300, Number(e.target.value) || 120)))}
                  className="bg-[#27272a] text-[#f1f5f9] font-['Inter',sans-serif] font-medium text-sm w-12 text-center py-1.5 px-1 rounded border border-[#3f3f47] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button onClick={handleSaveClick} className="size-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f47] transition-colors touch-manipulation shrink-0" title="Save Beat">
                <Save size={20} className="text-[#99A1AF]" />
              </button>
              <button onClick={handleOpenClick} className="size-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f47] transition-colors touch-manipulation shrink-0" title="Open Beat">
                <FolderOpen size={20} className="text-[#99A1AF]" />
              </button>
              <button onClick={newBeat} className="size-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f47] transition-colors touch-manipulation shrink-0" title="New Beat">
                <Plus size={20} className="text-[#99A1AF]" />
              </button>
            </div>
            {/* Desktop: original layout */}
            <div className="hidden md:flex content-stretch items-center justify-between gap-4 px-6 lg:px-10 py-4 relative w-full">
              <div className="content-stretch flex gap-6 lg:gap-[40px] items-center relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <p className="font-['Inter',sans-serif] font-medium text-[#f1f5f9] text-[16px]">Tempo</p>
                  <div className="bg-[#27272a] relative rounded-[2px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[2px]" />
                    <input type="number" min={40} max={300} value={tempo} onChange={(e) => setTempo(Math.max(40, Math.min(300, Number(e.target.value) || 120)))} className="bg-transparent text-[#f1f5f9] font-['Inter',sans-serif] font-medium text-[16px] w-[56px] text-center px-[8px] py-[4px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>
                <button onClick={togglePlayback} className={`${isPlaying ? 'bg-[#dc2626]' : 'bg-[#8200db]'} relative flex gap-[4px] items-center justify-center p-[8px] rounded-[8px] shrink-0 cursor-pointer hover:brightness-110 transition-all`}>
                  <div aria-hidden="true" className={`absolute border ${isPlaying ? 'border-[#f87171]' : 'border-[#ad46ff]'} border-solid inset-0 pointer-events-none rounded-[8px]`} />
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    {isPlaying ? <svg className="block size-full" fill="none" viewBox="0 0 16.5 16.5"><rect x="4" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" /><rect x="9.5" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" /></svg> : <svg className="block size-full" fill="none" viewBox="0 0 16.5 16.5"><path d={svgPaths.p3031a300} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d={svgPaths.p2aad7200} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>}
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium text-[#f8fafc] text-[16px]">{isPlaying ? 'Stop' : 'Playback'}</p>
                </button>
              </div>
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                <button onClick={handleSaveClick} className="content-stretch flex gap-[8px] items-center justify-center p-[8px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="bg-[#27272a] flex items-center p-[4px] rounded-[4px] shrink-0"><div className="overflow-clip rounded-[4px] shrink-0 size-[20px]"><svg className="block size-full" fill="none" viewBox="0 0 17.75 14"><path d={svgPaths.pb0ea00} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg></div></div>
                  <p className="font-['Geist',sans-serif] font-medium text-[#f1f5f9] text-[16px]">Save Beat</p>
                </button>
                <button onClick={handleOpenClick} className="content-stretch flex gap-[8px] items-center justify-center p-[8px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="bg-[#27272a] flex items-center p-[4px] rounded-[4px] shrink-0"><div className="overflow-clip rounded-[4px] shrink-0 size-[20px]"><svg className="block size-full" fill="none" viewBox="0 0 18.4272 15.25"><path d={svgPaths.p14df6180} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg></div></div>
                  <p className="font-['Geist',sans-serif] font-medium text-[#f1f5f9] text-[16px]">Open Beat</p>
                </button>
                <button onClick={newBeat} className="content-stretch flex gap-[8px] items-center justify-center p-[8px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="bg-[#27272a] flex items-center p-[4px] rounded-[4px] shrink-0"><div className="overflow-clip rounded-[4px] shrink-0 size-[20px]"><svg className="block size-full" fill="none" viewBox="0 0 15.25 17.75"><path d={svgPaths.p2543cf1} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg></div></div>
                  <p className="font-['Geist',sans-serif] font-medium text-[#f1f5f9] text-[16px]">New Beat</p>
                </button>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-2 border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-tl-[12px] rounded-tr-[12px]" />
        </div>

        {/* Sequencer Grid */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#18181b]/50 border-2 border-t-0 border-[#3f3f47] rounded-bl-[12px] rounded-br-[12px] px-4 sm:px-6 md:px-10 lg:px-[40px] py-4 sm:py-5 md:py-[24px]">
          <div className="flex-1 flex min-h-0 gap-2 sm:gap-4 md:gap-[16px] items-stretch">
            {/* Track labels - hidden on mobile (labels in grid) */}
            <div className="hidden md:flex content-stretch flex-col gap-2 lg:gap-[8px] items-start relative shrink-0">
              <div className="content-stretch flex items-center justify-center p-2 lg:p-[8px] relative shrink-0 h-[40px]">
                <p className="font-['Inter',sans-serif] font-medium text-[#3f3f47] text-base lg:text-[20px]">Tracks</p>
              </div>
              {INSTRUMENTS.map((inst) => (
                <div key={inst} className="flex items-center p-2 lg:p-[8px] h-[56px] shrink-0">
                  <p className="font-['Inter',sans-serif] font-medium text-[#9f9fa9] text-sm lg:text-[20px] whitespace-nowrap">
                    {INSTRUMENT_LABELS[inst]}
                  </p>
                </div>
              ))}
            </div>

            {/* Beat grid */}
            <BeatGrid grid={grid} currentStep={currentStep} isPlaying={isPlaying} onToggle={toggleCell} />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-0" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-[#27272a] rounded-[12px] p-4 sm:p-[24px] w-full max-w-[360px] border border-[#3f3f47]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-['Inter',sans-serif] font-medium text-[20px] text-[#f1f5f9] mb-[16px]">Save Beat</h2>
            <input
              type="text"
              placeholder="Enter beat name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveBeat()}
              autoFocus
              className="w-full bg-[#18181b] text-[#f1f5f9] font-['Inter',sans-serif] text-[16px] px-[12px] py-[8px] rounded-[8px] border border-[#3f3f47] outline-none focus:border-[#8200db] mb-[16px]"
            />
            <div className="flex gap-[8px] justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-[16px] py-[8px] rounded-[8px] text-[#9f9fa9] font-['Geist',sans-serif] font-medium text-[14px] hover:text-[#f1f5f9] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveBeat}
                className="px-[16px] py-[8px] rounded-[8px] bg-[#8200db] text-[#f8fafc] font-['Geist',sans-serif] font-medium text-[14px] hover:bg-[#9a20ef] transition-colors cursor-pointer border border-[#ad46ff]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Dialog */}
      {showOpenDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-0" onClick={() => setShowOpenDialog(false)}>
          <div className="bg-[#27272a] rounded-[12px] p-4 sm:p-[24px] w-full max-w-[400px] max-h-[85vh] sm:max-h-[500px] border border-[#3f3f47] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-['Inter',sans-serif] font-medium text-[20px] text-[#f1f5f9] mb-[16px]">Open Beat</h2>
            {beatsLoading ? (
              <p className="text-[#9f9fa9] font-['Inter',sans-serif] text-[14px] text-center py-[24px] animate-pulse">Loading beats...</p>
            ) : savedBeats.length === 0 ? (
              <p className="text-[#9f9fa9] font-['Inter',sans-serif] text-[14px] text-center py-[24px]">No saved beats yet</p>
            ) : (
              <div className="flex flex-col gap-[8px] overflow-y-auto flex-1">
                {savedBeats.map((beat) => (
                  <div key={beat.name} className="flex items-center justify-between bg-[#18181b] rounded-[8px] px-[12px] py-[8px] border border-[#3f3f47]">
                    <button
                      onClick={() => loadBeat(beat)}
                      className="text-[#f1f5f9] font-['Inter',sans-serif] font-medium text-[14px] hover:text-[#ad46ff] transition-colors cursor-pointer flex-1 text-left"
                    >
                      {beat.name}
                    </button>
                    <button
                      onClick={() => deleteBeat(beat.name)}
                      className="text-[#9f9fa9] hover:text-[#dc2626] transition-colors cursor-pointer ml-[8px] text-[14px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-[16px]">
              <button
                onClick={() => setShowOpenDialog(false)}
                className="px-[16px] py-[8px] rounded-[8px] text-[#9f9fa9] font-['Geist',sans-serif] font-medium text-[14px] hover:text-[#f1f5f9] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}