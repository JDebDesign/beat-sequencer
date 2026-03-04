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
import { Pencil, Camera, User } from 'lucide-react';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-[#18181b] relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-end overflow-clip size-full">
        <div className="content-stretch flex items-center justify-end px-[40px] py-[24px] relative w-full">
          <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0">
            {user ? (
              <>
                {/* Avatar */}
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
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="size-full rounded-full object-cover border-2 border-[#3f3f47] group-hover:border-[#8200db] transition-colors"
                    />
                  ) : (
                    <div className="size-full rounded-full bg-[#27272a] border-2 border-[#3f3f47] group-hover:border-[#8200db] transition-colors flex items-center justify-center">
                      <User size={18} className="text-[#9f9fa9]" />
                    </div>
                  )}
                  {/* Edit overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {avatarUploading ? (
                      <div className="size-[14px] border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    ) : avatarUrl ? (
                      <Pencil size={14} className="text-white/90" />
                    ) : (
                      <Camera size={14} className="text-white/90" />
                    )}
                  </div>
                </button>

                <p className="font-['Inter',sans-serif] font-medium text-[14px] text-[#9f9fa9]">
                  {user.user_metadata?.name || user.email}
                </p>
                <button
                  onClick={onSignOut}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80"
                >
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Sign Out</p>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="bg-[#8200db] content-stretch flex gap-[4px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#9a20ef] transition-colors"
                >
                  <div aria-hidden="true" className="absolute border border-[#ad46ff] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f8fafc] text-[16px]">Sign Up</p>
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80"
                >
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Log In</p>
                </button>
              </>
            )}
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#8200db] content-stretch flex items-center justify-center left-1/2 px-[16px] py-[4px] top-[calc(50%+1px)]">
            <p className="font-['Inter',sans-serif] font-black italic leading-[normal] relative shrink-0 text-[#f8fafc] text-[36px]">Super Beats</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#3f3f47] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

// ─── Grid Cell ───
function GridCell({
  active,
  isCurrentStep,
  onClick,
}: {
  active: boolean;
  isCurrentStep: boolean;
  onClick: () => void;
}) {
  let bg = 'bg-[#18181b]';
  if (active && isCurrentStep) {
    bg = 'bg-[#ad46ff]';
  } else if (active) {
    bg = 'bg-[#8200db]';
  } else if (isCurrentStep) {
    bg = 'bg-[#52525b]';
  } else {
    bg = 'bg-[#27272a]';
  }

  return (
    <button
      onClick={onClick}
      className={`${bg} relative rounded-[8px] shrink-0 size-[40px] cursor-pointer transition-colors duration-75 hover:brightness-125 active:scale-95`}
    >
      <div
        aria-hidden="true"
        className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] ${
          active ? 'border-[#ad46ff]' : 'border-[#4a5565]'
        }`}
      />
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
    <div className="content-stretch flex gap-[16px] items-start relative flex-1 min-w-0 overflow-x-auto">
      <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
        {/* Step numbers header */}
        <div className="content-stretch flex gap-[16px] items-center py-[8px] relative shrink-0">
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center shrink-0 size-[40px] font-['Inter',sans-serif] font-medium text-[12px] ${
                isPlaying && currentStep === i ? 'text-[#ad46ff]' : 'text-[#3f3f47]'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Instrument rows */}
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="content-stretch flex gap-[16px] items-center py-[8px] relative shrink-0">
            {Array.from({ length: STEPS }, (_, step) => (
              <GridCell
                key={step}
                active={grid[inst][step]}
                isCurrentStep={isPlaying && currentStep === step}
                onClick={() => onToggle(inst, step)}
              />
            ))}
          </div>
        ))}
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
    <div className="bg-[#09090b] min-h-screen flex flex-col">
      <Navbar
        user={user}
        avatarUrl={avatarUrl}
        avatarUploading={avatarUploading}
        onSignOut={signOut}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onAvatarUpload={handleAvatarUpload}
      />

      <div className="flex-1 px-[40px] py-[24px]">
        {/* Playback Tools */}
        <div className="bg-[#18181b] relative rounded-tl-[12px] rounded-tr-[12px] shrink-0 w-full">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center justify-between px-[40px] py-[16px] relative w-full flex-wrap gap-[16px]">
              {/* Left: Tempo + Playback */}
              <div className="content-stretch flex gap-[40px] items-center relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <p className="font-['Inter',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">
                    Tempo
                  </p>
                  <div className="bg-[#27272a] relative rounded-[2px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[2px]" />
                    <input
                      type="number"
                      min={40}
                      max={300}
                      value={tempo}
                      onChange={(e) => setTempo(Math.max(40, Math.min(300, Number(e.target.value) || 120)))}
                      className="bg-transparent text-[#f1f5f9] font-['Inter',sans-serif] font-medium text-[16px] w-[56px] text-center px-[8px] py-[4px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <button
                  onClick={togglePlayback}
                  className={`${
                    isPlaying ? 'bg-[#dc2626]' : 'bg-[#8200db]'
                  } content-stretch flex gap-[4px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:brightness-110 transition-all`}
                >
                  <div aria-hidden="true" className={`absolute border ${isPlaying ? 'border-[#f87171]' : 'border-[#ad46ff]'} border-solid inset-0 pointer-events-none rounded-[8px]`} />
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-5%]">
                        {isPlaying ? (
                          <svg className="block size-full" fill="none" viewBox="0 0 16.5 16.5">
                            <rect x="4" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" />
                            <rect x="9.5" y="3" width="3" height="10.5" rx="1" fill="#F8FAFC" />
                          </svg>
                        ) : (
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.5 16.5">
                            <g>
                              <path d={svgPaths.p3031a300} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                              <path d={svgPaths.p2aad7200} stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            </g>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f8fafc] text-[16px]">
                    {isPlaying ? 'Stop' : 'Playback'}
                  </p>
                </button>
              </div>

              {/* Right: Save / Open / New */}
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                <button
                  onClick={handleSaveClick}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[18.75%_9.38%]">
                        <div className="absolute inset-[-6%_-4.62%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.75 14">
                            <path d={svgPaths.pb0ea00} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Save Beat</p>
                </button>

                <button
                  onClick={handleOpenClick}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[15.63%_7.68%]">
                        <div className="absolute inset-[-5.45%_-4.43%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.4272 15.25">
                            <path d={svgPaths.p14df6180} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Open Beat</p>
                </button>

                <button
                  onClick={newBeat}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[9.38%_15.63%]">
                        <div className="absolute inset-[-4.62%_-5.45%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.25 17.75">
                            <path d={svgPaths.p2543cf1} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">New Beat</p>
                </button>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-2 border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-tl-[12px] rounded-tr-[12px]" />
        </div>

        {/* Sequencer Grid */}
        <div className="bg-[#18181b]/50 border-2 border-t-0 border-[#3f3f47] rounded-bl-[12px] rounded-br-[12px] px-[40px] py-[24px]">
          <div className="flex gap-[16px] items-start">
            {/* Track labels */}
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
              <div className="content-stretch flex items-center justify-center p-[8px] relative shrink-0 h-[40px]">
                <p className="font-['Inter',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#3f3f47] text-[20px]">Tracks</p>
              </div>
              {INSTRUMENTS.map((inst) => (
                <div key={inst} className="flex items-center p-[8px] h-[56px] shrink-0">
                  <p className="font-['Inter',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#9f9fa9] text-[20px] whitespace-nowrap">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-[#27272a] rounded-[12px] p-[24px] w-[360px] border border-[#3f3f47]" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowOpenDialog(false)}>
          <div className="bg-[#27272a] rounded-[12px] p-[24px] w-[400px] max-h-[500px] border border-[#3f3f47] flex flex-col" onClick={(e) => e.stopPropagation()}>
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