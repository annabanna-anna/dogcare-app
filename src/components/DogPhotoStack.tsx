import { useState } from 'react'
import DogIcon from './icons/DogIcon'

// Diagonal stack for group profiles, tuned for a 64px slot (photo size and
// step per dog count) and scaled down for smaller slots.
const STACK = {
  2: { size: 46, step: 18 },
  3: { size: 40, step: 12 },
} as const

export function DogPhoto({
  src,
  alt,
  className,
  iconSize,
  style,
}: {
  src?: string
  alt: string
  className: string
  iconSize: number
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`overflow-hidden bg-[#f3f4f6] flex items-center justify-center ${className}`} style={style}>
      {src && !failed ? (
        <img src={src} alt={alt} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <DogIcon size={iconSize} className="text-text-muted" />
      )}
    </div>
  )
}

/** One dog's photo, or a group's photos stacked diagonally with the first
 *  dog in front — all within the same size × size slot. */
export default function DogPhotoStack({
  dogs,
  size,
  radius,
  stackRadius,
  ringClassName,
}: {
  dogs: { name: string; photoUrl?: string }[]
  size: number
  radius: number        // single photo's corner radius
  stackRadius: number   // each stacked photo's corner radius
  ringClassName: string // ring in the surface color separates overlapping photos
}) {
  if (dogs.length <= 1) {
    const dog = dogs[0]
    return (
      <DogPhoto
        src={dog?.photoUrl}
        alt={dog?.name ?? ''}
        iconSize={Math.round(size * 0.47)}
        className="shrink-0"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    )
  }

  const scale = size / 64
  const base = STACK[Math.min(dogs.length, 3) as 2 | 3]
  const photo = Math.round(base.size * scale)
  const step = Math.round(base.step * scale)
  return (
    <div className="shrink-0 relative" style={{ width: size, height: size }}>
      {dogs.slice(0, 3).map((d, i) => (
        <DogPhoto
          key={i}
          src={d.photoUrl}
          alt={d.name}
          iconSize={Math.round(photo / 2)}
          className={`absolute ring-2 ${ringClassName}`}
          style={{
            width: photo,
            height: photo,
            borderRadius: stackRadius,
            left: i * step,
            top: i * step,
            zIndex: 3 - i,
          }}
        />
      ))}
    </div>
  )
}
