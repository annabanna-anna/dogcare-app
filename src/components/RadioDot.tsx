/** The radio circle used across the app: a thick ring when selected, a thin
 *  outline when not. Purely visual — the parent button carries role="radio". */
export default function RadioDot({
  selected,
  size = 'md',
  tone = 'coral',
}: {
  selected: boolean
  size?: 'sm' | 'md'
  /** 'ink' for the quieter choices inside a sheet (e.g. "Move the rest too?"). */
  tone?: 'coral' | 'ink'
}) {
  const box = size === 'sm' ? 'size-[18px]' : 'size-[22px]'
  const ring = size === 'sm' ? 'border-[6px]' : 'border-[7px]'
  const color = tone === 'ink' ? 'border-text-primary' : 'border-coral'
  return (
    <span
      aria-hidden
      className={`${box} rounded-full bg-white shrink-0 ${
        selected ? `${ring} ${color}` : 'border-[1.5px] border-border-light'
      }`}
    />
  )
}
