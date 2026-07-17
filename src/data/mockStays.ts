import type { Stay } from '../types'

export const mockStays: Stay[] = [
  {
    id: 'stay-1',
    dogId: 'dog-1',
    startDate: '2026-07-10T08:00:00',
    endDate: '2026-07-20T18:00:00',
    notes: 'Owner in Tokyo. Emergency contact is James.',
    createdAt: '2025-06-20T10:00:00Z',
  },
  {
    id: 'stay-2',
    dogId: 'dog-3',
    startDate: '2026-07-18T09:00:00',
    endDate: '2026-07-22T18:00:00',
    notes: '',
    createdAt: '2025-06-28T09:00:00Z',
  },
]
