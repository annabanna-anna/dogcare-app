import { type ReactNode } from 'react'

interface Props {
  title: string
  icon: ReactNode
  content: string
  accentColor?: string
  emptyText?: string
}

export default function CareNoteSection({
  title,
  icon,
  content,
  accentColor = '#ff4514',
  emptyText = 'No notes added.',
}: Props) {
  return (
    <div className="bg-white border border-border-light rounded-[16px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="size-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-white">{icon}</span>
        </div>
        <h3 className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <p className="font-dm text-[14px] text-text-primary leading-relaxed">
        {content || emptyText}
      </p>
    </div>
  )
}
