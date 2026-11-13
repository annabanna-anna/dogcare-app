import { PRIMARY_DOG_KEY, type Dog, type DogCareNotes, type DogSize } from '../types'

type DogLike = Pick<Dog, 'name' | 'breed' | 'additionalDogs'>

/** "Alana" or "Alana & Eli" or "Alana, Eli & Momo" for a profile with grouped dogs. */
export function dogDisplayName(dog: DogLike): string {
  const names = [dog.name, ...dog.additionalDogs.map((d) => d.name)]
    .map((n) => n.trim())
    .filter(Boolean)
  if (names.length <= 1) return names[0] ?? dog.name
  if (names.length === 2) return `${names[0]} & ${names[1]}`
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

/** Same join, but for each dog's breed — used in subtitles alongside the name. */
export function dogDisplayBreed(dog: DogLike): string {
  const breeds = [dog.breed, ...dog.additionalDogs.map((d) => d.breed)]
    .map((b) => b.trim())
    .filter(Boolean)
  return breeds.join(' & ')
}

/** Lowercased text blob (names, breeds, owner) to match a search query against. */
export function dogSearchText(dog: DogLike & { ownerName: string }): string {
  return [dog.name, dog.breed, ...dog.additionalDogs.flatMap((d) => [d.name, d.breed]), dog.ownerName]
    .join(' ')
    .toLowerCase()
}

export interface GroupDog extends DogCareNotes {
  key: string   // PRIMARY_DOG_KEY or the group member's id — matches CareScheduleEntry.forDog
  name: string
  breed: string
  size: DogSize
  photoUrl?: string
}

export const CARE_NOTE_FIELDS = [
  'behaviorNotes',
  'foodNotes',
  'medicationNotes',
  'walkNotes',
  'emergencyNotes',
  'otherNotes',
  'hasAllergies',
  'allergyNotes',
  'goesToDogParks',
  'dogParkNotes',
] as const satisfies readonly (keyof DogCareNotes)[]

export function pickCareNotes(src: DogCareNotes): DogCareNotes {
  return Object.fromEntries(CARE_NOTE_FIELDS.map((f) => [f, src[f]])) as unknown as DogCareNotes
}

/** Every dog on the profile, the profile's own dog first. */
export function dogGroup(
  dog: Pick<Dog, 'name' | 'breed' | 'size' | 'photoUrl' | 'additionalDogs'> & DogCareNotes,
): GroupDog[] {
  return [
    { ...pickCareNotes(dog), key: PRIMARY_DOG_KEY, name: dog.name, breed: dog.breed, size: dog.size, photoUrl: dog.photoUrl },
    ...dog.additionalDogs.map((m) => ({
      ...pickCareNotes(m),
      key: m.id,
      name: m.name,
      breed: m.breed,
      size: m.size,
      photoUrl: m.photoUrl,
    })),
  ]
}

/** Name of the dog a schedule entry is limited to, or undefined when it's for every dog. */
export function scheduleEntryDogName(dog: DogLike & { additionalDogs: { id: string }[] }, forDog?: string): string | undefined {
  if (!forDog) return undefined
  if (forDog === PRIMARY_DOG_KEY) return dog.name
  return dog.additionalDogs.find((m) => m.id === forDog)?.name
}
