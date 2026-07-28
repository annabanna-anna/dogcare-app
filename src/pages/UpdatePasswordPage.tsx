import { useState } from 'react'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

export default function UpdatePasswordPage({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isValid = password.length >= 8

  async function updatePassword() {
    if (!isValid || loading) return
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-svh bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 150, height: 150 }} />
        <p className="font-outfit font-bold text-[26px] text-cobalt leading-tight">
          Password updated
        </p>
        <p className="font-dm text-[14px] text-text-secondary max-w-[280px]">
          You're all set — continue into GoodPup.
        </p>
        <Button onClick={onDone} size="lg">
          Continue
        </Button>
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
          Almost there
        </p>
        <h1 className="font-outfit font-bold text-[40px] leading-none text-cobalt">
          New Password
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {error && (
          <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <AlertCircle size={16} className="text-[#b91c1c] shrink-0 mt-0.5" />
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        <div className="relative">
          <Lock
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
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

        <Button fullWidth size="lg" onClick={updatePassword} disabled={!isValid || loading}>
          {loading ? 'Please wait…' : 'Update Password'}
        </Button>
      </div>
    </div>
  )
}
