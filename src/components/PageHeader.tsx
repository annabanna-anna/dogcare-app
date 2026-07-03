import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
}

export default function PageHeader({ title, subtitle, back = false, right }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start gap-3 px-6 pt-6 pb-2 w-full">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="mt-1 shrink-0 size-8 flex items-center justify-center rounded-full text-text-secondary active:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {subtitle && (
          <p className="font-gabarito font-bold text-[13px] text-coral uppercase tracking-wide mb-1">
            {subtitle}
          </p>
        )}
        <h1 className="font-teachers font-extrabold text-[40px] leading-none text-text-primary">
          {title}
        </h1>
      </div>
      {right && <div className="shrink-0 mt-2">{right}</div>}
    </div>
  )
}
