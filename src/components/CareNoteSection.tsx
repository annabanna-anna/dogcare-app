import { type ReactNode } from 'react'

interface Props {
  title: string
  icon: ReactNode
  content: string
  emptyText?: string
}

export default function CareNoteSection({
  title,
  icon,
  content,
  emptyText = 'No notes added.',
}: Props) {
  return (
    <div className="bg-white border border-border-light rounded-[16px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-coral shrink-0 flex">{icon}</span>
        <h3 className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <p className="font-dm text-[14px] text-text-primary leading-relaxed whitespace-pre-line">
        {content || emptyText}
      </p>
    </div>
  )
}
