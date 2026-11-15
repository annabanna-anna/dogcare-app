import { PawPrint, Pill, Bone, Toilet } from 'lucide-react'
import DogBowlIcon from './icons/DogBowlIcon'
import type { TaskType } from '../types'

type IconComponent = React.ComponentType<{ size?: string | number; className?: string }>

/** The one icon + color per task type, used everywhere a task badge shows
 *  (Today, dog profile schedule, task preview, marketing mockups).
 *  See DESIGN.md › Task type icons. */
export const TASK_TYPE_STYLE: Record<TaskType, { icon: IconComponent; bg: string }> = {
  walk:       { icon: PawPrint,    bg: 'bg-blue-task' },
  meal:       { icon: DogBowlIcon, bg: 'bg-coral' },
  medication: { icon: Pill,        bg: 'bg-purple-task' },
  potty:      { icon: Toilet,      bg: 'bg-green-vivid' },
  other:      { icon: Bone,        bg: 'bg-text-muted' },
}
