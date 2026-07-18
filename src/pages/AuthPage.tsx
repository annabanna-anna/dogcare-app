import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Button from '../components/Button'

// Dog animation (public/splash.lottie): "Free dog animation Animation"
// by Waris ahmed — https://lottiefiles.com/ucwbmwf5zwku7fwe

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid = password.length >= 8
  const isValid = emailValid && passwordValid
  const isLogin = mode === 'login'

  function authenticate() {
    // In a real app: Supabase auth (email/password or Google OAuth)
    localStorage.setItem('dogcare-authed', '1')
    onAuth()
  }

  return (
    <div className="min-h-svh bg-cream flex flex-col px-6 pt-10 pb-8">
      <div className="flex flex-col items-center">
        <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 150, height: 150 }} />
      </div>

      <div className="mt-2 mb-6">
        <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-1">
          {isLogin ? 'Welcome back' : 'Get started'}
        </p>
        <h1 className="font-outfit font-bold text-[40px] leading-none text-cobalt">
          {isLogin ? 'Log In' : 'Sign Up'}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-white border border-border-light rounded-[12px] pl-11 pr-4 py-3.5 font-dm text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral transition-colors"
          />
        </div>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? 'Password' : 'Password (8+ characters)'}
            className="w-full bg-white border border-border-light rounded-[12px] pl-11 pr-12 py-3.5 font-dm text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral transition-colors"
          />
          <button
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-text-muted"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button fullWidth size="lg" onClick={authenticate} disabled={!isValid}>
          {isLogin ? 'Log In' : 'Create Account'}
        </Button>

        {isLogin && (
          <button className="font-dm font-bold text-[13px] text-text-secondary text-center py-1">
            Forgot password?
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border-faint" />
          <span className="font-dm text-[12px] text-text-muted uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border-faint" />
        </div>

        <button
          onClick={authenticate}
          className="w-full flex items-center justify-center gap-2.5 rounded-full bg-white border-2 border-text-primary px-5 py-3 font-dm font-bold text-[15px] text-text-primary active:bg-gray-50 active:scale-[0.98] transition-all duration-100"
        >
          <GoogleLogo />
          Continue with Google
        </button>
      </div>

      <div className="mt-auto pt-8 flex flex-col items-center gap-3">
        {!isLogin && (
          <p className="font-dm text-[12px] text-text-muted text-center leading-relaxed px-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        )}
        <p className="font-dm text-[14px] text-text-secondary">
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
            className="font-bold text-coral"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
