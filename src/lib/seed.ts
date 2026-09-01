import { createDog } from './dogs'
import type { DogInput } from './dogs'
import type { CareScheduleEntry } from '../types'

const sampleDogs: (DogInput & { careSchedule: CareScheduleEntry[] })[] = [
  {
    name: 'Ollie',
    breed: 'Golden Retriever',
    size: 'large',
    additionalDogs: [],
    ownerName: 'Sarah Chen',
    ownerContact: '+1 (555) 201-4892',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
    behaviorNotes:
      'Friendly and social but gets anxious during thunderstorms. Keep him calm with a treat and his comfort blanket. Avoid the off-leash dog park.',
    foodNotes: 'Two cups of Royal Canin dry kibble, twice a day. No table scraps. Allergic to chicken.',
    medicationNotes: 'One Apoquel tablet (18 mg) with his evening meal. Do not skip.',
    walkNotes: 'Two walks a day, 30 min each. Keep on leash near traffic. Avoid the dog park on Elm St.',
    emergencyNotes: 'Vet: Greenfield Animal Hospital — Dr. Kim, +1 (555) 390-2211.',
    otherNotes: '',
    hasAllergies: 'yes',
    allergyNotes: 'Chicken',
    goesToDogParks: 'no',
    walkTimeFlexible: false,
    careSchedule: [
      { time: '08:00', taskType: 'walk', note: 'Avoid dog park' },
      { time: '08:30', taskType: 'meal', note: 'Two cups dry kibble' },
      { time: '16:00', taskType: 'walk', note: 'Avoid dog park' },
      { time: '18:00', taskType: 'meal', note: 'Two cups dry kibble' },
      { time: '18:15', taskType: 'medication', note: 'One Apoquel tablet (18 mg) with evening food.' },
    ],
  },
  {
    name: 'Mochi',
    breed: 'Shiba Inu',
    size: 'small',
    additionalDogs: [],
    ownerName: 'James Tanaka',
    ownerContact: '+1 (555) 402-7731',
    photoUrl: 'https://images.unsplash.com/photo-1618849834793-8e0e2ac36e91?w=400&h=300&fit=crop',
    behaviorNotes: 'Independent and a little stubborn. Warms up slowly — give her space at first.',
    foodNotes: 'Half cup grain-free kibble, twice a day. No treats with grain.',
    medicationNotes: '',
    walkNotes: 'One 20-minute walk in the morning. Prone to bolting off-leash — always leashed.',
    emergencyNotes: 'Vet: Westside Animal Clinic — Dr. Patel, +1 (555) 288-0091.',
    otherNotes: '',
    hasAllergies: 'unsure',
    allergyNotes: '',
    goesToDogParks: 'unsure',
    walkTimeFlexible: false,
    careSchedule: [
      { time: '07:30', taskType: 'walk', note: '' },
      { time: '08:00', taskType: 'meal', note: 'Half cup kibble' },
      { time: '18:00', taskType: 'meal', note: 'Half cup kibble' },
    ],
  },
  {
    name: 'Biscuit',
    breed: 'Beagle',
    size: 'medium',
    additionalDogs: [],
    ownerName: 'Emma Rodriguez',
    ownerContact: '+1 (555) 619-3345',
    photoUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=300&fit=crop',
    behaviorNotes: 'Extremely food-motivated and vocal. Loves other dogs. Counter-surfs if food is left out.',
    foodNotes: 'One and a half cups kibble, twice a day. Watch portions — prone to weight gain.',
    medicationNotes: 'Fish oil supplement with breakfast for his skin.',
    walkNotes: 'Loves long sniffy walks, 45 min ideally. Strong nose — keep leashed near trails.',
    emergencyNotes: 'Vet: Greenfield Animal Hospital — Dr. Kim, +1 (555) 390-2211.',
    otherNotes: '',
    hasAllergies: 'no',
    allergyNotes: '',
    goesToDogParks: 'yes',
    walkTimeFlexible: false,
    careSchedule: [
      { time: '07:00', taskType: 'meal', note: 'With fish oil supplement' },
      { time: '07:30', taskType: 'walk', note: '45 min sniffy walk' },
      { time: '12:30', taskType: 'potty', note: '' },
      { time: '18:30', taskType: 'meal', note: '' },
    ],
  },
]

/** Creates a handful of realistic sample dogs under the current signed-in user. */
export async function seedSampleDogs(): Promise<void> {
  for (const dog of sampleDogs) {
    await createDog(crypto.randomUUID(), dog)
  }
}
