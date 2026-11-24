import { Check } from 'lucide-react'

/** The app's on/off switch (Figma: Toggle component). A thin track with an
 *  oversized knob; when on, the knob carries a check so the state reads
 *  without relying on color. The button is a 44px tall touch target that
 *  takes no extra row height (negative margin). */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  /** Accessible name, when no visible label is linked to the switch. */
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex items-center justify-center h-11 w-12 -my-2.5 shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span
        aria-hidden
        className={`relative block w-11 h-4 rounded-full transition-colors duration-200 ${
          checked ? 'bg-coral' : 'bg-border-light'
        }`}
      >
        <span
          className={`absolute -top-1 size-6 rounded-full bg-cream border-[1.75px] flex items-center justify-center transition-[left,border-color] duration-200 ${
            checked ? 'left-5 border-coral' : 'left-0 border-border-light'
          }`}
        >
          <Check
            size={14}
            strokeWidth={1.75}
            absoluteStrokeWidth
            className={`text-coral transition-opacity duration-200 ${
              checked ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>
      </span>
    </button>
  )
}
