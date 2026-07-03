import type { TaskStatus } from '../types'

interface Props {
  status: TaskStatus
}

const config: Record<TaskStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-[#f3f4f6] text-[#6b7280]' },
  done:     { label: 'Done',     className: 'bg-[#dcfce7] text-[#15803d]' },
  skipped:  { label: 'Skipped', className: 'bg-[#fef9c3] text-[#a16207]' },
  overdue:  { label: 'Overdue', className: 'bg-[#fee2e2] text-[#b91c1c]' },
}

export default function StatusChip({ status }: Props) {
  const { label, className } = config[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-gabarito font-bold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}
