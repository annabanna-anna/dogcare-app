import type { Dog } from '../types'

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
