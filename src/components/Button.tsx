import { type ReactNode, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-coral text-white active:bg-[#e04428] disabled:opacity-40',
  secondary: 'bg-white border border-border-light text-text-primary active:bg-gray-50 disabled:opacity-40',
  ghost:     'bg-transparent text-text-secondary active:bg-gray-100 disabled:opacity-40',
  danger:    'bg-[#fee2e2] text-[#b91c1c] active:bg-[#fecaca] disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-5 py-3 text-[15px]',
  lg: 'px-6 py-4 text-[16px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-[14px] font-gabarito font-bold
        transition-all duration-100 select-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
}
