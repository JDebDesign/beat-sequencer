import { useState } from 'react';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  initialMode: AuthMode;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name?: string) => Promise<void>;
}

export function AuthModal({ initialMode, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await onSignUp(email, password, name || undefined);
      } else {
        await onSignIn(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#27272a] rounded-[12px] p-[32px] w-[400px] border border-[#3f3f47]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex gap-0 mb-[24px] border-b border-[#3f3f47]">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 pb-[12px] font-['Geist',sans-serif] font-medium text-[16px] cursor-pointer transition-colors border-b-2 ${
              mode === 'login'
                ? 'text-[#f8fafc] border-[#8200db]'
                : 'text-[#9f9fa9] border-transparent hover:text-[#f1f5f9]'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 pb-[12px] font-['Geist',sans-serif] font-medium text-[16px] cursor-pointer transition-colors border-b-2 ${
              mode === 'signup'
                ? 'text-[#f8fafc] border-[#8200db]'
                : 'text-[#9f9fa9] border-transparent hover:text-[#f1f5f9]'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
          {mode === 'signup' && (
            <div className="flex flex-col gap-[6px]">
              <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#9f9fa9]">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#18181b] text-[#f1f5f9] font-['Inter',sans-serif] text-[15px] px-[12px] py-[10px] rounded-[8px] border border-[#3f3f47] outline-none focus:border-[#8200db] transition-colors placeholder:text-[#52525b]"
              />
            </div>
          )}

          <div className="flex flex-col gap-[6px]">
            <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#9f9fa9]">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#18181b] text-[#f1f5f9] font-['Inter',sans-serif] text-[15px] px-[12px] py-[10px] rounded-[8px] border border-[#3f3f47] outline-none focus:border-[#8200db] transition-colors placeholder:text-[#52525b]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#9f9fa9]">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#18181b] text-[#f1f5f9] font-['Inter',sans-serif] text-[15px] px-[12px] py-[10px] rounded-[8px] border border-[#3f3f47] outline-none focus:border-[#8200db] transition-colors placeholder:text-[#52525b]"
            />
          </div>

          {error && (
            <p className="text-[#f87171] font-['Inter',sans-serif] text-[13px] bg-[#dc2626]/10 px-[12px] py-[8px] rounded-[8px] border border-[#dc2626]/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8200db] text-[#f8fafc] font-['Geist',sans-serif] font-medium text-[16px] py-[10px] rounded-[8px] cursor-pointer hover:bg-[#9a20ef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            <div aria-hidden="true" className="absolute border border-[#ad46ff] border-solid inset-0 pointer-events-none rounded-[8px]" />
            {loading ? (
              <span className="animate-pulse">
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Log In'
            )}
          </button>
        </form>

        <p className="text-center mt-[16px] font-['Inter',sans-serif] text-[13px] text-[#9f9fa9]">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="text-[#ad46ff] hover:text-[#c77dff] cursor-pointer transition-colors"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="text-[#ad46ff] hover:text-[#c77dff] cursor-pointer transition-colors"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
