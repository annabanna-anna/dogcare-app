import { PRIMARY_DOG_KEY, type Dog, type DogCareNotes, type DogSize } from '../types'

type DogLike = Pick<Dog, 'name' | 'breed' | 'additionalDogs'>

/** "Alana" or "Alana & Eli" or "Alana, Eli & Momo". */
export function joinDogNames(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean)
  if (clean.length <= 1) return clean[0] ?? ''
  if (clean.length === 2) return `${clean[0]} & ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')} & ${clean[clean.length - 1]}`
}

/** "Alana" or "Alana & Eli" or "Alana, Eli & Momo" for a profile with grouped dogs. */
export function dogDisplayName(dog: DogLike): string {
  return joinDogNames([dog.name, ...dog.additionalDogs.map((d) => d.name)]) || dog.name
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

type GroupSource = Parameters<typeof dogGroup>[0]

/** The dogs a stay covers. Unset keys — or keys that no longer match anyone,
 *  e.g. after a dog was removed from the profile — mean every dog. */
export function stayingDogs(dog: GroupSource, dogKeys?: string[] | null): GroupDog[] {
  const group = dogGroup(dog)
  if (!dogKeys?.length) return group
  const staying = group.filter((d) => dogKeys.includes(d.key))
  return staying.length > 0 ? staying : group
}

/** Dogs on the profile a stay leaves at home — empty when everyone stays. */
export function dogsAtHome(dog: GroupSource, dogKeys?: string[] | null): GroupDog[] {
  const staying = new Set(stayingDogs(dog, dogKeys).map((d) => d.key))
  return dogGroup(dog).filter((d) => !staying.has(d.key))
}

/** Like dogDisplayName, but only the dogs a stay covers. */
export function stayDisplayName(dog: GroupSource, dogKeys?: string[] | null): string {
  return joinDogNames(stayingDogs(dog, dogKeys).map((d) => d.name)) || dog.name
}

/** Name of the dog a schedule entry is limited to, or undefined when it's for every dog. */
export function scheduleEntryDogName(dog: DogLike & { additionalDogs: { id: string }[] }, forDog?: string): string | undefined {
  if (!forDog) return undefined
  if (forDog === PRIMARY_DOG_KEY) return dog.name
  return dog.additionalDogs.find((m) => m.id === forDog)?.name
}
