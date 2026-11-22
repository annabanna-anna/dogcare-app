/** The visible crop square, as fractions of the source image. */
export interface PhotoCrop {
  x: number
  y: number
  w: number
  h: number
}

/** Fills a square, `relative overflow-hidden` parent with only the given crop of
 *  `src` — the whole image (object-cover) when there's no crop. */
export default function CroppedImg({ src, crop }: { src: string; crop?: PhotoCrop | null }) {
  if (!crop) return <img src={src} alt="" className="size-full object-cover" />
  return (
    <img
      src={src}
      alt=""
      className="absolute"
      style={{
        width: `${100 / crop.w}%`,
        height: `${100 / crop.h}%`,
        left: `${(-crop.x / crop.w) * 100}%`,
        top: `${(-crop.y / crop.h) * 100}%`,
        maxWidth: 'none',
      }}
    />
  )
}
