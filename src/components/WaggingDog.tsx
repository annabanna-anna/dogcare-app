interface Props {
  size?: number
  className?: string
}

/**
 * Brand mascot: blobby side-view dog with a constantly wagging tail.
 * Use in headers, empty states, and success moments.
 */
export default function WaggingDog({ size = 96, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 120 98"
      fill="none"
      className={className}
    >
      {/* tail — wags from its base */}
      <g className="animate-tail-wag" style={{ transformOrigin: '22px 58px' }}>
        <path
          d="M 22 58 Q 6 48 8 32"
          stroke="#ff4514"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      {/* body blob */}
      <path
        d="M 20 70 Q 20 40 52 38 L 84 38 Q 104 38 104 58 L 104 74 Q 104 90 88 90 L 36 90 Q 20 90 20 70 Z"
        fill="#ff4514"
      />
      {/* head */}
      <circle cx="88" cy="34" r="24" fill="#ff4514" />
      {/* floppy ear */}
      <ellipse cx="72" cy="20" rx="10" ry="16" fill="#d93a10" transform="rotate(-30 72 20)" />
      {/* happy closed eyes */}
      <path d="M 84 30 q 4 -5 8 0" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 98 30 q 4 -5 8 0" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* nose + smile */}
      <circle cx="110" cy="40" r="4" fill="#141414" />
      <path d="M 96 44 q 6 6 12 1" stroke="#141414" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* legs */}
      <rect x="34" y="84" width="11" height="13" rx="5.5" fill="#d93a10" />
      <rect x="78" y="84" width="11" height="13" rx="5.5" fill="#d93a10" />
      {/* belly patch */}
      <ellipse cx="58" cy="74" rx="18" ry="12" fill="#ffd7c6" opacity="0.9" />
    </svg>
  )
}
