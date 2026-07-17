import type { Dog } from '../types'

export const mockDogs: Dog[] = [
  {
    id: 'dog-1',
    name: 'Ollie',
    breed: 'Golden Retriever',
    size: 'large',
    ownerName: 'Sarah Chen',
    ownerContact: '+1 (555) 201-4892',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
    behaviorNotes:
      'Friendly and social but gets anxious during thunderstorms. Keep him calm with a treat and his comfort blanket. Do not take him to the off-leash dog park — he had a bad incident with another dog there.',
    foodNotes:
      'Two cups of Royal Canin dry kibble, twice a day (morning and evening). No table scraps. Allergic to chicken — check treat labels carefully.',
    medicationNotes:
      'One Apoquel tablet (18 mg) with his evening meal. Do not skip. If he refuses the tablet, hide it in a small piece of peanut butter.',
    walkNotes:
      'Needs two walks a day — morning around 8 AM and afternoon around 4 PM. At least 30 minutes each. Keep him on leash near traffic. Avoid the dog park on Elm St.',
    emergencyNotes:
      'Vet: Greenfield Animal Hospital — Dr. Kim, +1 (555) 390-2211. Sarah can be reached any time. In case of emergency, contact James Chen (brother) at +1 (555) 870-1133.',
    careSchedule: [
      { time: '08:00', taskType: 'walk', note: 'Avoid dog park' },
      { time: '08:30', taskType: 'meal', note: 'Two cups dry kibble' },
      { time: '12:00', taskType: 'potty', note: '' },
      { time: '16:00', taskType: 'walk', note: 'Avoid dog park' },
      { time: '18:00', taskType: 'meal', note: 'Two cups dry kibble' },
      { time: '18:15', taskType: 'medication', note: 'One Apoquel tablet (18 mg) with evening food. Do not skip.' },
      { time: '21:00', taskType: 'potty', note: '' },
    ],
    createdAt: '2025-05-10T09:00:00Z',
    updatedAt: '2025-06-20T14:00:00Z',
  },
  {
    id: 'dog-2',
    name: 'Mochi',
    breed: 'Shiba Inu',
    size: 'medium',
    ownerName: 'James Tanaka',
    ownerContact: '+1 (555) 384-6021',
    photoUrl: 'https://images.unsplash.com/photo-1611836140853-985a5fa53d56?w=200&h=200&fit=crop',
    behaviorNotes:
      'Independent and stubborn. Does not like being picked up. Warms up to people slowly — give her space when you first arrive. No rough play.',
    foodNotes:
      'Half a cup of Acana dry food, twice daily. She is a slow eater — leave the bowl out for 20 minutes then remove it. No people food.',
    medicationNotes: 'No current medications.',
    walkNotes:
      'Short walks, 15–20 minutes twice a day. She dislikes rain — use the covered route along Oak St. if it is wet outside.',
    emergencyNotes:
      'Vet: Midtown Pet Clinic — Dr. Patel, +1 (555) 540-7743. James is usually reachable by text.',
    careSchedule: [
      { time: '07:30', taskType: 'walk', note: 'Short walk, avoid rain' },
      { time: '08:00', taskType: 'meal', note: 'Half cup Acana dry food' },
      { time: '17:30', taskType: 'walk', note: 'Short walk, 15–20 min' },
      { time: '18:00', taskType: 'meal', note: 'Half cup Acana dry food' },
    ],
    createdAt: '2025-06-01T11:00:00Z',
    updatedAt: '2025-06-18T10:00:00Z',
  },
  {
    id: 'dog-3',
    name: 'Biscuit',
    breed: 'Beagle',
    size: 'medium',
    ownerName: 'Emma Rodriguez',
    ownerContact: '+1 (555) 612-9034',
    photoUrl: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop',
    behaviorNotes:
      'Very energetic and food-motivated. Counter-surfs — keep counters clear. Gets along great with other dogs. Barks at bikes and skateboards.',
    foodNotes:
      'One and a half cups of Hills Science Diet twice daily. He will beg endlessly — ignore him. Keep bin locked, he has figured out the old one.',
    medicationNotes: 'Monthly flea and tick chewable (NexGard). Next dose due July 10.',
    walkNotes:
      'Needs a good 45-minute walk in the morning. He loves sniffing — let him take his time. Always carry poop bags, he goes a lot.',
    emergencyNotes:
      'Vet: Riverside Animal Care — Dr. Liu, +1 (555) 291-8870. Emma is often in meetings but will call back within the hour.',
    careSchedule: [
      { time: '07:00', taskType: 'walk', note: '45 min, let him sniff' },
      { time: '07:45', taskType: 'meal', note: '1.5 cups Hills Science Diet' },
      { time: '12:30', taskType: 'potty', note: 'Quick break' },
      { time: '17:00', taskType: 'other', note: 'Fetch or tug in yard' },
      { time: '18:00', taskType: 'meal', note: '1.5 cups Hills Science Diet' },
      { time: '21:30', taskType: 'potty', note: 'Last outing' },
    ],
    createdAt: '2025-04-22T08:30:00Z',
    updatedAt: '2025-06-25T16:00:00Z',
  },
]
