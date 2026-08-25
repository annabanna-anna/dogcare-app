import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

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

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid = password.length >= 8
  const isLogin = mode === 'login'
  const isReset = mode === 'reset'
  const isValid = isReset ? emailValid : emailValid && passwordValid

  async function authenticate() {
    if (!isValid || loading) return
    setLoading(true)
    setError(null)

    if (isReset) {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      setLoading(false)
      if (authError) {
        setError(authError.message)
        return
      }
      setResetSent(true)
      return
    }

    const { error: authError, data } = isLogin
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password })

    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    // Email confirmation is on by default in Supabase — a fresh sign-up with
    // no session yet means "check your inbox" rather than "you're in."
    if (!isLogin && data.user && !data.session) {
      setCheckEmail(true)
    }
    // Otherwise App.tsx's onAuthStateChange listener picks up the new session.
  }

  async function continueWithGoogle() {
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (authError) setError(authError.message)
  }

  if (checkEmail) {
    return (
      <div className="min-h-svh bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 150, height: 150 }} />
        <p className="font-outfit font-bold text-[26px] text-cobalt leading-tight">
          Check your email
        </p>
        <p className="font-dm text-[14px] text-text-secondary max-w-[280px]">
          We sent a confirmation link to <span className="font-bold">{email}</span>. Open it to
          finish creating your account.
        </p>
        <button
          onClick={() => setCheckEmail(false)}
          className="font-dm font-bold text-[13px] text-coral mt-2"
        >
          Back to sign up
        </button>
      </div>
    )
  }

  if (resetSent) {
    return (
      <div className="min-h-svh bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 150, height: 150 }} />
        <p className="font-outfit font-bold text-[26px] text-cobalt leading-tight">
          Check your email
        </p>
        <p className="font-dm text-[14px] text-text-secondary max-w-[280px]">
          If an account exists for <span className="font-bold">{email}</span>, we sent a link to
          reset your password.
        </p>
        <button
          onClick={() => {
            setResetSent(false)
            setMode('login')
          }}
          className="font-dm font-bold text-[13px] text-coral mt-2"
        >
          Back to log in
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream flex flex-col px-6 pt-10 pb-8">
      <div className="flex flex-col items-center">
        <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 150, height: 150 }} />
      </div>

      <div className="mt-2 mb-6">
        <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-1">
          {isReset ? 'Reset password' : isLogin ? 'Welcome back' : 'Get started'}
        </p>
        <h1 className="font-outfit font-bold text-[40px] leading-none text-cobalt">
          {isReset ? 'Forgot Password' : isLogin ? 'Log In' : 'Sign Up'}
        </h1>
        {isReset && (
          <p className="font-dm text-[14px] text-text-secondary mt-2">
            Enter your email and we'll send you a link to reset your password.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {error && (
          <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <AlertCircle size={16} className="text-[#b91c1c] shrink-0 mt-0.5" />
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

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
        {!isReset && (
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
        )}

        <Button fullWidth size="lg" onClick={authenticate} disabled={!isValid || loading}>
          {loading ? 'Please wait…' : isReset ? 'Send Reset Link' : isLogin ? 'Log In' : 'Create Account'}
        </Button>

        {isLogin && (
          <button
            onClick={() => {
              setMode('reset')
              setError(null)
            }}
            className="font-dm font-bold text-[13px] text-text-secondary text-center py-1"
          >
            Forgot password?
          </button>
        )}

        {isReset && (
          <button
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className="font-dm font-bold text-[13px] text-text-secondary text-center py-1"
          >
            Back to log in
          </button>
        )}

        {!isReset && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border-faint" />
              <span className="font-dm text-[12px] text-text-muted uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-border-faint" />
            </div>

            <button
              onClick={continueWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 rounded-full bg-white border-2 border-text-primary px-5 py-3 font-dm font-bold text-[15px] text-text-primary active:bg-gray-50 active:scale-[0.98] transition-all duration-100"
            >
              <GoogleLogo />
              Continue with Google
            </button>
          </>
        )}
      </div>

      <div className="mt-auto pt-8 flex flex-col items-center gap-3">
        {!isLogin && !isReset && (
          <p className="font-dm text-[12px] text-text-muted text-center leading-relaxed px-4">
            By signing up you agree to our{' '}
            <Link
              to="/privacy"
              className="text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        )}
        {/* A visitor (or a Google verification reviewer) who lands on the bare
            domain hits this screen first — give them a way to find out what
            the app is without making an account. */}
        <Link
          to="/about"
          className="font-dm text-[13px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
        >
          What is HeyPup?
        </Link>
        {!isReset && (
          <p className="font-dm text-[14px] text-text-secondary">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(isLogin ? 'signup' : 'login')
                setError(null)
              }}
              className="font-bold text-coral underline underline-offset-2"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
