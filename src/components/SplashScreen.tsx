import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface Props {
  fading: boolean
}

/**
 * Full-screen brand splash on the app's Studio White canvas,
 * with the Lottie dog loader front and center.
 *
 * Animation: "Free dog animation Animation" (public/splash.lottie)
 * Creator: Waris ahmed
 * Source: https://lottiefiles.com/ucwbmwf5zwku7fwe
 */
export default function SplashScreen({ fading }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[100] bg-cream flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <DotLottieReact
        src="/splash.lottie"
        loop
        autoplay
        style={{ width: 260, height: 260 }}
      />

      <div className="flex flex-col items-center gap-2">
        <p className="font-outfit font-bold text-[44px] leading-none text-text-primary tracking-tight">
          GoodPup
        </p>
        <p className="font-dm font-bold text-[14px] text-coral uppercase tracking-widest">
          fetching your day…
        </p>
      </div>
    </div>
  )
}
