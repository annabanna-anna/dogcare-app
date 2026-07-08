interface Props {
  fading: boolean
}

/**
 * Full-screen brand splash: a dog chasing its own tail as the loader.
 * The dog is drawn curled into a circle (nose almost catching tail),
 * and the whole group spins.
 */
export default function SplashScreen({ fading }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[100] bg-coral flex flex-col items-center justify-center gap-8 transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dog chasing its tail */}
      <div className="animate-chase-spin">
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
          {/* curled body — thick arc, nose end chasing tail end */}
          <path
            d="M 108 45 A 45 45 0 1 0 112 82"
            stroke="white"
            strokeWidth="22"
            strokeLinecap="round"
          />
          {/* head */}
          <circle cx="108" cy="45" r="20" fill="white" />
          {/* ear */}
          <ellipse cx="98" cy="30" rx="9" ry="13" fill="white" transform="rotate(-25 98 30)" />
          {/* nose */}
          <circle cx="124" cy="52" r="4.5" fill="#141414" />
          {/* eye */}
          <path d="M 106 40 q 4 -4 8 0" stroke="#141414" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* tongue */}
          <path d="M 120 62 q 2 7 -4 8" stroke="#ffd7c6" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* tail — just out of reach */}
          <path
            d="M 116 96 q 12 -4 14 -16"
            stroke="white"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="font-gabarito font-extrabold text-[44px] leading-none text-white tracking-tight">
          Dog Care
        </p>
        <p className="font-gabarito font-bold text-[14px] text-white/80 uppercase tracking-widest">
          fetching your day…
        </p>
      </div>
    </div>
  )
}
